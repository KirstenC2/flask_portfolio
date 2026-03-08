from . import admin_bp, token_required
from flask import request, jsonify
from models.health_models import db, AlcoholLogs, MoodDiary
from flask_cors import CORS
from datetime import datetime, timezone, timedelta, date
from sqlalchemy import func, extract

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

@admin_bp.route('/health/alcohol/<string:interval>', methods=['GET', 'OPTIONS'])
@token_required
def get_alcohol_logs(current_admin, interval):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        now_utc = datetime.now(timezone.utc)
        local_time = now_utc + timedelta(hours=8)
        
        # 根據 interval 判斷時間範圍
        if interval == 'monthly':
            # 本月第一天 00:00:00
            local_start = local_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # 本月最後一天 23:59:59 (下個月第一天減一秒)
            next_month = (local_start + timedelta(days=32)).replace(day=1)
            local_end = next_month - timedelta(seconds=1)
        else:
            # 預設為 daily (今天)
            local_start = datetime.combine(local_time.date(), datetime.min.time())
            local_end = datetime.combine(local_time.date(), datetime.max.time())
        
        # 轉回 UTC 以便查詢資料庫
        utc_start = local_start - timedelta(hours=8)
        utc_end = local_end - timedelta(hours=8)

        # 查詢
        logs = AlcoholLogs.query.filter(
            AlcoholLogs.logged_at >= utc_start,
            AlcoholLogs.logged_at <= utc_end
        ).order_by(AlcoholLogs.logged_at.desc()).all()
        
        formatted_logs = []
        for l in logs:
            local_logged_at = l.logged_at + timedelta(hours=8) if l.logged_at else None
            formatted_logs.append({
                "id": l.id,
                "type": l.drink_name,
                "volume": float(l.volume_ml) if l.volume_ml else 0,
                "abv": float(l.abv_percent) if l.abv_percent else 0,
                "grams": float(l.alcohol_grams) if l.alcohol_grams else 0,
                "time": local_logged_at.strftime('%m-%d %H:%M') if interval == 'monthly' else local_logged_at.strftime('%H:%M'),
                "created_at": l.logged_at.isoformat() # 傳回 ISO 字串供前端解析
            })
            
        return jsonify(formatted_logs), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# [UPDATE] 修改紀錄 (例如打錯容量)
