from . import admin_bp, token_required
from flask import request, jsonify
from models.quotation_models import db, StandardService, PublicQuotation, PublicQuotationItem
import uuid
from datetime import datetime

# [GET] 獲取所有標準服務清單 (供前端 Select 下拉選單使用)
@admin_bp.route('/services', methods=['GET'])
@token_required
def get_services(current_admin):
    category = request.args.get('category')
    query = StandardService.query.filter_by(is_active=True)
    if category:
        query = query.filter_by(category=category)
    
    services = query.order_by(StandardService.sort_order.asc()).all()
    return jsonify([s.to_dict() for s in services])

# [POST] 新增服務到軍火庫 (管理後台用)
@admin_bp.route('/services', methods=['POST'])
@token_required
def add_service_template(current_admin):
    data = request.json
    new_service = StandardService(
        category=data['category'],
        name=data['name'],
        default_description=data.get('description', ''),
        base_price=data.get('price', 0.0),
        unit=data.get('unit', '式')
    )
    db.session.add(new_service)
    db.session.commit()
    return jsonify({"message": "服務模板已建立", "id": new_service.id}), 201



# [POST] 建立報價單 (從前端 Table Form 提交)
@admin_bp.route('/quotations', methods=['POST'])
@token_required
def create_quotation(current_admin):
    data = request.json
    items_data = data.get('items', [])
    
    # 1. 生成唯一的報價單號
    quo_no = f"QUO-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    
    # 2. 建立報價單主表
    new_quo = PublicQuotation(
        quotation_no=quo_no,
        client_name=data['client_name'],
        subject=data['subject'],
        tax_rate=data.get('tax_rate', 0.05),
        discount=data.get('discount', 0.0),
        payment_terms=data.get('payment_terms', ''),
        note=data.get('note', ''),
        status='DRAFT'
    )
    
    db.session.add(new_quo)
    db.session.flush() # 取得 new_quo.id 以供明細使用
    
    # 3. 處理明細項目 (Quotation Items)
    current_subtotal = 0
    for item in items_data:
        # 計算該項小計
        price = float(item.get('unit_price', 0))
        qty = float(item.get('quantity', 1))
        item_subtotal = price * qty
        current_subtotal += item_subtotal
        
        quo_item = PublicQuotationItem(
            quotation_id=new_quo.id,
            service_id=item.get('service_id'), # 關聯模板 ID (選填)
            title=item['title'],
            description=item.get('description', ''),
            unit_price=price,
            quantity=qty,
            subtotal=item_subtotal
        )
        db.session.add(quo_item)
    
    # 4. 最終金額結算
    new_quo.subtotal = current_subtotal
    taxable = current_subtotal - new_quo.discount
    new_quo.total_amount = taxable + (taxable * new_quo.tax_rate)
    
    db.session.commit()
    return jsonify({"message": "報價單已儲存", "quotation_no": quo_no, "id": new_quo.id}), 201

# [GET] 獲取報價單詳情 (供預覽或列印使用)
@admin_bp.route('/quotations/<int:id>', methods=['GET'])
@token_required
def get_quotation_detail(current_admin, id):
    quo = PublicQuotation.query.get_or_404(id)
    items = [{
        "title": i.title,
        "description": i.description,
        "unit_price": i.unit_price,
        "quantity": i.quantity,
        "subtotal": i.subtotal
    } for i in quo.items]
    
    return jsonify({
        "info": {
            "no": quo.quotation_no,
            "client": quo.client_name,
            "subject": quo.subject,
            "total": quo.total_amount,
            "subtotal": quo.subtotal,
            "tax": quo.total_amount - (quo.subtotal - quo.discount),
            "discount": quo.discount,
            "terms": quo.payment_terms,
            "status": quo.status
        },
        "items": items
    })