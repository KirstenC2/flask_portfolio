from datetime import datetime
from decimal import Decimal
from . import db

# ----------------------------------------------------------------
# 1. 債務主表：紀錄總額、狀態
# ----------------------------------------------------------------
class DebtRecord(db.Model):
    __tablename__ = 'debt_records'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)  # 標題，例如 "跟小明借的午餐費"
    total_amount = db.Column(db.Numeric(15, 2), nullable=False)  # 原始總金額
    
    # 時間戳記
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 反向關聯：透過 debt_record.payments 即可取得所有還款紀錄
    # backref 會自動在 PaymentLog 增加一個 .debt 屬性
    payments = db.relationship('PaymentLog', backref='debt', lazy=True, cascade="all, delete-orphan")

    @property
    def current_balance(self):
        """計算目前剩餘應還金額"""
        paid_total = sum(p.amount for p in self.payments)
        return self.total_amount - Decimal(str(paid_total))

    @property
    def is_fully_paid(self):
        """是否已還清"""
        return self.current_balance <= 0

    def __repr__(self):
        return f'<Debt {self.title}: {self.current_balance}/{self.total_amount}>'

# ----------------------------------------------------------------
# 2. 還款明細表：紀錄每次還錢的日期、金額
# ----------------------------------------------------------------
class PaymentLog(db.Model):
    __tablename__ = 'payment_logs'

    id = db.Column(db.Integer, primary_key=True)
    debt_id = db.Column(db.Integer, db.ForeignKey('debt_records.id'), nullable=False)
    
    # 核心紀錄：還了多少錢、什麼時候還的
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    payment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # 使用者可以自定義日期
    
    # 備註（例如：轉帳單號、現金交付等）
    note = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Payment {self.payment_date}: {self.amount}>'

# ----------------------------------------------------------------
# 1. Expense Category: Groups expenses (e.g., "Food", "Transport")
# ----------------------------------------------------------------
class ExpenseCategory(db.Model):
    __tablename__ = 'expense_categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    icon = db.Column(db.String(50))  # e.g., "fast-food", "car" (for frontend icons)
    color = db.Column(db.String(20)) # e.g., "#FF5733" for charts
    
    # Relationship: One category has many expenses
    expenses = db.relationship('Expense', backref='category', lazy=True, cascade="all, delete-orphan")

    @property
    def total_spent(self):
        """Quickly sum all expenses in this category"""
        return sum(e.amount for e in self.expenses)

    def __repr__(self):
        return f'<Category {self.name}>'

# ----------------------------------------------------------------
# 2. Individual Expense: The actual spending entry
# ----------------------------------------------------------------
class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('expense_categories.id'), nullable=False)
    
    title = db.Column(db.String(100), nullable=False) # e.g., "Dinner with friends"
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    expense_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Expense {self.title}: {self.amount}>'