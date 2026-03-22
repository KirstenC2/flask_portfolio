from . import admin_bp, token_required
from flask import request, jsonify
from models.finance_models import db, Expense, ExpenseCategory, Transaction  # 確保匯入 Transaction
from datetime import datetime
from sqlalchemy import func, extract
from decimal import Decimal
import calendar
from sqlalchemy import cast, Date
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
    
    # 1. 從 Transaction 發起查詢，過濾出所有「支出類」的交易
    # 包含一般支出 (expense) 和 還債 (debt_payment)
    query = Transaction.query.filter(
        Transaction.transaction_type.in_(['expense', 'debt_payment']),
        Transaction.status == 'COMPLETED'  # 通常只列出已完成的
    )
    
    # 2. 時間過濾
    if year:
        query = query.filter(extract('year', Transaction.transaction_date) == year)
    if month:
        query = query.filter(extract('month', Transaction.transaction_date) == month)
    
    # 3. 排序並抓取
    transactions = query.order_by(Transaction.transaction_date.desc()).all()
    
    # 4. 轉換成字典輸出
    return jsonify([_unified_transaction_to_dict(t) for t in transactions])

def _unified_transaction_to_dict(t):
    """
    統一處理交易轉換，確保欄位名稱與前端表格預期一致 (expense_date, category_name)
    """
    # 基礎資料
    data = {
        "transaction_id": t.id,
        "amount": float(t.amount),
        "id":t.expense.id if t.expense else None,
        # 將 date 改為 expense_date 以符合前端原本的預期
        "expense_date": t.transaction_date.strftime('%Y-%m-%d %H:%M'),
        "type": t.transaction_type,
        "note": t.note or "",
        "title": "未知項目",
        "category_name": "未分類",
        "category_color": "#94a3b8" # 預設灰色
    }
    
    # 如果是 一般支出 (Expense)
    if t.transaction_type == 'expense' and t.expense:
        data.update({
            "title": t.expense.title,
            "category_name": t.expense.category.name if t.expense.category else "未分類",
            "category_color": t.expense.category.color if (t.expense.category and t.expense.category.color) else "#1890ff"
        })
    
    # 如果是 債務還款 (Debt Payment)
    elif t.transaction_type == 'debt_payment' and t.payment_log:
        debt_title = t.payment_log.debt.title if t.payment_log.debt else "債務"
        data.update({
            "title": f"還款: {debt_title}",
            "category_name": "債務還款",
            "category_color": "#FF5733" # 債務專用橘紅色
        })
        
    return data
# @admin_bp.route('/expenses', methods=['GET'])
# @token_required
# def get_expenses(current_admin):
#     year = request.args.get('year', type=int)
#     month = request.args.get('month', type=int)
    
#     # 這裡要 Join Transaction 來過濾日期
#     query = Expense.query.join(Transaction)
    
#     if year:
#         query = query.filter(extract('year', Transaction.transaction_date) == year)
#     if month:
#         query = query.filter(extract('month', Transaction.transaction_date) == month)
    
#     expenses = query.order_by(Transaction.transaction_date.desc()).all()
#     return jsonify([_expense_to_dict(e) for e in expenses])

@admin_bp.route('/expenses/<int:expense_id>', methods=['PUT'])
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

    # 1. 修改過濾條件，包含 'expense' 與 'debt_payment'
    summary = db.session.query(
        func.date(Transaction.transaction_date).label('date'),
        func.sum(Transaction.amount).label('daily_total')
    ).filter(
        # 關鍵修改：允許這兩種類型同時計入支出統計
        Transaction.transaction_type.in_(['expense', 'debt_payment']),
        Transaction.status == 'COMPLETED', # 建議加上狀態檢查，確保只計算已發生的支出
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

    # 1. 計算一般支出的分類統計
    expense_stats = db.session.query(
        ExpenseCategory.name.label('category'),
        func.sum(Transaction.amount).label('value')
    ).join(Expense, Expense.category_id == ExpenseCategory.id)\
     .join(Transaction, Expense.transaction_id == Transaction.id)\
     .filter(extract('year', Transaction.transaction_date) == year)

    if month:
        expense_stats = expense_stats.filter(extract('month', Transaction.transaction_date) == month)
    
    res_expense = expense_stats.group_by(ExpenseCategory.name).all()

    # 2. 計算債務還款的總計
    debt_query = db.session.query(
        func.sum(Transaction.amount).label('value')
    ).filter(
        Transaction.transaction_type == 'debt_payment',
        extract('year', Transaction.transaction_date) == year
    )
    
    if month:
        debt_query = debt_query.filter(extract('month', Transaction.transaction_date) == month)
    
    debt_total = debt_query.scalar() or 0

    # 3. 合併結果
    final_stats = [{'category': row.category, 'value': float(row.value)} for row in res_expense]
    if debt_total > 0:
        final_stats.append({'category': '債務還款', 'value': float(debt_total)})

    return jsonify(final_stats), 200



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

