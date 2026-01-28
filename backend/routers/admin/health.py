from . import admin_bp, token_required
from flask import request, jsonify
from models.health_models import db, AlcoholLogs
from flask_cors import CORS
from datetime import datetime, time

CORS(admin_bp, 
     resources={"/api/admin/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"])

@admin_bp.route('/health/alcohol', methods=['POST','OPTIONS'])
@token_required
def add_alcohol_log(current_admin):
    data = request.get_json()
    
    # 計算酒精克數
    volume = float(data.get('volume_ml'))
    abv = float(data.get('abv_percent'))
    grams = round(volume * (abv / 100) * 0.8, 2)
    
    new_log = AlcoholLogs(
        drink_name=data.get('drink_name'),
        volume_ml=volume,
        abv_percent=abv,
        alcohol_grams=grams,
        note=data.get('note'),
    )
    
    db.session.add(new_log)
    db.session.commit()
    return jsonify({"message": "紀錄成功", "grams": grams}), 201

# [READ] 獲取當日紀錄
from datetime import datetime, timedelta, timezone

@admin_bp.route('/health/alcohol/all', methods=['GET', 'OPTIONS'])
@token_required
def get_today_logs(current_admin):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        # 1. 取得當前 UTC 時間
        now_utc = datetime.now(timezone.utc)
        
        # 2. 假設前端/使用者在 UTC+8 (台灣/中國標準時間)
        # 如果要更嚴謹，可以從前端傳 offset 進來，這裡先以 +8 為例
        local_time = now_utc + timedelta(hours=8)
        
        # 3. 計算當地時間的今天起訖點，再轉回 UTC
        local_today_start = datetime.combine(local_time.date(), datetime.min.time())
        local_today_end = datetime.combine(local_time.date(), datetime.max.time())
        
        # 轉回 UTC 以便查詢資料庫
        utc_start = local_today_start - timedelta(hours=8)
        utc_end = local_today_end - timedelta(hours=8)

        # 4. 執行查詢
        logs = AlcoholLogs.query.filter(
            AlcoholLogs.logged_at >= utc_start,
            AlcoholLogs.logged_at <= utc_end
        ).order_by(AlcoholLogs.logged_at.desc()).all()
        
        # 
        
        formatted_logs = []
        for l in logs:
            # 顯示時轉回當地時間 (+8)
            local_logged_at = l.logged_at + timedelta(hours=8) if l.logged_at else None
            
            formatted_logs.append({
                "id": l.id,
                "type": l.drink_name,
                "volume": float(l.volume_ml) if l.volume_ml else 0,
                "abv": float(l.abv_percent) if l.abv_percent else 0,
                "grams": float(l.alcohol_grams) if l.alcohol_grams else 0,
                "time": local_logged_at.strftime('%H:%M') if local_logged_at else "00:00"
            })
            
        return jsonify(formatted_logs), 200
        
    except Exception as e:
        print(f"--- GET UTC LOGS ERROR: {str(e)} ---")
        return jsonify({"error": str(e)}), 500

# [UPDATE] 修改紀錄 (例如打錯容量)
@admin_bp.route('/health/alcohol/<int:log_id>', methods=['PUT'])
@token_required
def update_log(log_id):
    log = AlcoholLogs.query.get_or_404(log_id)
    data = request.json
    log.volume_ml = data.get('volume_ml', log.volume_ml)
    log.abv_percent = data.get('abv_percent', log.abv_percent)
    log.alcohol_grams = float(log.volume_ml) * (float(log.abv_percent) / 100) * 0.8
    db.session.commit()
    return jsonify({"message": "更新成功"})

# [DELETE] 刪除紀錄
@admin_bp.route('/health/alcohol/<int:log_id>', methods=['DELETE'])
@token_required
def delete_log(log_id):
    log = AlcoholLogs.query.get_or_404(log_id)
    db.session.delete(log)
    db.session.commit()
    return jsonify({"message": "已刪除"})