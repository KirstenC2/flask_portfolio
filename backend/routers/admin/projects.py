from . import admin_bp, token_required
from flask import request, jsonify
from models import db, Project, ThinkingProject, DevFeature
from datetime import datetime, timedelta
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

from sqlalchemy.orm import joinedload

@admin_bp.route('/projects', methods=['GET', 'OPTIONS'])
@token_required
def get_projects(current_admin):
    project_type = request.args.get('type')
    
    # 1. 效能優化：使用 joinedload 一次性抓取所有關聯層級
    query = Project.query.options(
        joinedload(Project.dev_features).joinedload(DevFeature.tasks)
    )
    
    if project_type:
        query = query.filter_by(project_type=project_type)
    
    projects = query.all()
    
    result = []
    for p in projects:
        # 2. 調用我們在 Model 定義的 @property
        stats = p.progress_stats 
        
        project_data = {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "technologies": p.technologies,
            "image_url": p.image_url,
            "project_type": p.project_type,
            "date_created": p.date_created.isoformat(),
            # 3. 戰情室所需的關鍵統計
            "stats": stats, 
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
                        } for t in sorted(f.tasks, key=lambda x: x.priority)
                    ]
                } for f in p.dev_features
            ]
        }
        result.append(project_data)
        
    return jsonify(result)



@admin_bp.route('/projects/warboard-stats', methods=['GET', 'OPTIONS'])
@token_required
def get_warboard_stats(current_admin):
    projects = Project.query.all()
    output = []
    
    # 用於全局統計
    total_remaining = 0
    active_projects = 0
    
    # 準備匯報文字內容 (本週完成的任務)
    last_7_days = datetime.utcnow() - timedelta(days=7)
    weekly_achievements = []

    for p in projects:
        stats = p.progress_stats 
        output.append({
            'key': p.id,
            'name': p.title,
            'progress': stats['percent'],
            'remaining': stats['remaining'],
            'status': 'Delayed' if stats['has_delay'] else ('Completed' if stats['percent'] == 100 else 'Normal'),
            'type': p.project_type
        })
        
        if stats['percent'] < 100:
            active_projects += 1
            total_remaining += stats['remaining']

        # 搜尋本週完成的任務 (假設你有 date_completed 欄位)
        # 如果還沒加欄位，這部分可以先註解掉
        for feature in p.dev_features:
            done_tasks = [t.content for t in feature.tasks 
                         if t.status == 'completed' and 
                         (t.date_completed and t.date_completed >= last_7_days)]
            if done_tasks:
                weekly_achievements.append(f"{p.title}: {', '.join(done_tasks)}")

    # 組裝 Markdown 匯報範本
    report_md = f"## 本週工作匯報 ({datetime.now().strftime('%Y-%m-%d')})\n"
    report_md += f"- **進行中專案**：{active_projects} 個\n"
    report_md += f"- **總待辦任務**：{total_remaining} 項\n\n"
    report_md += "### 重點達成：\n"
    report_md += "\n".join([f"- {item}" for item in weekly_achievements]) if weekly_achievements else "- 本週主要進行架構調整與維護。"

    return jsonify({
        "projects": output,
        "summary": {
            "total_remaining": total_remaining,
            "active_projects": active_projects,
            "report_template": report_md
        }
    })


@admin_bp.route('/projects/info/<int:project_id>', methods=['GET', 'OPTIONS'])
@token_required
def get_projects_info(current_admin, project_id):
    # 這裡的邏輯原本回傳的是列表，我們維持結構
    query = Project.query
    if project_id:
        query = query.filter_by(id=project_id)
    
    projects = query.all()
    
    result = []
    for p in projects:
        # 1. 額外查詢屬於這個專案的戰略分析紀錄
        # 假設你的 ThinkingProject 模型中 ref_id 是存專案 ID
        analyses = ThinkingProject.query.filter_by(
            ref_id=p.id, 
            ref_type='project'
        ).all()

        project_data = {
            "id": p.id,
            "title": p.title,
            "technologies": p.technologies,
            "project_type": p.project_type,
            "date_created": p.date_created.isoformat(),
            
            # 2. 注入歷史分析紀錄列表
            "thinking_analyses": [
                {
                    "id": a.id,
                    "title": a.title,
                    "template_id": a.template_id,
                    "created_at": a.created_at.isoformat() if a.created_at else None
                } for a in analyses
            ],

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
                        } for t in sorted(f.tasks, key=lambda x: x.priority)
                    ]
                } for f in p.dev_features
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
