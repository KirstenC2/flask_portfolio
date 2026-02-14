from flask import Blueprint, request, jsonify
from flask_cors import CORS
from models.finance_models import db, DebtRecord, PaymentLog, Transaction  # 記得導入 Transaction
from decimal import Decimal
from datetime import datetime

debt_bp = Blueprint('debt', __name__)

# CORS 設定保持不變
CORS(debt_bp, 
     resources={r"/api/debt/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True)

def to_dict(dr: DebtRecord):
    """
    更新後的轉換邏輯：從關聯的 Transaction 取得金額與日期
    """
    return {
        "id": dr.id,
        "title": dr.title,
        "total_amount": float(dr.total_amount),
        "current_balance": float(dr.current_balance),
        "is_fully_paid": dr.is_fully_paid,
        "created_at": dr.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        "payments": [
            {
                "payment_log_id": p.id,
                "transaction_id": p.transaction.id,
                "amount": float(p.transaction.amount),
                "date": p.transaction.transaction_date.strftime('%Y-%m-%d %H:%M:%S'),
                "status": p.transaction.status,
                "note": p.transaction.note
            } for p in dr.payments
        ]
    }

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

@debt_bp.route('/api/debt/<int:id>', methods=['DELETE'])
def delete_debt(id):
    debt = DebtRecord.query.get_or_404(id)
    # 這裡要注意：因為我們設定了 cascade="all, delete-orphan"，
    # 刪除 Debt 會刪除 PaymentLog，進而刪除關聯的 Transaction
    db.session.delete(debt)
    db.session.commit()
    return jsonify({"message": "Debt and associated transactions deleted"}), 200

# --- 還款紀錄 (核心變動：與 Transaction 綁定) ---

@debt_bp.route('/api/debt/<int:debt_id>/payment', methods=['POST'])
def add_payment(debt_id):
    debt = DebtRecord.query.get_or_404(debt_id)
    data = request.get_json()
    
    try:
        # 1. 先建立核心 Transaction
        new_tx = Transaction(
            amount=Decimal(str(data.get('amount', 0))),
            transaction_type='debt_payment',
            status=data.get('status', 'COMPLETED'), # 預設完成，也可傳 PENDING 鎖定資金
            note=data.get('note'),
            transaction_date=datetime.fromisoformat(data['date']) if data.get('date') else datetime.utcnow()
        )
        db.session.add(new_tx)
        db.session.flush() # 取得 new_tx.id 但不 commit

        # 2. 建立 PaymentLog 並關聯 Transaction
        new_payment = PaymentLog(
            debt_id=debt.id,
            transaction_id=new_tx.id
        )
        db.session.add(new_payment)
        
        db.session.commit()
        
        # 回傳更新後的債務資訊
        return jsonify(to_dict(debt)), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@debt_bp.route('/api/debt/payment/<int:payment_id>', methods=['DELETE'])
def delete_payment(payment_id):
    payment = PaymentLog.query.get_or_404(payment_id)
    # 由於 Transaction 是強關聯，我們直接刪除對應的 Transaction
    # 在 Model 的設定下，PaymentLog 也會被 cascade 處理
    tx = Transaction.query.get(payment.transaction_id)
    db.session.delete(tx)
    db.session.commit()
    return jsonify({"message": "Payment transaction deleted"}), 200