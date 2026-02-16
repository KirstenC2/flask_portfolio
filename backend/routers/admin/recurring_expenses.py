from . import admin_bp, token_required
from flask import request, jsonify
from models.finance_models import db, RecurringExpense

@admin_bp.route('/expense/recurring', methods=['GET'])
@token_required
def get_recurring_templates(current_admin):
    templates = RecurringExpense.query.all()
    return jsonify([{
        "id": t.id,
        "name": t.name,
        "amount": float(t.amount),
        "day_of_month": t.day_of_month,
        "category_id": t.category_id
    } for t in templates])

# --- 新增固定支出模板 ---
@admin_bp.route('/expense/recurring', methods=['POST','OPTIONS'])
@token_required
def create_recurring_template(current_admin):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    data = request.json
    try:
        new_template = RecurringExpense(
            name=data['name'],
            amount=data['amount'],
            day_of_month=data.get('day_of_month', 1),
            category_id=data['category_id']
        )
        db.session.add(new_template)
        db.session.commit()
        return jsonify({"message": "模板創建成功", "id": new_template.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# --- 更新固定支出模板 ---
@admin_bp.route('/expense/recurring/<int:id>', methods=['PUT','OPTIONS'])
@token_required
def update_recurring_template(current_admin, id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    template = RecurringExpense.query.get_or_404(id)
    data = request.json
    
    template.name = data.get('name', template.name)
    template.amount = data.get('amount', template.amount)
    template.day_of_month = data.get('day_of_month', template.day_of_month)
    template.category_id = data.get('category_id', template.category_id)
    
    db.session.commit()
    return jsonify({"message": "模板已更新"})

# --- 刪除固定支出模板 ---
@admin_bp.route('/expense/recurring/<int:id>', methods=['DELETE','OPTIONS'])
@token_required
def delete_recurring_template(current_admin, id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    template = RecurringExpense.query.get_or_404(id)
    db.session.delete(template)
    db.session.commit()
    return jsonify({"message": "模板已刪除"})