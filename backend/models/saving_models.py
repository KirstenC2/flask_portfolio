from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import relationship
from . import db

# ----------------------------------------------------------------
# 儲蓄模組升級版
# ----------------------------------------------------------------

class SavingGoal(db.Model):
    __tablename__ = 'saving_goals'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Numeric(15, 2), nullable=False) # 建議改用 Numeric 保持精確
    icon = db.Column(db.String(20), default='💰')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 1. 關聯到預算計畫 (你原本的 GoalPlan)
    plans = relationship("GoalPlan", back_populates="goal", cascade="all, delete-orphan")
    
    # 2. 關聯到實際交易流水 (SavingLog)
    saving_logs = relationship("SavingLog", back_populates="goal", cascade="all, delete-orphan")

    @property
    def current_amount(self):
        """核心：透過 Transaction 自動加總已完成的存款"""
        # 串接到 Transaction 表，過濾狀態為 COMPLETED 的金額
        total = sum(log.transaction.amount for log in self.saving_logs 
                    if log.transaction.status == 'COMPLETED')
        return Decimal(str(total))

class GoalPlan(db.Model):
    __tablename__ = 'goal_monthly_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('saving_goals.id'), nullable=False)
    monthly_push = db.Column(db.Numeric(15, 2), nullable=False)
    effective_date = db.Column(db.Date, nullable=False)
    
    goal = relationship("SavingGoal", back_populates="plans")

class SavingLog(db.Model):
    """
    這是一個橋接表：紀錄哪一筆 Transaction 是存入哪一個 SavingGoal
    """
    __tablename__ = 'saving_logs'

    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('saving_goals.id'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)

    goal = relationship("SavingGoal", back_populates="saving_logs")
    transaction = relationship("Transaction", back_populates="saving_log")