@admin_bp.route('/health/alcohol/<int:log_id>', methods=['PUT', 'DELETE'])
@token_required
def manage_alcohol_log(current_admin, log_id):
    # 尋找該筆紀錄
    log = AlcoholLogs.query.get_or_404(log_id)

    if request.method == 'DELETE':
        try:
            db.session.delete(log)
            db.session.commit()
            return jsonify({"success": True, "message": "紀錄已刪除"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "error": str(e)}), 500

    if request.method == 'PUT':
        data = request.get_json()
        try:
            log.drink_name = data.get('drink_name', log.drink_name)
            log.volume_ml = data.get('volume_ml', log.volume_ml)
            log.abv_percent = data.get('abv_percent', log.abv_percent)
            
            # 重新計算酒精克數 (公式: ml * abv% * 0.8)
            log.grams = float(log.volume_ml) * (float(log.abv_percent) / 100) * 0.8
            
            db.session.commit()
            return jsonify({"success": True, "message": "紀錄已更新"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route('/health/mood', methods=['POST'])
@token_required
def save_mood_diary(current_admin):
    data = request.get_json()
    
    try:
        new_diary = MoodDiary(
            log_date=data.get('log_date'),
            keyword=data.get('keyword'),
            event_description=data.get('event_description'),
            physical_feeling=data.get('physical_feeling'),
            ideal_result=data.get('ideal_result'),
            real_result=data.get('real_result'),
            root_cause=data.get('root_cause'),
            reflection=data.get('reflection')
        )
        
        db.session.add(new_diary)
        db.session.commit()
        return jsonify({"message": "情緒日記已溫馨存檔"}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/health/mood/dates', methods=['GET','OPTIONS'])
@token_required
def get_recorded_dates(current_admin):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    # 這裡只 select log_date 欄位，不拿大文字區塊
    diaries = MoodDiary.query.with_entities(MoodDiary.log_date).all()
    # 格式化成 ["2024-05-01", "2024-05-02"]
    date_list = [d.log_date.strftime('%Y-%m-%d') for d in diaries]
    return jsonify(date_list)

@admin_bp.route('/health/mood', methods=['GET', 'OPTIONS'])
@token_required
def get_mood_diaries(current_admin):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    # Get year and month from query parameters: /api/admin/health/mood?year=2024&month=5
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    query = MoodDiary.query

    # Apply filters if month and year are provided
    if year and month:
        query = query.filter(
            extract('year', MoodDiary.log_date) == year,
            extract('month', MoodDiary.log_date) == month
        )

    diaries = query.all()
    
    # Return full data objects using your model's to_dict() method
    return jsonify({
        'status': 'success',
        'data': [d.to_dict() for d in diaries]
    }), 200


# --- API 2: 根據特定日期獲取詳細內容 (用於填寫表單) ---
@admin_bp.route('/health/mood/detail', methods=['GET'])
@token_required
def get_diary_by_date(current_admin):
    print(f"DEBUG: 收到請求日期為 {request.args.get('date')}") # 加這行
    target_date = request.args.get('date') # 從 Query String 拿日期
    if not target_date:
        return jsonify({"error": "Missing date parameter"}), 400
    
    # 查詢該日期的完整資料
    diary = MoodDiary.query.filter(func.date(MoodDiary.log_date) == target_date).first()
    if diary:
        return jsonify({
            "id": diary.id,
            "log_date": diary.log_date.strftime('%Y-%m-%d'),
            "keyword": diary.keyword,
            "event_description": diary.event_description,
            "physical_feeling": diary.physical_feeling,
            "ideal_result": diary.ideal_result,
            "real_result": diary.real_result,
            "root_cause": diary.root_cause,
            "reflection": diary.reflection
        })
    else:
        return {
            "data": None
        }
@admin_bp.route('/health/mood/<int:diary_id>', methods=['PUT'])
@token_required
def update_diary(current_admin, diary_id):
    data = request.get_json()
    diary = MoodDiary.query.get_or_404(diary_id)

    try:
        # 更新欄位，保持與前端 formData 鍵名一致
        diary.log_date = datetime.strptime(data.get('log_date'), '%Y-%m-%d').date()
        diary.keyword = data.get('keyword')
        diary.event_description = data.get('event_description')
        diary.physical_feeling = data.get('physical_feeling')
        diary.ideal_result = data.get('ideal_result')
        diary.real_result = data.get('real_result')
        diary.root_cause = data.get('root_cause')
        diary.reflection = data.get('reflection')

        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": "這段情緒記憶已被溫柔地更新",
            "data": diary.to_dict() # 假設你的 Model 有 to_dict
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route('/health/mood/<int:diary_id>', methods=['DELETE'])
@token_required
def delete_diary(current_admin, diary_id):
    diary = MoodDiary.query.get_or_404(diary_id)
    
    try:
        db.session.delete(diary)
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": "該日誌已從記憶中抹除"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route('/health/sobriety-status', methods=['GET'])
@token_required
def get_sobriety_status(current_admin):
    # 1. 抓取「最後一筆」喝酒紀錄
    latest_log = AlcoholLogs.query.order_by(AlcoholLogs.logged_at.desc()).first()
    
    today = date.today()
    
    if not latest_log:
        return jsonify({"days_count": 0, "message": "開始紀錄你的第一天吧！"})

    last_drink_date = latest_log.logged_at.date()
    
    # 2. 計算差距
    delta = today - last_drink_date
    days_count = delta.days
    
    # 重點修正邏輯：
    # 如果 delta.days == 0 -> 今天喝過 -> 清醒 0 天
    # 如果 delta.days == 1 -> 昨天喝過 -> 清醒 0 天 (因為今天才剛開始)
    # 只有當 delta.days > 1，才代表你完整跳過了某些日子
    
    # 但通常直觀的算法是：
    if days_count <= 1:
        # 只要昨天或今天有紀錄，連續天數就該斷掉
        actual_sobriety_days = 0 
    else:
        # 如果最後一次是 3 天前，那代表你清醒了 2 天
        actual_sobriety_days = days_count - 1

    return jsonify({
        "days_count": actual_sobriety_days,
        "last_log_date": last_drink_date.isoformat()
    })

