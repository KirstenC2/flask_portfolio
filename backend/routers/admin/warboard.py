from datetime import datetime, time, timedelta
from flask import request, jsonify
from models import Project
from models.template_models import ThinkingTemplate, TemplateStep, ThinkingProject, ProjectContent, db
from . import admin_bp, APP_SECRET_KEY, token_required


@admin_bp.route('/warboard', methods=['GET'])
@token_required
def get_warboard_data(current_admin):
    # --- 計算本週一 00:00:00 的時間點 ---
    now = datetime.utcnow()
    # weekday(): 週一為 0, 週日為 6
    days_since_monday = now.weekday() 
    monday_date = now.date() - timedelta(days=days_since_monday)
    # 結合日期與午夜 0 點，得到本週的起始時間
    this_week_start = datetime.combine(monday_date, time.min)
    
    all_projects = Project.query.all()
    warboard_list = []

    for project in all_projects:
        project_data = {
            "id": project.id,
            "title": project.title,
            "project_type": project.project_type,
            "features": []
        }

        for feature in project.dev_features:
            # 關鍵過濾：狀態為 done，且完成時間落在本週一之後
            completed_tasks = [
                {
                    "id": t.id,
                    "content": t.content,
                    "date_completed": t.date_completed.isoformat() if t.date_completed else None
                }
                for t in feature.tasks 
                if t.status == 'done' and t.date_completed and t.date_completed >= this_week_start
            ]

            if completed_tasks:
                project_data["features"].append({
                    "id": feature.id,
                    "title": feature.title,
                    "tasks": completed_tasks
                })

        if project_data["features"]:
            warboard_list.append(project_data)

    return jsonify({
        "start_date": monday_date.strftime('%Y-%m-%d'),
        "data": warboard_list
    })

@admin_bp.route('/warboard/report', methods=['POST'])
@token_required
def save_star_report(current_admin):
    data = request.get_json()
    # 這裡可以根據週數(如 2026-05) 當作 ref_id
    project = ThinkingProject.query.filter_by(
        ref_type='weekly_report', 
        ref_id=data['week_id']
    ).first()

    if not project:
        project = ThinkingProject(
            template_id=data['template_id'], 
            title=f"週報 - {data['week_id']}",
            ref_type='weekly_report',
            ref_id=data['week_id']
        )
        db.session.add(project)
        db.session.flush() # 取得 project.id

    # 儲存 S, T, A, R 的內容
    for step in data['steps']:
        content = ProjectContent.query.filter_by(
            project_id=project.id, 
            step_id=step['step_id']
        ).first()
        
        if content:
            content.content = step['content']
        else:
            db.session.add(ProjectContent(
                project_id=project.id,
                step_id=step['step_id'],
                content=step['content']
            ))
    
    db.session.commit()
    return jsonify({"message": "Report saved!"})