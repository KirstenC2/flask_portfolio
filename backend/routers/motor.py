from flask import Blueprint, request, jsonify
from models import db, MotorRecord, MotorTaxes
from datetime import datetime

motor_bp = Blueprint('motor', __name__)

@motor_bp.route('/api/motor', methods=['GET'])
def get_motor_records():
    records = MotorRecord.query.order_by(MotorRecord.mileage.desc()).all()
    return jsonify([r.to_dict() for r in records])

@motor_bp.route('/api/motor', methods=['POST'])
def add_motor_record():
    data = request.get_json()
    new_record = MotorRecord(
        item_name=data.get('item_name', '換機油'),
        mileage=int(data['mileage']),
        price=int(data['price']),
        maintenance_date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        note=data.get('note', '')
    )
    db.session.add(new_record)
    db.session.commit()
    return jsonify(new_record.to_dict()), 201


# [PUT] 編輯紀錄
@motor_bp.route('/api/motor/record/<int:id>', methods=['PUT'])
def update_motor_record(id):
    record = MotorRecord.query.get_or_404(id)
    data = request.json
    
    record.maintenance_date = data.get('maintenance_date', record.maintenance_date)
    record.mileage = data.get('mileage', record.mileage)
    record.price = data.get('price', record.price)
    record.note = data.get('note', record.note)
    
    db.session.commit()
    return jsonify({"message": "Updated"}), 200

# [DELETE] 刪除紀錄
@motor_bp.route('/api/motor/record/<int:id>', methods=['DELETE'])
def delete_motor_record(id):
    record = MotorRecord.query.get_or_404(id)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@motor_bp.route('/api/motor/taxes', methods=['GET'])
def get_taxes():
    try:
        # 按照到期日排序，快過期的排前面
        docs = MotorTaxes.query.order_by(MotorTaxes.expired_date.asc()).all()
        return jsonify([{
            'id': d.id,
            'title': d.title,
            'expired_date': d.expired_date.strftime('%Y-%m-%d') if d.expired_date else None,
            'amount': d.amount,
            'created_at': d.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for d in docs]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@motor_bp.route('/api/motor/taxes', methods=['POST'])
def add_tax():
    data = request.json
    try:
        # 轉換前端傳來的日期字串為 Python date 物件
        expired_date = None
        if data.get('expired_date'):
            expired_date = datetime.strptime(data['expired_date'], '%Y-%m-%d').date()

        new_tax = MotorTaxes(
            title=data['title'],
            expired_date=expired_date,
            amount=data.get('amount')
        )
        db.session.add(new_tax)
        db.session.commit()
        return jsonify({"message": "文件新增成功", "id": new_tax.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@motor_bp.route('/api/motor/taxes/<int:tax_id>', methods=['PUT'])
def update_tax(tax_id):
    tax = MotorTaxes.query.get_or_404(tax_id)
    data = request.json
    try:
        tax.title = data.get('title', tax.title)
        tax.amount = data.get('amount', tax.amount)
        
        if 'expired_date' in data:
            if data['expired_date']:
                tax.expired_date = datetime.strptime(data['expired_date'], '%Y-%m-%d').date()
            else:
                tax.expired_date = None
        
        db.session.commit()
        return jsonify({"message": "文件更新成功"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@motor_bp.route('/api/motor/taxes/<int:tax_id>', methods=['DELETE'])
def delete_tax(tax_id):
    tax = MotorTaxes.query.get_or_404(tax_id)
    try:
        db.session.delete(tax)
        db.session.commit()
        return jsonify({"message": "文件已刪除"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400