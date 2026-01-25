from . import admin_bp, token_required
from flask import request, jsonify
from models import db, Project

# ----------------------
# Projects CRUD (Admin)
# ----------------------

def _project_to_dict(p: Project):
    return {
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'technologies': p.technologies,
        'goals': p.goals,
        'features': p.features,
        'image_url': p.image_url,
        'project_url': p.project_url,
        'github_url': p.github_url,
        'project_type': p.project_type,
        'date_created': p.date_created.isoformat() if p.date_created else None
    }

@admin_bp.route('/projects', methods=['GET', 'OPTIONS'])
@token_required
def get_projects(current_admin):
    # 獲取 query parameter 中的 type (e.g., ?type=work)
    project_type = request.args.get('type')
    
    query = Project.query
    if project_type:
        query = query.filter_by(project_type=project_type)
    
    projects = query.all()
    
    result = []
    for p in projects:
        # 手動建構 Project 資料
        project_data = {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "technologies": p.technologies,
            "image_url": p.image_url,
            "project_type": p.project_type,
            "date_created": p.date_created.isoformat(),
            # 關鍵：嵌套抓取 dev_features
            "dev_features": [
                {
                    "id": f.id,
                    "title": f.title,
                    "description": f.description,
                    "tasks": [
                        {
                            "id": t.id,
                            "content": t.content,
                            "status": t.status,
                            "priority": t.priority
                        } for t in f.tasks # 遍歷 DevTask
                    ]
                } for f in p.dev_features # 遍歷 DevFeature
            ]
        }
        result.append(project_data)
        
    return jsonify(result)

@admin_bp.route('/projects', methods=['POST', 'OPTIONS'])
@token_required
def create_admin_project(current_admin):
    data = request.get_json(force=True) or {}
    p = Project(
        title=(data.get('title') or '').strip(),
        description=data.get('description'),
        technologies=data.get('technologies'),
        goals=data.get('goals'),
        features=data.get('features'),
        image_url=data.get('image_url'),
        project_url=data.get('project_url'),
        github_url=data.get('github_url'),
        project_type=data.get('project_type'),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(_project_to_dict(p)), 201

@admin_bp.route('/projects/<int:project_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_admin_project(current_admin, project_id):
    p = Project.query.get_or_404(project_id)
    data = request.get_json(force=True) or {}
    if 'title' in data:
        p.title = (data.get('title') or '').strip()
    if 'description' in data:
        p.description = data.get('description')
    if 'technologies' in data:
        p.technologies = data.get('technologies')
    if 'goals' in data:
        p.goals = data.get('goals')
    if 'features' in data:
        p.features = data.get('features')
    if 'image_url' in data:
        p.image_url = data.get('image_url')
    if 'project_url' in data:
        p.project_url = data.get('project_url')
    if 'github_url' in data:
        p.github_url = data.get('github_url')
    if 'project_type' in data:
        p.project_type = data.get('project_type')
    db.session.commit()
    return jsonify(_project_to_dict(p))

@admin_bp.route('/projects/<int:project_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_project(current_admin, project_id):
    p = Project.query.get_or_404(project_id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})
