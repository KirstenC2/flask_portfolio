from . import admin_bp, token_required
from flask import request, jsonify
from models.finance_models import db, Income, IncomeSource, Transaction  # 確保匯入 Transaction
from datetime import datetime
from sqlalchemy import func, extract
from decimal import Decimal
from sqlalchemy import text
import calendar
from datetime import datetime
from sqlalchemy import func, cast, Date

# --- 獲取該月收入清單 ---
@admin_bp.route('/incomes', methods=['GET','OPTIONS'])
@token_required
def get_incomes(current_admin):
    if request.method == 'OPTIONS':
        return ('', 204)
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    query = db.session.query(
        Income.id,
        Income.title,
        Transaction.amount,
        Transaction.transaction_date.label('income_date'),
        IncomeSource.name.label('source_name')
    ).join(Transaction, Income.transaction_id == Transaction.id)\
     .join(IncomeSource, Income.source_id == IncomeSource.id)

    if year and month:
        import calendar
        start_date = datetime(year, month, 1)
        _, last_day = calendar.monthrange(year, month)
        end_date = datetime(year, month, last_day, 23, 59, 59)
        query = query.filter(Transaction.transaction_date.between(start_date, end_date))

    results = query.order_by(Transaction.transaction_date.desc()).all()
    return jsonify([dict(r._asdict()) for r in results])

# --- 新增收入 (核心邏輯：雙表同步) ---
@admin_bp.route('/incomes', methods=['POST','OPTIONS'])
@token_required
def create_income(current_admin):
    if request.method == 'OPTIONS':
        return ('', 204)
    data = request.json
    try:
        # 1. 建立核心交易記錄
        new_transaction = Transaction(
            amount=data['amount'],
            transaction_type='INCOME',
            transaction_date=datetime.strptime(data['income_date'], '%Y-%m-%d'),
            status='COMPLETED',
            note=data.get('note', '')
        )
        db.session.add(new_transaction)
        db.session.flush() # 取得 transaction.id

        # 2. 建立詳細收入記錄
        new_income = Income(
            transaction_id=new_transaction.id,
            source_id=data['source_id'],
            title=data['title']
        )
        db.session.add(new_income)
        db.session.commit()
        return jsonify({"message": "收入登記成功", "id": new_income.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# --- 修改收入 ---
@admin_bp.route('/incomes/<int:income_id>', methods=['PUT','OPTIONS'])
@token_required
def update_income(current_admin, income_id):
    if request.method == 'OPTIONS':
        return ('', 204)
    data = request.json
    income = Income.query.get_or_404(income_id)
    transaction = Transaction.query.get(income.transaction_id)
    
    try:
        income.source_id = data.get('source_id', income.source_id)
        income.title = data.get('title', income.title)
        
        transaction.amount = data.get('amount', transaction.amount)
        if 'income_date' in data:
            transaction.transaction_date = datetime.strptime(data['income_date'], '%Y-%m-%d')
            
        db.session.commit()
        return jsonify({"message": "更新成功"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# --- 刪除收入 (聯動刪除) ---
@admin_bp.route('/incomes/<int:income_id>', methods=['DELETE','OPTIONS'])
@token_required
def delete_income(current_admin, income_id):
    if request.method == 'OPTIONS':
        return ('', 204)
    income = Income.query.get_or_404(income_id)
    transaction = Transaction.query.get(income.transaction_id)
    
    try:
        db.session.delete(income)
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({"message": "刪除成功"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/incomes/categories', methods=['GET','OPTIONS'])
@token_required
def get_income_categories(current_admin):
    if request.method == 'OPTIONS':
        return ('', 204)
    
    categories = IncomeSource.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in categories])
