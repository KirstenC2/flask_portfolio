from datetime import datetime, time, timedelta
from flask import request, jsonify
from models import Project,TaskLog
from models.template_models import ThinkingProject, ProjectContent, db
from . import admin_bp, token_required


@admin_bp.route('/warboard', methods=['GET'])
@token_required
def get_warboard_data(current_admin):
    project_type = request.args.get('type', 'all')
    now = datetime.utcnow()
    days_since_monday = now.weekday() 
    monday_date = now.date() - timedelta(days=days_since_monday)
    this_week_start = datetime.combine(monday_date, time.min)
    
    if project_type == 'all':
        all_projects = Project.query.all()
    else:
        all_projects = Project.query.filter_by(project_type=project_type).all()
    warboard_list = []

    for project in all_projects:
        project_data = {
            "id": project.id,
            "title": project.title,
            "project_type": project.project_type,
            "features": []
        }

        for feature in project.dev_features:
            feature_tasks_with_logs = []
            
            for t in feature.tasks:
                # 1. 抓取本週的關鍵日誌 (Bug 或 Solution)
                # 這裡不限於 task 狀態，只要日誌是這週寫的就抓
                weekly_logs = [
                    {
                        "id": log.id,
                        "log_type": log.log_type,
                        "content": log.content,
                        "date": log.date_created.isoformat()
                    }
                    for log in TaskLog.query.filter(
                        TaskLog.task_id == t.id,
                        TaskLog.log_type.in_(['bug', 'solution']),
                        TaskLog.date_created >= this_week_start
                    ).all()
                ]

                # 2. 判斷這個 Task 是否該出現在戰報中：
                # 條件 A: 本週完成了
                is_completed_this_week = (t.status == 'done' and t.date_completed and t.date_completed >= this_week_start)
                # 條件 B: 雖然沒完成，但本週有寫 Bug/Solution 紀錄
                has_weekly_intel = len(weekly_logs) > 0

                if is_completed_this_week or has_weekly_intel:
                    feature_tasks_with_logs.append({
                        "id": t.id,
                        "content": t.content,
                        "status": t.status, # 讓前端知道這項完成了沒
                        "date_completed": t.date_completed.isoformat() if t.date_completed else None,
                        "logs": weekly_logs # 這裡帶入剛才過濾出的日誌
                    })

            if feature_tasks_with_logs:
                project_data["features"].append({
                    "id": feature.id,
                    "title": feature.title,
                    "tasks": feature_tasks_with_logs
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