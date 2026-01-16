import json
from flask import Blueprint, jsonify
from models import db, Experience, Skill

resume_bp = Blueprint('resume', __name__)

@resume_bp.route('/api/resume', methods=['GET'])
def get_full_resume():
    try:
        summary_text = "Experienced Software Engineer..."
        role_text = "Software Engineer"

        # 2. 處理技能與語言 (從 Skill Table 拿)
        all_skills = Skill.query.all()
        
        skill_groups = {}
        languages_from_skills = []

        for s in all_skills:
            # 關鍵判斷：如果類別是人類語言，則移至 languages 陣列
            if s.category == 'Human-Language':
                languages_from_skills.append({
                    "language": s.name,
                    "level": s.description or "Fluent" # 假設你把程度存在 description 
                })
            else:
                # 一般技能分組
                if s.category not in skill_groups:
                    skill_groups[s.category] = []
                skill_groups[s.category].append(s.name)

        formatted_skill_groups = [
            {"category": cat, "items": ", ".join(items)} 
            for cat, items in skill_groups.items()
        ]

        # 3. 處理經歷 (從 Experience Table 拿)
        exps = Experience.query.order_by(Experience.start_date.desc()).all()
        formatted_experience = [
            {
                "company": e.company,
                "role": e.title,
                "period": f"{e.start_date.strftime('%m/%Y')} - {e.end_date.strftime('%m/%Y') if e.end_date else 'Present'}",
                "desc": e.description
            } for e in exps
        ]

        # 4. 合併最終 JSON
        full_data = {
            "name": "Choo Vern Jet",
            "title": role_text,
            "email": "choovernjet@gmail.com",
            "phone": "+886 0979 707 990",
            "summary":"Expert in scalable backend development and DevOps...",
            "location": "Taipei, Taiwan",
            "skillGroups": formatted_skill_groups,
            "languages": languages_from_skills, # 這裡現在包含從 Skill Table 抽出來的資料
            "experience": formatted_experience
        }

        return jsonify(full_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500