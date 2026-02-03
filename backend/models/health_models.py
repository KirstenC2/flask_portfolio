from . import db
from datetime import datetime, timezone
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



class MoodDiary(db.Model):
    __tablename__ = 'mood_diaries'

    id = db.Column(db.Integer, primary_key=True)
    # 核心資訊
    keyword = db.Column(db.String(100), nullable=False)    # 情緒關鍵詞
    log_date = db.Column(db.DateTime, nullable=False)      # 情緒日誌日期
    # 模板中的五大分析區塊
    event_description = db.Column(db.Text)    # 引起情緒波動的事件經過
    physical_feeling = db.Column(db.Text)     # 事件發生時具體感受
    ideal_result = db.Column(db.Text)         # 理想結果
    real_result = db.Column(db.Text)          # 現實結果
    root_cause = db.Column(db.Text)           # 情緒根源與影響
    reflection = db.Column(db.Text)           # 反思和調整
    
    # 時間戳記
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    def to_dict(self):
        """將資料庫物件轉為字典，方便 API 回傳 JSON"""
        return {
            "id": self.id,
            "keyword": self.keyword,
            "log_date": self.log_date,
            "event_description": self.event_description,
            "physical_feeling": self.physical_feeling,
            "ideal_result": self.ideal_result,
            "real_result": self.real_result,
            "root_cause": self.root_cause,
            "reflection": self.reflection,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

