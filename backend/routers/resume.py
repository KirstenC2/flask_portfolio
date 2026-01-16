import os
from flask import Blueprint, jsonify, request
from models import db, Experience, Skill, ExperienceDescription

resume_bp = Blueprint('resume', __name__)

@resume_bp.route('/api/resume', methods=['GET'])
def get_full_resume():
    try:
        # 獲取前端想要的面向，例如 ?category=Backend (預設給一個通用的)
        target_category = request.args.get('category', 'General')
        
        # 1. 處理技能與語言 (維持原樣)
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

        # 3. 處理經歷 (重點修改處)
        exps = Experience.query.order_by(Experience.start_date.desc()).all()
        formatted_experience = []

        for e in exps:
            # 從關聯的 descriptions 中找尋符合 category 且 is_active=True 的那一筆
            # 這裡使用 next() 來找尋第一個符合條件的物件
            active_desc_obj = next(
                (d for d in e.descriptions if d.category == target_category and d.is_active), 
                None
            )
            
            # 如果找不到該面向，則 Fallback 找 General 面向的 active 版
            if not active_desc_obj:
                active_desc_obj = next(
                    (d for d in e.descriptions if d.category == 'General' and d.is_active), 
                    None
                )

            # 最終確定的描述文字
            # 優先級：指定面向(Active) > General(Active) > Experience原始欄位
            final_desc = active_desc_obj.content if active_desc_obj else e.description

            formatted_experience.append({
                "company": e.company,
                "role": e.title,
                "period": f"{e.start_date.strftime('%m/%Y')} - {e.end_date.strftime('%m/%Y') if e.end_date else 'Present'}",
                "desc": final_desc
            })

        # 3. 封裝 JSON  
        full_data = {
            "name": "Choo Vern Jet",
            "title": "Software Engineer", # 這裡也可以改成根據 target_category 動態顯示
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
        return jsonify({"error": str(e)}), 500