import os
from flask import Blueprint, jsonify, request
from models import db, Experience, Skill, TaskDescription

resume_bp = Blueprint('resume', __name__)

@resume_bp.route('/api/resume', methods=['GET'])
def get_full_resume():
    try:
        # 1. 處理技能與語言
        all_skills = Skill.query.all()
        skill_groups = {}
        languages_from_skills = []

        for s in all_skills:
            if s.category == 'Human-Language':
                languages_from_skills.append({"language": s.name, "level": s.description or "Fluent"})
            else:
                if s.category not in skill_groups: skill_groups[s.category] = []
                skill_groups[s.category].append(s.name)

        formatted_skill_groups = [{"category": cat, "items": ", ".join(items)} for cat, items in skill_groups.items()]

        # 2. 處理經歷與其對應的 Tasks
        exps = Experience.query.order_by(Experience.start_date.desc()).all()
        formatted_experience = []
        # 獲取想要的面向 (例如：category=Backend)
        target_cat = request.args.get('category') 

        for e in exps:
            # 根據是否有傳入 category 來決定過濾條件
            if target_cat:
                active_tasks = [t.content for t in e.tasks if t.is_active and t.category == target_cat]
            else:
                active_tasks = [t.content for t in e.tasks if t.is_active]

            formatted_experience.append({
                "company": e.company,
                "role": e.title,
                "period": f"{e.start_date.strftime('%m/%Y')} - {e.end_date.strftime('%m/%Y') if e.end_date else 'Present'}",
                "desc": e.description,
                "tasks": active_tasks
            })
        # 3. 封裝 JSON  
        full_data = {
            "name": "Choo Vern Jet",
            "title": "Software Engineer",
            "email": "choovernjet@gmail.com",
            "phone": "+886 0979 707 990",
            "summary": "Expert in scalable backend development and DevOps...",
            "location": "Taipei, Taiwan",
            "skillGroups": formatted_skill_groups,
            "languages": languages_from_skills,
            "experience": formatted_experience
        }

        return jsonify(full_data), 200

    except Exception as e:
        # 加入 print 方便你在終端機除錯
        print(f"Resume API Error: {str(e)}")
        return jsonify({"error": str(e)}), 500