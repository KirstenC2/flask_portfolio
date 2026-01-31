from flask import Blueprint, request, jsonify
from models import db, Diary
from routers.admin import token_required
from flask_cors import CORS
from sqlalchemy import extract
diary_bp = Blueprint("diary", __name__)
CORS(diary_bp)

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
