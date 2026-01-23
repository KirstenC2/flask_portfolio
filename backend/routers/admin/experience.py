from models import TaskDescription
from . import token_required, admin_bp
from flask import request, jsonify
from models import db, Project, Skill, Study, Experience, ExperienceProject, Education, Message, Admin, LifeEvent
from flask_cors import CORS

CORS(admin_bp, 
     resources={"/api/admin/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"])

# ----------------------
# Experience-projects CRUD (Admin)
# ----------------------
def _experience_project_to_dict(p: ExperienceProject):
    return {
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'technologies': p.technologies,
        'project_url': p.project_url,
        'github_url': p.github_url
    }

@admin_bp.route('/experience-projects', methods=['GET', 'OPTIONS'])
@token_required
def get_admin_experience_projects(current_admin):
    experience_projects = ExperienceProject.query.all()
    return jsonify([_experience_project_to_dict(p) for p in experience_projects])

@admin_bp.route('/experience-projects/<int:experience_project_id>', methods=['GET', 'OPTIONS'])
@token_required
def get_admin_experience_project(current_admin, experience_project_id):
    experience_project = ExperienceProject.query.get_or_404(experience_project_id)
    return jsonify(_experience_project_to_dict(experience_project))

@admin_bp.route('/experience/<int:experience_id>/projects', methods=['GET', 'OPTIONS'])
@token_required
def get_projects_by_experience_id(current_admin, experience_id):
    projects = ExperienceProject.query.filter_by(experience_id=experience_id).all()
    return jsonify([_experience_project_to_dict(p) for p in projects])

