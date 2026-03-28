from . import admin_bp, token_required
from flask import request, jsonify
from models import DevTask, db, Project, ThinkingProject, DevFeature, TechMeetingMinute, TaskLog
from datetime import datetime, timedelta
from sqlalchemy.orm import subqueryload
from sqlalchemy import func
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
        'status': p.status,
        'project_url': p.project_url,
        'github_url': p.github_url,
        'project_type': p.project_type,
        'date_created': p.date_created.isoformat() if p.date_created else None
    }

@admin_bp.route('/projects', methods=['GET'])
@token_required
def get_projects(current_admin):
    status = request.args.get('status', 'active')
    project_type = request.args.get('type')
    
    # 1. 基礎查詢：根據 status 過濾專案
    query = Project.query.filter_by(status=status)
    
    # 2. 選填查詢：如果前端有傳 type 才加疊條件
    if project_type:
        query = query.filter_by(project_type=project_type)
        
    # 3. 排序 (選配)：通常會希望新專案在前面
    projects = query.order_by(Project.date_created.desc()).all()
    
    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "technologies": p.technologies,
            "image_url": p.image_url,
            "status": p.status,
            "project_type": p.project_type,
            "date_created": p.date_created.isoformat() if p.date_created else None,
            "stats": p.progress_stats 
        })
        
    return jsonify(result)

# @admin_bp.route('/projects', methods=['GET', 'OPTIONS'])
# @token_required
# def get_projects(current_admin):
#     project_type = request.args.get('type')
    
#     # 1. 效能優化：使用 joinedload 一次性抓取所有關聯層級
#     query = Project.query.options(
#         joinedload(Project.dev_features).joinedload(DevFeature.tasks)
#     )
    
#     if project_type:
#         query = query.filter_by(project_type=project_type)
    
#     projects = query.all()
    
#     result = []
#     for p in projects:
#         # 2. 調用我們在 Model 定義的 @property
#         stats = p.progress_stats 
        
#         project_data = {
#             "id": p.id,
#             "title": p.title,
#             "description": p.description,
#             "technologies": p.technologies,
#             "image_url": p.image_url,
#             "status": p.status,
#             "project_type": p.project_type,
#             "project_status": p.status,
#             "date_created": p.date_created.isoformat(),
#             # 3. 戰情室所需的關鍵統計
#             "stats": stats, 
#             "dev_features": [
#                 {
#                     "id": f.id,
#                     "title": f.title,
#                     "description": f.description,
#                     "tasks": [
#                         {
#                             "id": t.id,
#                             "content": t.content,
#                             "status": t.status,
#                             "priority": t.priority
#                         } for t in sorted(f.tasks, key=lambda x: x.priority)
#                     ]
#                 } for f in p.dev_features
#             ]
#         }
#         result.append(project_data)
        
#     return jsonify(result)

