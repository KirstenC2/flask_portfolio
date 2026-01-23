from datetime import datetime
from . import db

class MotorRecord(db.Model):
    __tablename__ = 'motor_records'
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(50), default="換機油") # 預設機油，也可記輪胎等
    mileage = db.Column(db.Integer, nullable=False)        # 里程數
    price = db.Column(db.Integer, nullable=False)          # 價格
    maintenance_date = db.Column(db.Date, nullable=False)  # 維修日期
    note = db.Column(db.String(200))                       # 備註（機油品牌等）
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    def to_dict(self):
        return {
            "id": self.id,
            "item_name": self.item_name,
            "mileage": self.mileage,
            "price": self.price,
            "maintenance_date": self.maintenance_date.isoformat(),
            "note": self.note
        }