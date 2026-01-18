from flask import Blueprint, request, jsonify
from models import db, Diary
from routers.admin import token_required
from flask_cors import CORS
diary_bp = Blueprint("diary", __name__)
CORS(diary_bp)

@diary_bp.route("/api/diary", methods=["GET", "POST"])
def diary():
    if request.method == "POST":
        diary_data = request.json
        new_diary = Diary(
            date=diary_data.get("date", ""),
            weather=diary_data.get("weather", ""),
            emotion=diary_data.get("emotion", ""),
            content=diary_data.get("content", ""),
            image_url=diary_data.get("image_url", "")
        )
        db.session.add(new_diary)
        db.session.commit()
        return jsonify({"success": True, "data": "Diary entry added successfully!"})

    elif request.method == "GET":
        diaries = Diary.query.all()
        return jsonify(
            {
                "success": True,
                "data": [
                    {
                        "id": diary.id,
                        "date": diary.date,
                        "weather": diary.weather,
                        "emotion": diary.emotion,
                        "content": diary.content,
                        "image_url": diary.image_url
                    }
                    for diary in diaries
                ]
            }
        )

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