@admin_bp.route('/projects/<int:project_id>/meetings', methods=['POST', 'OPTIONS'])
@token_required
def add_meeting(current_admin, project_id):
    data = request.json
    
    # 1. 先在外面處理時間邏輯
    raw_date = data.get('date')
    if raw_date:
        # 只取前 10 碼 YYYY-MM-DD，避開後面的時分秒
        date_obj = datetime.strptime(raw_date[:10], '%Y-%m-%d')
    else:
        date_obj = datetime.utcnow()

    # 2. 實例化模型
    new_meeting = TechMeetingMinute(
        project_id=project_id,
        title=data.get('title'),
        date=date_obj,  # 傳入處理好的日期物件
        attendees=data.get('attendees', []),
        decisions=data.get('decisions', []),
        notes=data.get('notes', ''),
        actions=data.get('actions', [])
    )
    
    try:
        db.session.add(new_meeting)
        db.session.commit()
        return jsonify({"message": "Meeting saved!", "id": new_meeting.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/projects/<int:project_id>/meetings', methods=['GET'])
@token_required # 確保你有這個裝飾器處理權限
def get_project_meetings(current_admin, project_id):
    try:
        # 假設你的 Model 叫 TechMeetingMinute
        # 如果你的外鍵欄位是 project_id
        meetings = TechMeetingMinute.query.filter_by(project_id=project_id)\
            .order_by(TechMeetingMinute.date.desc())\
            .all()
        
        # 序列化成 JSON 陣列
        result = []
        for m in meetings:
            result.append({
                "id": m.id,
                "title": m.title,
                "date": m.date.isoformat() if m.date else None,
                # 列表只需要標題和日期，內容不用傳，節省頻寬
            })
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/meetings/<int:meeting_id>', methods=['GET'])
@token_required
def get_meeting_details(current_admin, meeting_id):
    meeting = TechMeetingMinute.query.get_or_404(meeting_id)
    
    return jsonify({
        "id": meeting.id,
        "project_id": meeting.project_id,
        "title": meeting.title,
        "date": meeting.date.isoformat(),
        "attendees": meeting.attendees,  # 這是 JSON
        "decisions": meeting.decisions,  # 這是 JSON
        "notes": meeting.notes,          # 💡 這裡是對應資料庫的 notes
        "actions": meeting.actions       # 這是 JSON
    }), 200

# 2. PUT: 更新現有的會議紀錄
@admin_bp.route('/meetings/<int:meeting_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_meeting(current_admin, meeting_id):
    meeting = TechMeetingMinute.query.get_or_404(meeting_id)
    data = request.json
    
    try:
        # 更新欄位
        meeting.title = data.get('title', meeting.title)
        
        # 處理日期 (維持你之前的邏輯：只取前 10 碼或完整處理)
        raw_date = data.get('date')
        if raw_date:
            meeting.date = datetime.strptime(raw_date[:10], '%Y-%m-%d')
            
        meeting.attendees = data.get('attendees', meeting.attendees)
        meeting.decisions = data.get('decisions', meeting.decisions)
        meeting.notes = data.get('notes', meeting.notes)
        meeting.actions = data.get('actions', meeting.actions)
        
        db.session.commit()
        return jsonify({"message": "Meeting updated successfully!"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# 3. DELETE: 刪除會議紀錄
@admin_bp.route('/meetings/<int:meeting_id>', methods=['DELETE'])
@token_required
def delete_meeting(current_admin, meeting_id):
    meeting = TechMeetingMinute.query.get_or_404(meeting_id)
    try:
        db.session.delete(meeting)
        db.session.commit()
        return jsonify({"message": "Meeting deleted!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/projects/warboard-stats', methods=['GET', 'OPTIONS'])
@token_required
def get_warboard_stats(current_admin):
    projects = Project.query.filter_by(status='active').all()
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

@admin_bp.route('/projects/info/<int:project_id>', methods=['GET'])
@token_required
def get_projects_info(current_admin, project_id):
    # 使用 subqueryload 優化深度查詢
    project = Project.query.options(
        subqueryload(Project.dev_features).subqueryload(DevFeature.tasks)
    ).get_or_404(project_id)
    
    # 收集 Task IDs 做情報比對 (Bug / Solution / Question)
    all_task_ids = [t.id for f in project.dev_features for t in f.tasks]
    
    bug_set, sol_set, question_set = set(), set(), set()
    if all_task_ids:
        intel_records = db.session.query(TaskLog.task_id, TaskLog.log_type)\
            .filter(TaskLog.task_id.in_(all_task_ids))\
            .filter(TaskLog.log_type.in_(['bug', 'solution', 'question']))\
            .all()
        
        for r in intel_records:
            if r.log_type == 'bug': bug_set.add(r.task_id)
            elif r.log_type == 'solution': sol_set.add(r.task_id)
            elif r.log_type == 'question': question_set.add(r.task_id)

    # 抓取相關的戰略分析
    analyses = ThinkingProject.query.filter_by(ref_id=project.id, ref_type='project').all()

    # 組裝回傳資料
    return jsonify({
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "technologies": project.technologies,
        "project_type": project.project_type,
        "thinking_analyses": [
            {"id": a.id, "title": a.title, "template_id": a.template_id} for a in analyses
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
                        "priority": t.priority,
                        "task_type": t.task_type,
                        "has_bugs": t.id in bug_set,
                        "has_solutions": t.id in sol_set,
                        "has_questions": t.id in question_set
                    } for t in sorted(f.tasks, key=lambda x: x.priority)
                ]
            } for f in project.dev_features
        ]
    })

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


@admin_bp.route('/work/statistics', methods=['GET'])
@token_required
def get_task_statistics(current_admin):
    try:
        # 1. 取得所有活躍專案的 ID 列表
        active_project_ids = [p.id for p in Project.query.filter_by(status='active').all()]

        if not active_project_ids:
            return jsonify({
                "status": "success",
                "data": {"done": 0, "pending": 0, "bugs": 0, "canceled": 0, "completion_rate": 0, "total_tasks": 0}
            }), 200

        # 2. 統計任務狀態 (僅限活躍專案)
        # 透過 DevTask -> DevFeature -> Project 的路徑進行過濾
        status_counts = db.session.query(
            DevTask.status, func.count(DevTask.id)
        ).join(DevFeature, DevTask.dev_feature_id == DevFeature.id)\
         .filter(DevFeature.project_id.in_(active_project_ids))\
         .filter(DevTask.status != 'canceled')\
         .group_by(DevTask.status).all()
        
        status_map = {status: count for status, count in status_counts}

        # 3. 統計 Bug 數量 (僅限活躍專案且不重複的 Task)
        bug_count = db.session.query(func.count(func.distinct(TaskLog.task_id)))\
            .join(DevTask, TaskLog.task_id == DevTask.id)\
            .join(DevFeature, DevTask.dev_feature_id == DevFeature.id)\
            .filter(DevFeature.project_id.in_(active_project_ids))\
            .filter(TaskLog.log_type == 'bug').scalar()

        # 4. 數據整理
        done = status_map.get('done', 0)
        # 包含 pending, doing, todo
        pending = status_map.get('pending', 0) + status_map.get('doing', 0) + status_map.get('todo', 0)
        canceled = status_map.get('canceled', 0)
        
        # 計算完成率 (不計入已取消)
        total_active = done + pending
        completion_rate = round((done / total_active) * 100) if total_active > 0 else 0

        return jsonify({
            "status": "success",
            "active": active_project_ids,
            "data": {
                "done": done,
                "pending": pending,
                "bugs": bug_count or 0,
                "canceled": canceled,
                "completion_rate": completion_rate,
                "total_tasks": done + pending + canceled
            }
        }), 200

    except Exception as e:
        print(f"DEBUG Error: {str(e)}") 
        return jsonify({"status": "error", "message": str(e)}), 500

@property
def progress_stats(self):
    # 只抓取非 canceled 的任務
    all_tasks = [t for f in self.dev_features for t in f.tasks if t.status != 'canceled']
    
    total = len(all_tasks)
    if total == 0:
        return {'percent': 0, 'remaining': 0}
    
    # 統計 done 的數量
    done_count = len([t for t in all_tasks if t.status == 'done'])
    remaining = total - done_count
    percent = round((done_count / total) * 100)
    
    return {
        'percent': percent,
        'remaining': remaining
    }