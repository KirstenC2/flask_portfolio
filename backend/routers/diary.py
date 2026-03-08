from flask import Blueprint, request, jsonify
from models import db, Diary
from routers.admin import token_required
from flask_cors import CORS
from sqlalchemy import extract
from sqlalchemy import func
diary_bp = Blueprint("diary", __name__)
CORS(diary_bp)

# 💡 補完情緒配置，用於後端標籤轉換
MOOD_CONFIG = {
    'happy': {'label': '開心'},
    'neutral': {'label': '平常'},
    'tired': {'label': '累'},
    'helpless': {'label': '無助'},
    'sad': {'label': '傷心'},
    'angry': {'label': '生氣'}
}

# 💡 心情分數映射
MOOD_MAP = {
    'happy': {'score': 2, 'label': '開心'},
    'neutral': {'score': 1, 'label': '平常'},
    'tired': {'score': 0, 'label': '累'},
    'helpless': {'score': -1, 'label': '無助'},
    'sad': {'score': -2, 'label': '傷心'},
    'angry': {'score': -2, 'label': '生氣'}
}


@diary_bp.route("/api/diary", methods=["GET", "POST"])
def diary():
    if request.method == "POST":
        diary_data = request.json
        # 這裡建議確保傳入的 date 是正確格式，或是轉換為 datetime 物件
        new_diary = Diary(
            date=diary_data.get("date"), 
            weather=diary_data.get("weather", ""),
            emotion=diary_data.get("emotion", ""),
            content=diary_data.get("content", ""),
            image_url=diary_data.get("image_url", "")
        )
        db.session.add(new_diary)
        db.session.commit()
        return jsonify({"success": True, "message": "Diary entry added successfully!"})

    elif request.method == "GET":
        # 從 URL 參數獲取年月，如果沒有提供則預設為 None
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)

        query = Diary.query

        # 如果有帶年月參數，則進行過濾
        if year and month:
            query = query.filter(
                extract('year', Diary.date) == year,
                extract('month', Diary.date) == month
            )
        
        # 依照日期排序（由新到舊），讓日曆或列表顯示更合理
        diaries = query.order_by(Diary.date.desc()).all()

        return jsonify({
            "success": True,
            "data": [
                {
                    "id": diary.id,
                    "date": diary.date.strftime('%Y-%m-%d') if hasattr(diary.date, 'strftime') else diary.date,
                    "weather": diary.weather,
                    "emotion": diary.emotion,
                    "content": diary.content,
                    "image_url": diary.image_url
                }
                for diary in diaries
            ]
        })

@diary_bp.route("/api/diary/<int:id>", methods=['PUT'])
def update_diary(id):
    d = Diary.query.get_or_404(id)
    diary_data = request.json

    d.date = diary_data.get("date", d.date)
    d.weather = diary_data.get("weather", d.weather)
    d.emotion = diary_data.get("emotion", d.emotion)
    d.content = diary_data.get("content", d.content)

    db.session.commit()

    return jsonify({
        "success": True,
        "data": "Diary entry updated successfully!"
    })

@diary_bp.route("/api/diary/<int:id>", methods=['DELETE','OPTIONS'])
def diary_delete(id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    # 🔒 AUTH ONLY FOR REAL REQUEST
    return delete_diary(id)


@token_required
def delete_diary(current_admin, id):
    diary = Diary.query.get_or_404(id)
    db.session.delete(diary)
    db.session.commit()
    return jsonify({"success": True, "data": "Diary entry deleted successfully!"})


@diary_bp.route('/api/diary/stats', methods=['GET'])
@token_required
def get_diary_stats(current_admin):
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    if not year or not month:
        return jsonify({"success": False, "message": "Year and Month are required"}), 400

    # 1. 抓取數據
    diaries = Diary.query.filter(
        extract('year', Diary.date) == year,
        extract('month', Diary.date) == month
    ).order_by(Diary.date).all()

    if not diaries:
        return jsonify({
            "pieData": [],
            "lineData": [],
            "summary": {"total": 0, "posRate": 0}
        })

    line_data = []
    emotion_counts = {}
    positive_count = 0

    for d in diaries:
        # 💡 防止 key 不存在導致報錯，使用 .get 並提供預設值
        mood = MOOD_MAP.get(d.emotion, {'score': 0, 'label': d.emotion})
        
        line_data.append({
            "date": d.date.strftime('%m/%d') if hasattr(d.date, 'strftime') else str(d.date),
            "score": mood['score'],
            "emotion": mood['label']
        })
        
        emotion_counts[d.emotion] = emotion_counts.get(d.emotion, 0) + 1
        if d.emotion in ['happy', 'neutral']:
            positive_count += 1

    # 3. 處理圓餅圖數據
    pie_data = []
    for emotion, count in emotion_counts.items():
        pie_data.append({
            "key": emotion,
            "name": MOOD_CONFIG.get(emotion, {}).get('label', emotion),
            "value": count
        })

    total = len(diaries)
    pos_rate = round((positive_count / total) * 100) if total > 0 else 0

    return jsonify({
        "pieData": pie_data,
        "lineData": line_data,
        "summary": {
            "total": total,
            "posRate": pos_rate
        }
    })