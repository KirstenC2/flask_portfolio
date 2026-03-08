from flask import request, jsonify
from models.saving_models import db, SavingGoal, GoalPlan, SavingLog
from models.finance_models import Transaction
from datetime import datetime, date
from sqlalchemy import func
from . import admin_bp, token_required

# 輔助函數：將資料轉為字典
def _goal_to_dict(goal, monthly_push=0):
    return {
        'id': goal.id,
        'title': goal.title,
        'target_amount': float(goal.target_amount),
        'icon': goal.icon,
        'monthly_push': float(monthly_push)
    }

# --- 1. 建立目標 (POST) ---
@admin_bp.route('/saving/goals', methods=['POST'])
@token_required
def create_saving_goal(current_admin):
    data = request.json
    try:
        # 建立目標主體
        new_goal = SavingGoal(
            title=data['title'],
            target_amount=data['target_amount'],
            icon=data.get('icon', '💰')
        )
        db.session.add(new_goal)
        db.session.flush() # 取得 ID 供 Plan 使用
        
        # 建立該目標的第一筆撥款計畫
        # effective_date 建議傳入該月 1 號 (例如 "2026-02-01")
        eff_date = datetime.strptime(data['effective_date'], '%Y-%m-%d').date()
        
        first_plan = GoalPlan(
            goal_id=new_goal.id,
            monthly_push=data['monthly_push'],
            effective_date=eff_date
        )
        db.session.add(first_plan)
        db.session.commit()
        
        return jsonify(_goal_to_dict(new_goal, data['monthly_push'])), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# --- 2. 查詢特定月份的所有目標 (GET) ---
# 這是為了對應前端 SavingSection 的月份切換
@admin_bp.route('/saving/goals', methods=['GET'])
@token_required
def get_saving_goals(current_admin):
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    target_date = date(year, month, 1)

    # 1. 核心邏輯：計算每個 Goal 的存款總額 (Transaction 狀態必須為 COMPLETED)
    # 這是為了讓你的進度條有數據來源
    total_saved_subq = db.session.query(
        SavingLog.goal_id,
        func.sum(Transaction.amount).label('total_deposited')
    ).join(Transaction, SavingLog.transaction_id == Transaction.id)\
     .filter(Transaction.status == 'COMPLETED')\
     .group_by(SavingLog.goal_id).subquery()

    # 2. 獲取當月計畫金額 (你先前的邏輯)
    plan_subq = db.session.query(
        GoalPlan.goal_id,
        func.max(GoalPlan.effective_date).label('latest_date')
    ).filter(GoalPlan.effective_date <= target_date)\
     .group_by(GoalPlan.goal_id).subquery()

    # 3. 合併查詢所有欄位
    results = db.session.query(
        SavingGoal, 
        GoalPlan.monthly_push,
        total_saved_subq.c.total_deposited
    ).outerjoin(plan_subq, SavingGoal.id == plan_subq.c.goal_id)\
     .outerjoin(GoalPlan, (GoalPlan.goal_id == plan_subq.c.goal_id) & (GoalPlan.effective_date == plan_subq.c.latest_date))\
     .outerjoin(total_saved_subq, SavingGoal.id == total_saved_subq.c.goal_id)\
     .all()

    return jsonify([{
        'id': g.id,
        'title': g.title,
        'target_amount': float(g.target_amount),
        'icon': g.icon,
        'monthly_push': float(push) if push else 0,
        'current_amount': float(deposited) if deposited else 0  # 💡 這就是進度條的燃料！
    } for g, push, deposited in results])

# --- 3. 調整撥款計畫 (PUT) ---
# 用來「更新」或「新增」某個時間點後的撥款金額
@admin_bp.route('/saving/goals/<int:goal_id>/plan', methods=['PUT','OPTIONS'])
@token_required
def adjust_goal_plan(current_admin, goal_id):
    data = request.json
    eff_date = datetime.strptime(data['effective_date'], '%Y-%m-%d').date()
    
    # 檢查該目標在該月份是否已經有紀錄 (Upsert 邏輯)
    existing_plan = GoalPlan.query.filter_by(goal_id=goal_id, effective_date=eff_date).first()
    
    if existing_plan:
        existing_plan.monthly_push = data['monthly_push']
    else:
        new_plan = GoalPlan(
            goal_id=goal_id,
            monthly_push=data['monthly_push'],
            effective_date=eff_date
        )
        db.session.add(new_plan)
    
    db.session.commit()
    return jsonify({'message': 'Plan adjusted successfully'})

# --- 4. 刪除目標 (DELETE) ---
@admin_bp.route('/saving/goals/<int:goal_id>', methods=['DELETE','OPTIONS'])
@token_required
def delete_saving_goal(current_admin, goal_id):
    goal = SavingGoal.query.get_or_404(goal_id)
    db.session.delete(goal)
    db.session.commit()
    return jsonify({'message': 'Goal deleted'})

@admin_bp.route('/saving/deposit', methods=['POST'])
@token_required
def deposit_to_goal(current_admin):
    data = request.get_json()
    
    try:
        # 1. 建立核心交易紀錄
        new_tx = Transaction(
            amount=data['amount'],
            transaction_type='saving_reserve',
            status='COMPLETED',
            transaction_date=datetime.strptime(data['transaction_date'], '%Y-%m-%d %H:%M:%S'),
            note=data.get('note', '')
        )
        db.session.add(new_tx)
        db.session.flush() # 取得 new_tx.id

        # 2. 建立儲蓄關聯紀錄
        new_log = SavingLog(
            goal_id=data['goal_id'],
            transaction_id=new_tx.id
        )
        db.session.add(new_log)
        
        db.session.commit()
        return jsonify({"message": "Deposit recorded"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/saving/goals/<int:goal_id>/history', methods=['GET'])
@token_required
def get_saving_history(current_admin, goal_id):
    # 查詢與該 Goal 綁定的所有 SavingLog
    logs = SavingLog.query.filter_by(goal_id=goal_id).all()
    
    history = []
    for log in logs:
        tx = log.transaction
        history.append({
            "id": tx.id,
            "amount": float(tx.amount),
            "transaction_date": tx.transaction_date.isoformat(),
            "note": tx.note,
            "status": tx.status
        })
    
    # 按日期排序（最新在前）
    history.sort(key=lambda x: x['transaction_date'], reverse=True)
    return jsonify(history)