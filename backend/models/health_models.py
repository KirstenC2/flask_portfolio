from . import db
from datetime import datetime
from decimal import Decimal

class AlcoholLogs(db.Model):
    __tablename__ = 'health_alcohol_logs'

    id = db.Column(db.Integer, primary_key=True)
    drink_name = db.Column(db.String(100), nullable=False)  # 飲料名稱 (啤酒, 紅酒...)
    volume_ml = db.Column(db.Numeric(10, 2), nullable=False)  # 飲用量 (ml)
    abv_percent = db.Column(db.Numeric(5, 2), nullable=False)  # 酒精濃度 (%)
    alcohol_grams = db.Column(db.Numeric(10, 2))  # 自動計算的酒精克數
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)  # 飲用時間
    note = db.Column(db.Text)  # 備註 (心情或地點)
