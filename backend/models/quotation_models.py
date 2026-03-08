from datetime import datetime, timedelta
from . import db

class PublicQuotation(db.Model):
    __tablename__ = 'public_quotations'
    id = db.Column(db.Integer, primary_key=True)
    
    # 基本資訊
    quotation_no = db.Column(db.String(50), unique=True) # 例如：QUO-20260308-01
    client_name = db.Column(db.String(100), nullable=False)
    client_email = db.Column(db.String(100))
    subject = db.Column(db.String(200)) # 報案主旨：例如「XX公司官網開發案」
    
    # 狀態管理 (外包核心)
    status = db.Column(db.String(20), default='DRAFT') # DRAFT, SENT, ACCEPTED, INVOICED
    
    # 金額計算邏輯
    subtotal = db.Column(db.Float, default=0.0)
    tax_rate = db.Column(db.Float, default=0.05)
    tax_amount = db.Column(db.Float, default=0.0)
    discount = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, default=0.0)
    
    # 商務條款 (外包最重要的保護)
    payment_terms = db.Column(db.Text)
    note = db.Column(db.Text)
    
    # 時間戳
    expired_at = db.Column(db.DateTime, default=lambda: datetime.now() + timedelta(days=14))
    created_at = db.Column(db.DateTime, default=datetime.now)

    # 關聯報價細項
    items = db.relationship('PublicQuotationItem', backref='quotation', cascade="all, delete-orphan")

class PublicQuotationItem(db.Model):
    __tablename__ = 'public_quotation_items'
    id = db.Column(db.Integer, primary_key=True)
    quotation_id = db.Column(db.Integer, db.ForeignKey('public_quotations.id'))
    
    description = db.Column(db.String(255), nullable=False) # 項目名稱：如「後端 API 開發」
    detail = db.Column(db.Text)                             # 細節：如「包含 20 支 CRUD 接口」
    unit_price = db.Column(db.Float, default=0.0)
    quantity = db.Column(db.Float, default=1.0)
    amount = db.Column(db.Float, default=0.0)               # 單項小計