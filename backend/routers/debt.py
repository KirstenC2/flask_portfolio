import os
from flask import Blueprint, request, jsonify
from flask_cors import CORS
from models import db, DebtRecord, PaymentLog
from decimal import Decimal
from datetime import datetime

debt_bp = Blueprint('debt', __name__)

# 依照你的需求設定 CORS
CORS(debt_bp, 
     resources={r"/api/debt/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def payment_to_dict(p):
    """處理還款紀錄轉換 (注意：這裡沒有 title)"""
    return {
        "id": p.id,
        "debt_id": p.debt_id,
        "amount": float(p.amount),
        "payment_date": p.payment_date.isoformat(),
        "note": p.note
    }

def to_dict(dr: DebtRecord, redact: bool = False):
    """
    將 DebtRecord 物件轉換為字典格式
    :param dr: DebtRecord 實體
    :param redact: 是否脫敏（隱藏敏感資訊）
    """
    # 基礎資料轉換
    data = {
        "id": dr.id,
        "title": dr.title,
        "total_amount": float(dr.total_amount),
        "current_balance": float(dr.current_balance),
        "is_fully_paid": dr.current_balance <= 0,
        "created_at": dr.created_at.strftime('%Y-%m-%d %H:%M:%S') if dr.created_at else None,
        "updated_at": dr.updated_at.strftime('%Y-%m-%d %H:%M:%S') if dr.updated_at else None,
    }

    # 處理關聯的還款紀錄 (PaymentLog)
    # 如果 redact 為 True，我們可能只回傳還款總額，而不回傳詳細列表
    if not redact:
        data["payments"] = [
            {
                "id": p.id,
                "amount": float(p.amount),
                "payment_date": p.payment_date.strftime('%Y-%m-%d %H:%M:%S'),
                "note": p.note
            } for p in dr.payments
        ]
    else:
        # 脫敏模式：隱藏詳細紀錄，隱藏標題部分字元，或隱藏備註
        data["title"] = data["title"][0] + "***" if len(data["title"]) > 1 else "*"
        data["payments_count"] = len(dr.payments)
        # 僅顯示已還總額，不顯示每筆細節
        data["total_paid"] = float(sum(p.amount for p in dr.payments))

    return data
# --- 債務主表 ---

@debt_bp.route('/api/debt', methods=['POST'])
def create_debt():
    data = request.get_json()
    new_debt = DebtRecord(
        title=data.get('title'),
        total_amount=Decimal(str(data.get('total_amount', 0)))
    )
    db.session.add(new_debt)
    db.session.commit()
    return jsonify(to_dict(new_debt)), 201

@debt_bp.route('/api/debt', methods=['GET'])
def list_debts():
    debts = DebtRecord.query.all()
    return jsonify([to_dict(d) for d in debts]), 200

@debt_bp.route('/api/debt/<int:id>', methods=['GET'])
def get_debt(id):
    debt = DebtRecord.query.get_or_404(id)
    return jsonify(to_dict(debt)), 200

@debt_bp.route('/api/debt/<int:id>', methods=['PATCH'])
def update_debt(id):
    debt = DebtRecord.query.get_or_404(id)
    data = request.get_json()
    if 'title' in data: debt.title = data['title']
    if 'total_amount' in data: debt.total_amount = Decimal(str(data['total_amount']))
    db.session.commit()
    return jsonify(to_dict(debt)), 200

@debt_bp.route('/api/debt/<int:id>', methods=['DELETE'])
def delete_debt(id):
    debt = DebtRecord.query.get_or_404(id)
    db.session.delete(debt)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

# --- 還款紀錄 (紀錄每次還款日期) ---

@debt_bp.route('/api/debt/<int:debt_id>/payment', methods=['POST'])
def add_payment(debt_id):
    debt = DebtRecord.query.get_or_404(debt_id)
    data = request.get_json()
    
    new_payment = PaymentLog(
        debt_id=debt.id,
        amount=Decimal(str(data.get('amount', 0))),
        note=data.get('note'),
        # 支援從前端傳送日期字串 (YYYY-MM-DD)，否則用現在時間
        payment_date=datetime.fromisoformat(data['date']) if data.get('date') else datetime.utcnow()
    )
    
    db.session.add(new_payment)
    db.session.commit()
    return jsonify(payment_to_dict(new_payment)), 201

@debt_bp.route('/api/debt/payment/<int:payment_id>', methods=['DELETE'])
def delete_payment(payment_id):
    payment = PaymentLog.query.get_or_404(payment_id)
    db.session.delete(payment)
    db.session.commit()
    return jsonify(payment_to_dict(payment)), 200