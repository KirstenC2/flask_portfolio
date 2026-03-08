from datetime import datetime, timedelta
from . import db


class StandardService(db.Model):
    """標準服務項目模板 (軍火庫)"""
    __tablename__ = 'standard_services'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False) # BACKEND, FRONTEND, DEVOPS, DESIGN
    name = db.Column(db.String(100), nullable=False)    # 服務名稱 (如: JWT認證系統)
    
    # 專業描述模板，讓你在前端一選就跳出這段話
    default_description = db.Column(db.Text) 
    
    # 經濟參數
    base_price = db.Column(db.Float, default=0.0)      # 參考單價
    unit = db.Column(db.String(20), default='式')      # 單位: 支, 頁, 套, 小時
    
    is_active = db.Column(db.Boolean, default=True)    # 是否啟用
    sort_order = db.Column(db.Integer, default=0)      # 排序用
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "name": self.name,
            "description": self.default_description,
            "price": self.base_price,
            "unit": self.unit
        }

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