@admin_bp.route('/experience-projects', methods=['POST', 'OPTIONS'])
@token_required
def create_admin_experience_project(current_admin):
    data = request.get_json(force=True) or {}
    p = ExperienceProject(
        title=(data.get('title') or '').strip(),
        description=data.get('description'),
        experience_id=data.get('experience_id'),
        technologies=data.get('technologies'),
        project_url=data.get('project_url'),
        github_url=data.get('github_url'),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(_experience_project_to_dict(p)), 201

@admin_bp.route('/experience-projects/<int:experience_project_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_admin_experience_project(current_admin, experience_project_id):
    p = ExperienceProject.query.get_or_404(experience_project_id)
    data = request.get_json(force=True) or {}
    if 'title' in data:
        p.title = (data.get('title') or '').strip()
    if 'description' in data:
        p.description = data.get('description')
    if 'experience_id' in data:
        p.experience_id = data.get('experience_id')
    if 'technologies' in data:
        p.technologies = data.get('technologies')
    if 'project_url' in data:
        p.project_url = data.get('project_url')
    if 'github_url' in data:
        p.github_url = data.get('github_url')
    db.session.commit()
    return jsonify(_experience_project_to_dict(p))

@admin_bp.route('/experience-projects/<int:experience_project_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_experience_project(current_admin, experience_project_id):
    p = ExperienceProject.query.get_or_404(experience_project_id)
    db.session.delete(p)
    db.session.commit()
    return '', 204

# ----------------------
# Experience CRUD (Admin)
# ----------------------

def _exp_to_dict(exp: Experience):
    return {
        'id': exp.id,
        'title': exp.title,
        'company': exp.company,
        'description': exp.description,
        # 'description_versions': exp.description_versions,
        'start_date': exp.start_date.isoformat() if exp.start_date else None,
        'end_date': exp.end_date.isoformat() if exp.end_date else None,
        'leaving_reason': exp.leaving_reason,
        'is_current': exp.is_current,
        'order': exp.order,
    }

def _parse_dt(val):
    if not val:
        return None
    from datetime import datetime
    try:
        return datetime.fromisoformat(val)
    except ValueError:
        try:
            return datetime.strptime(val, '%Y-%m-%d')
        except Exception:
            return None

@admin_bp.route('/experience', methods=['GET','OPTIONS'])
@token_required
def get_experiences(current_admin):
    # 修正 1：移除沒用的 tasks 全查語句，避免這裡噴錯
    # 原本的 TaskDescription.query.order_by(Experience.order.desc()) 會噴錯，因為 TaskDescription 表沒有 order 欄位
    
    # 修正 2：使用 joinedload (選填但建議) 解決 N+1 問題，一次把 Task 都抓出來
    from sqlalchemy.orm import joinedload
    exps = Experience.query.options(joinedload(Experience.tasks)).order_by(Experience.order.desc()).all()
    
    output = []
    for e in exps:
        # 這裡直接使用 e.tasks，SQLAlchemy 會自動幫你處理對應的 experience_id
        tasks_list = [{
            "id": d.id,
            "category": d.category,
            "version_name": d.version_name,
            "content": d.content,
            "is_active": d.is_active
        } for d in e.tasks]

        output.append({
            "id": e.id,
            "title": e.title,
            "company": e.company,
            "description": e.description,
            "start_date": e.start_date.isoformat() if e.start_date else None,
            "end_date": e.end_date.isoformat() if e.end_date else None,
            "is_current": e.is_current,
            "order": e.order,
            "tasks": tasks_list
        })
    return jsonify(output)

@admin_bp.route('/experience', methods=['POST', 'OPTIONS'])
@token_required
def create_experience(current_admin):
    data = request.get_json(force=True) or {}
    exp = Experience(
        title=(data.get('title') or '').strip(),
        company=(data.get('company') or '').strip(),
        description=data.get('description') or '',
        # description_versions=data.get('description_versions') or None,
        start_date=_parse_dt(data.get('start_date')),
        end_date=_parse_dt(data.get('end_date')),
        leaving_reason=data.get('leaving_reason') or '',
        is_current=bool(data.get('is_current', False)),
        order=int(data.get('order') or 0) if str(data.get('order') or '').lstrip('-').isdigit() else 0,
    )
    db.session.add(exp)
    db.session.commit()
    return jsonify(_exp_to_dict(exp)), 201
@admin_bp.route('/experience/<int:id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_experience(current_admin, id):
    exp = Experience.query.get_or_404(id)
    data = request.json
    
    # 1. 更新基本欄位 (確保包含 description)
    exp.title = data.get('title', exp.title)
    exp.company = data.get('company', exp.company)
    exp.description = data.get('description', exp.description)  # <-- 補上這一行
    
    # 2. 更新日期與狀態 (如果你前端有傳這些的話)
    exp.is_current = data.get('is_current', exp.is_current)
    exp.order = data.get('order', exp.order)
    
    # 3. 處理關聯技能 (維持原樣)
    if 'skill_ids' in data:
        new_skills = Skill.query.filter(Skill.id.in_(data['skill_ids'])).all()
        exp.skills = new_skills
    
    try:
        db.session.commit()
        return jsonify({"message": "Updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/experience/<int:id>/task', methods=['POST', 'OPTIONS'])
@token_required
def add_new_task(current_admin, id):
    data = request.json
    # Create a new ExperienceDescription record
    new_desc = TaskDescription(
        experience_id=id,
        category=data.get('category', 'General'),
        version_name=data.get('version_name', 'Default'),
        content=data.get('content', '')
    )
    db.session.add(new_desc)
    try:
        db.session.commit()
        return jsonify({"message": "Description added successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# 2. 切換特定版本的 Active 狀態
@admin_bp.route('/experience/task/<int:task_id>/activate', methods=['PUT'])
@token_required
def toggle_task_activation(current_admin, task_id):
    try:
        target_task = TaskDescription.query.get(task_id)
        if not target_task: return jsonify({"error": "Task not found"}), 404

        # 如果點擊的是目前啟用的 -> 把它關掉 (Deactivate)
        if target_task.is_active:
            target_task.is_active = False
        else:
            # 如果點擊的是未啟用的 -> 先關掉同類別的其他任務，再開啟它
            TaskDescription.query.filter(
                TaskDescription.experience_id == target_task.experience_id,
                TaskDescription.category == target_task.category
            ).update({TaskDescription.is_active: False})
            target_task.is_active = True

        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/experience/task/<int:task_id>', methods=['PATCH','OPTIONS'])
@token_required
def update_task(current_admin, task_id):
    task = TaskDescription.query.get_or_404(task_id)
    data = request.json
    
    if 'category' in data:
        task.category = data['category']
    if 'version_name' in data:
        task.version_name = data['version_name']
    if 'content' in data:
        task.content = data['content']
        
    db.session.commit()
    return jsonify({"message": "Updated"}), 200

@admin_bp.route('/experience/task/<int:task_id>', methods=['DELETE','OPTIONS'])
@token_required
def delete_task(current_admin, task_id):
    task = TaskDescription.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@admin_bp.route('/experience/<int:exp_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_experience(current_admin, exp_id):
    exp = Experience.query.get_or_404(exp_id)
    db.session.delete(exp)
    db.session.commit()
    return jsonify({'message': 'Experience deleted'})
