from flask import  request, jsonify
from . import admin_bp, token_required
from models import db, DevTask, TaskLog

@admin_bp.route('/tasks/<int:task_id>/logs', methods=['GET', 'POST'])
@token_required
def handle_task_logs(current_admin, task_id):
    # 確保 Task 存在
    task = DevTask.query.get_or_404(task_id)

    # 1. 獲取該任務的所有紀錄 (READ)
    if request.method == 'GET':
        logs = TaskLog.query.filter_by(task_id=task_id).order_by(TaskLog.date_created.desc()).all()
        return jsonify([{
            "id": log.id,
            "log_type": log.log_type,
            "content": log.content,
            "date_created": log.date_created.isoformat()
        } for log in logs]), 200

    # 2. 新增一筆紀錄 (CREATE)
    if request.method == 'POST':
        data = request.json
        if not data.get('content'):
            return jsonify({"error": "內容不能為空"}), 400
            
        new_log = TaskLog(
            task_id=task_id,
            log_type=data.get('log_type', 'note'), # 預設為筆記
            content=data.get('content')
        )
        db.session.add(new_log)
        db.session.commit()
        return jsonify({"message": "紀錄已新增", "id": new_log.id}), 201

@admin_bp.route('/task-logs/<int:log_id>', methods=['PATCH', 'DELETE'])
@token_required
def modify_task_log(current_admin, log_id):
    log = TaskLog.query.get_or_404(log_id)

    # 3. 更新紀錄內容 (UPDATE)
    if request.method == 'PATCH':
        data = request.json
        if 'content' in data:
            log.content = data['content']
        if 'log_type' in data:
            log.log_type = data['log_type']
            
        db.session.commit()
        return jsonify({"message": "紀錄已更新"}), 200

    # 4. 刪除紀錄 (DELETE)
    if request.method == 'DELETE':
        db.session.delete(log)
        db.session.commit()
        return jsonify({"message": "紀錄已刪除"}), 200