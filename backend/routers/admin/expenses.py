from . import admin_bp, token_required
from flask import request, jsonify
from models.finance_models import db, Expense, ExpenseCategory, Transaction  # 確保匯入 Transaction
from datetime import datetime
from sqlalchemy import func, extract
from decimal import Decimal
from sqlalchemy import text
import calendar
from datetime import datetime
from sqlalchemy import func, cast, Date
# --- Helper 轉換函式 ---

def _expense_to_dict(e: Expense):
    # 金額、日期、備註現在都統一從關聯的 transaction 抓
    return {
        'id': e.id,
        'transaction_id': e.transaction_id,
        'category_id': e.category_id,
        'category_name': e.category.name if e.category else None,
        'title': e.title,
        'amount': float(e.transaction.amount),
        'status': e.transaction.status,
        'expense_date': e.transaction.transaction_date.isoformat(),
        'note': e.transaction.note,
        'created_at': e.transaction.created_at.isoformat()
    }

# --- Expenses CRUD ---

@admin_bp.route('/expenses', methods=['POST', 'OPTIONS'])
@token_required
def create_admin_expense(current_admin):
    data = request.get_json(force=True) or {}
    
    if not data.get('amount') or not data.get('category_id'):
        return jsonify({'message': 'Amount and Category are required'}), 400

    try:
        # 1. 建立核心 Transaction
        new_tx = Transaction(
            amount=Decimal(str(data.get('amount'))),
            transaction_type='expense',
            status=data.get('status', 'COMPLETED'), # 支持 PENDING (預算預留)
            note=data.get('note'),
            transaction_date=datetime.fromisoformat(data['expense_date']) if data.get('expense_date') else datetime.utcnow()
        )
        db.session.add(new_tx)
        db.session.flush() # 取得交易 ID

        # 2. 建立 Expense 業務紀錄
        new_expense = Expense(
            transaction_id=new_tx.id,
            category_id=data.get('category_id'),
            title=(data.get('title') or '').strip()
        )
        db.session.add(new_expense)
        db.session.commit()
        
        return jsonify(_expense_to_dict(new_expense)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Create failed', 'error': str(e)}), 400

@admin_bp.route('/expenses', methods=['GET'])
@token_required
def get_expenses(current_admin):
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    # 這裡要 Join Transaction 來過濾日期
    query = Expense.query.join(Transaction)
    
    if year:
        query = query.filter(extract('year', Transaction.transaction_date) == year)
    if month:
        query = query.filter(extract('month', Transaction.transaction_date) == month)
    
    expenses = query.order_by(Transaction.transaction_date.desc()).all()
    return jsonify([_expense_to_dict(e) for e in expenses])

@admin_bp.route('/expenses/<int:expense_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_admin_expense(current_admin, expense_id):
    e = Expense.query.get_or_404(expense_id)
    tx = e.transaction # 直接抓關聯的交易
    data = request.get_json(force=True) or {}
    
    # 更新 Expense 欄位
    if 'title' in data: e.title = data['title'].strip()
    if 'category_id' in data: e.category_id = data['category_id']
    
    # 更新 Transaction 欄位
    if 'amount' in data: tx.amount = Decimal(str(data['amount']))
    if 'note' in data: tx.note = data['note']
    if 'expense_date' in data: tx.transaction_date = datetime.fromisoformat(data['expense_date'])
    if 'status' in data: tx.status = data['status']
        
    db.session.commit()
    return jsonify(_expense_to_dict(e))

@admin_bp.route('/expenses/<int:expense_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_expense(current_admin, expense_id):
    e = Expense.query.get_or_404(expense_id)
    # 刪除 Transaction，因為設定了 cascade，Expense 會跟著消失
    db.session.delete(e.transaction)
    db.session.commit()
    return jsonify({'message': 'Expense deleted'})

# --- 統計相關 API (都要改從 Transaction 抓) ---

@admin_bp.route('/expenses/daily-summary', methods=['GET'])
@token_required
def get_expense_daily_summary(current_admin):
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    # 改為 Query Transaction 並 Filter type='expense'
    summary = db.session.query(
        func.date(Transaction.transaction_date).label('date'),
        func.sum(Transaction.amount).label('daily_total')
    ).filter(
        Transaction.transaction_type == 'expense',
        extract('year', Transaction.transaction_date) == year,
        extract('month', Transaction.transaction_date) == month
    ).group_by(func.date(Transaction.transaction_date)).all()

    return jsonify([{"date": str(s.date), "daily_total": float(s.daily_total)} for s in summary])

@admin_bp.route('/expense/categories', methods=['GET'])
# @admin_required
def get_categories():
    categories = ExpenseCategory.query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'icon': c.icon, # e.g., "ShoppingCartOutlined"
        'color': c.color # e.g., "#1890ff"
    } for c in categories])

