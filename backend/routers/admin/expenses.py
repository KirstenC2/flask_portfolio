from . import admin_bp, token_required
from flask import request, jsonify
from models.finance_models import db, Expense,ExpenseCategory
from datetime import datetime
from sqlalchemy import func, extract

def _expense_to_dict(e: Expense):
    return {
        'id': e.id,
        'category_id': e.category_id,
        'category_name': e.category.name if e.category else None,
        'title': e.title,
        'amount': float(e.amount) if e.amount else 0.0,
        'expense_date': e.expense_date.isoformat() if e.expense_date else None,
        'note': e.note,
        'created_at': e.created_at.isoformat() if e.created_at else None
    }

def _category_to_dict(c: ExpenseCategory):
    return {
        'id': c.id,
        'name': c.name,
        'icon': c.icon,
        'color': c.color,
        'total_spent': float(c.total_spent)
    }

# ----------------------
# Expense Categories CRUD
# ----------------------

@admin_bp.route('/expense-categories', methods=['GET', 'OPTIONS'])
@token_required
def list_expense_categories(current_admin):
    categories = ExpenseCategory.query.all()
    return jsonify([_category_to_dict(c) for c in categories])

@admin_bp.route('/expense-categories', methods=['POST', 'OPTIONS'])
@token_required
def create_expense_category(current_admin):
    data = request.get_json(force=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'message': 'Category name is required'}), 400
    
    c = ExpenseCategory(
        name=name,
        icon=data.get('icon'),
        color=data.get('color')
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(_category_to_dict(c)), 201

# ----------------------
# Expenses CRUD
# ----------------------

@admin_bp.route('/expenses', methods=['GET', 'OPTIONS'])
@token_required
def get_admin_expenses(current_admin):
    try:
        # 從 URL 參數獲取年份 (例如: /api/admin/expenses?year=2026)
        year_param = request.args.get('year', type=int)

        query = Expense.query

        # 如果有傳入年份，則進行過濾
        if year_param:
            query = query.filter(extract('year', Expense.expense_date) == year_param)

        # 按照日期排序（最新的在前）
        expenses = query.order_by(Expense.expense_date.desc()).all()
        
        return jsonify([_expense_to_dict(e) for e in expenses])
    except Exception as e:
        print(f"Error fetching expenses: {str(e)}")
        return jsonify({'message': '獲取支出列表失敗', 'error': str(e)}), 500

@admin_bp.route('/expenses', methods=['POST', 'OPTIONS'])
@token_required
def create_admin_expense(current_admin):
    data = request.get_json(force=True) or {}
    
    # Validation
    if not data.get('amount') or not data.get('category_id'):
        return jsonify({'message': 'Amount and Category are required'}), 400

    e = Expense(
        title=(data.get('title') or '').strip(),
        amount=data.get('amount'),
        category_id=data.get('category_id'),
        note=data.get('note'),
        # Allow user to pick a date, otherwise use now
        expense_date=datetime.fromisoformat(data['expense_date']) if data.get('expense_date') else datetime.utcnow()
    )
    db.session.add(e)
    db.session.commit()
    return jsonify(_expense_to_dict(e)), 201

@admin_bp.route('/expenses/<int:expense_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_admin_expense(current_admin, expense_id):
    e = Expense.query.get_or_404(expense_id)
    data = request.get_json(force=True) or {}
    
    if 'title' in data:
        e.title = (data.get('title') or '').strip()
    if 'amount' in data:
        e.amount = data.get('amount')
    if 'category_id' in data:
        e.category_id = data.get('category_id')
    if 'note' in data:
        e.note = data.get('note')
    if 'expense_date' in data:
        e.expense_date = datetime.fromisoformat(data['expense_date'])
        
    db.session.commit()
    return jsonify(_expense_to_dict(e))

@admin_bp.route('/expenses/<int:expense_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_expense(current_admin, expense_id):
    e = Expense.query.get_or_404(expense_id)
    db.session.delete(e)
    db.session.commit()
    return jsonify({'message': 'Expense deleted'})

@admin_bp.route('/expenses/stats', methods=['GET', 'OPTIONS'])
@token_required
def get_expense_stats(current_admin):
    try:
        # 從 URL 參數獲取年份，預設為今年
        selected_year = request.args.get('year', default=datetime.utcnow().year, type=int)
        current_month_str = datetime.utcnow().strftime('%Y-%m')

        # 1. 每月統計 (過濾特定年份)
        monthly_query = db.session.query(
            func.to_char(Expense.expense_date, 'YYYY-MM').label('month'),
            func.sum(Expense.amount).label('total')
        ).filter(
            Expense.expense_date.isnot(None),
            extract('year', Expense.expense_date) == selected_year
        ).group_by('month').order_by('month').all()

        # 2. 每日統計 (保持不變，通常只看當月)
        daily_query = db.session.query(
            func.to_char(Expense.expense_date, 'YYYY-MM-DD').label('day'),
            func.sum(Expense.amount).label('total')
        ).filter(
            func.to_char(Expense.expense_date, 'YYYY-MM') == current_month_str
        ).group_by('day').order_by('day').all()

        return jsonify({
            "monthly": [{"month": r.month, "total": float(r.total or 0)} for r in monthly_query if r.month],
            "daily": [{"day": r.day, "total": float(r.total or 0)} for r in daily_query if r.day]
        })
    except Exception as e:
        return jsonify({'message': '後端統計計算錯誤', 'error': str(e)}), 500

@admin_bp.route('/expenses/by-category', methods=['GET', 'OPTIONS'])
@token_required
def get_expenses_by_category(current_admin):
    """
    Useful for Pie Charts: Spend per category.
    """
    stats = db.session.query(
        ExpenseCategory.name,
        func.sum(Expense.amount).label('total')
    ).join(Expense, ExpenseCategory.id == Expense.category_id)\
     .group_by(ExpenseCategory.name).all()

    return jsonify([
        {'category': name, 'total': float(total or 0)} 
        for name, total in stats
    ])