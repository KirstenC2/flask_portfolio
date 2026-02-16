from curses import ALL_MOUSE_EVENTS
from datetime import datetime
from decimal import Decimal
from os import name
from . import db

# ----------------------------------------------------------------
# 核心：交易中心 (Transaction)
# ----------------------------------------------------------------
class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    
    # 類型：expense (支出), debt_payment (還債), saving_reserve (儲蓄預留), income (收入)
    transaction_type = db.Column(db.String(20), nullable=False)  
    
    # 狀態：COMPLETED (已發生), PENDING (預算中/預留中)
    status = db.Column(db.String(20), default='COMPLETED') 

    transaction_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 雙向關聯設定
    expense = db.relationship('Expense', back_populates='transaction', uselist=False, cascade="all, delete-orphan")
    payment_log = db.relationship('PaymentLog', back_populates='transaction', uselist=False, cascade="all, delete-orphan")
    income = db.relationship('Income', back_populates='transaction', uselist=False, cascade="all, delete-orphan")
    saving_log = db.relationship('SavingLog', back_populates='transaction', uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Transaction {self.transaction_type} {self.amount} ({self.status})>'

# ----------------------------------------------------------------
# 債務模組 (Debt & PaymentLog)
# ----------------------------------------------------------------
class DebtRecord(db.Model):
    __tablename__ = 'debt_records'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False) 
    total_amount = db.Column(db.Numeric(15, 2), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 關聯到還款明細
    payments = db.relationship('PaymentLog', back_populates='debt', lazy=True, cascade="all, delete-orphan")

    @property
    def current_balance(self):
        """計算剩餘應還金額"""
        # 注意：只計算已完成 (COMPLETED) 的交易
        paid_total = sum(p.transaction.amount for p in self.payments if p.transaction.status == 'COMPLETED')
        return self.total_amount - Decimal(str(paid_total))

    @property
    def is_fully_paid(self):
        return self.current_balance <= 0

class PaymentLog(db.Model):
    __tablename__ = 'payment_logs'

    id = db.Column(db.Integer, primary_key=True)
    debt_id = db.Column(db.Integer, db.ForeignKey('debt_records.id'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)

    # 建立與 Transaction 和 Debt 的雙向連結
    transaction = db.relationship('Transaction', back_populates='payment_log')
    debt = db.relationship('DebtRecord', back_populates='payments')

# ----------------------------------------------------------------
# 支出模組 (Category & Expense)
# ----------------------------------------------------------------
class ExpenseCategory(db.Model):
    __tablename__ = 'expense_categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    icon = db.Column(db.String(50))  
    color = db.Column(db.String(20)) 
    
    expenses = db.relationship('Expense', back_populates='category', lazy=True)

    def __repr__(self):
        return f'<Category {self.name}>'

class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('expense_categories.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)

    # 建立與 Transaction 和 Category 的雙向連結
    transaction = db.relationship('Transaction', back_populates='expense')
    category = db.relationship('ExpenseCategory', back_populates='expenses')

# ----------------------------------------------------------------
# 收入模組 (IncomeSource & Income)
# ----------------------------------------------------------------
class IncomeSource(db.Model):
    __tablename__ = 'income_sources'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True) # 例如：主業薪資、兼職、股息
    icon = db.Column(db.String(50))
    color = db.Column(db.String(20))
    
    incomes = db.relationship('Income', back_populates='source', lazy=True)

class Income(db.Model):
    __tablename__ = 'incomes'

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)
    source_id = db.Column(db.Integer, db.ForeignKey('income_sources.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)

    # 建立與 Transaction 和 Source 的雙向連結
    transaction = db.relationship('Transaction', back_populates='income', uselist=False)
    source = db.relationship('IncomeSource', back_populates='incomes')

# 記得在 Transaction Model 裡加上關聯
# income = db.relationship('Income', back_populates='transaction', uselist=False, cascade="all, delete-orphan")


class RecurringExpense(db.Model):
    __tablename__ = 'recurring_expenses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False) # 例如：Netflix
    amount = db.Column(db.Numeric(10, 2), nullable=False) # 這是「預設金額」
    day_of_month = db.Column(db.Integer, default=1) # 每月幾號扣款
    
    # 外鍵關聯
    category_id = db.Column(db.Integer, db.ForeignKey('expense_categories.id'))
    category = db.relationship('ExpenseCategory')

    def __repr__(self):
        return f'<RecurringExpense {self.name}>'