@admin_bp.route('/expense/categories', methods=['POST'])
# @admin_required
def create_category():
    data = request.json
    new_cat = ExpenseCategory(
        name=data.get('name'),
        icon=data.get('icon', 'TagOutlined'),
        color=data.get('color', '#1890ff')
    )
    db.session.add(new_cat)
    db.session.commit()
    return jsonify({'message': 'Category created successfully'}), 201

@admin_bp.route('/expenses/stats', methods=['GET'])
@token_required
def get_expense_stats(current_admin):
    year = request.args.get('year', type=int) or datetime.utcnow().year
    
    # 在 PostgreSQL 中使用 to_char 而不是 strftime
    stats = db.session.query(
        func.to_char(Transaction.transaction_date, 'YYYY-MM').label('month'),
        func.sum(Transaction.amount).label('total')
    ).join(Expense).filter(
        db.extract('year', Transaction.transaction_date) == year,
        Transaction.status == 'COMPLETED'
    ).group_by('month').order_by('month').all()

    return jsonify([{"month": s.month, "total": float(s.total)} for s in stats]), 200

@admin_bp.route('/expenses/stats/by-category', methods=['GET'])
@token_required
def get_category_stats(current_admin):
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    query = db.session.query(
        ExpenseCategory.name.label('category'),
        func.sum(Transaction.amount).label('value')
    ).join(Expense, Expense.category_id == ExpenseCategory.id)\
     .join(Transaction, Expense.transaction_id == Transaction.id)

    query = query.filter(extract('year', Transaction.transaction_date) == year)
    if month:
        query = query.filter(extract('month', Transaction.transaction_date) == month)

    stats = query.group_by(ExpenseCategory.name).all()

    return jsonify([{
        'category': row.category,
        'value': float(row.value)
    } for row in stats]), 200



@admin_bp.route('/expenses/daily-summary', methods=['GET'])
@token_required
def get_daily_summary(current_admin):
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    if not year or not month:
        return jsonify([])

    # 1. 建立該月的起止時間 (考慮到時分秒)
    start_date = datetime(year, month, 1, 0, 0, 0)
    _, last_day = calendar.monthrange(year, month)
    end_date = datetime(year, month, last_day, 23, 59, 59)

    # 2. 執行查詢
    summary = db.session.query(
        # 強制轉型為 Date，避免帶有時間資訊導致 Group By 失敗
        cast(Transaction.transaction_date, Date).label('date'),
        func.sum(Transaction.amount).label('daily_total')
    ).filter(
        Transaction.transaction_date.between(start_date, end_date)
        # 使用 ilike 處理大小寫不敏感，確保 income/INCOME 都被排除
        # Transaction.transaction_type.ilike('INCOME') == False,
        # 暫時先註解掉 status 檢查，看看是不是因為 status 導致沒資料
        # Transaction.status == 'COMPLETED' 
    ).group_by(
        cast(Transaction.transaction_date, Date)
    ).order_by(
        cast(Transaction.transaction_date, Date)
    ).all()

    # 3. 輸出
    return jsonify([
        {
            "date": s.date.strftime('%Y-%m-%d'),
            "daily_total": float(s.daily_total)
        } for s in summary
    ])