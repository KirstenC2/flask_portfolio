from flask import Blueprint, request, jsonify
from models import db, MotorRecord
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