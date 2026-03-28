from flask import request, jsonify
from datetime import datetime
from . import admin_bp, token_required
from models import db, DevTask, TaskLog

@admin_bp.route('/tasks/<int:task_id>/logs', methods=['GET', 'POST'])
@token_required
def handle_task_logs(current_admin, task_id):
    task = DevTask.query.get_or_404(task_id)

    # 1. 獲取該任務的所有紀錄 (READ)
    if request.method == 'GET':
        logs = TaskLog.query.filter_by(task_id=task_id).order_by(TaskLog.date_created.desc()).all()
        return jsonify([{
            "id": log.id,
            "log_type": log.log_type,
            "content": log.content,
            "responses": log.responses,              # 新增
            "is_resolved": log.is_resolved,    # 新增
            "date_resolved": log.date_resolved.isoformat() if log.date_resolved else None, # 新增
            "date_created": log.date_created.isoformat()
        } for log in logs]), 200

    # 2. 新增一筆紀錄 (CREATE)
    if request.method == 'POST':
        data = request.json
        if not data.get('content'):
            return jsonify({"error": "內容不能為空"}), 400
            
        new_log = TaskLog(
            task_id=task_id,
            log_type=data.get('log_type', 'note'),
            content=data.get('content'),
            responses=data.get('responses', []), # 允許新增時帶入答案
            is_resolved=bool(data.get('responses')) # 如果有給答案，自動設為已解決
        )
        
        if new_log.is_resolved:
            new_log.date_resolved = datetime.utcnow()

        db.session.add(new_log)
        db.session.commit()
        return jsonify({"message": "紀錄已新增", "id": new_log.id}), 201

@admin_bp.route('/task-logs/<int:log_id>', methods=['PATCH', 'DELETE'])
@token_required
def modify_task_log(current_admin, log_id):
    log = TaskLog.query.get_or_404(log_id)
    
    if request.method == 'DELETE':
        db.session.delete(log)
        db.session.commit()
        return jsonify({"message": "紀錄已刪除"}), 200

    if request.method == 'PATCH':
        data = request.json
        
        # 處理基本內容更新
        if 'content' in data:
            log.content = data['content']
        
        # --- 核心邏輯：處理 JSON 格式的 responses ---
        if 'new_response' in data:
            # 確保原本是 list，避免 null 報錯
            current_responses = list(log.responses) if log.responses else []
            
            # 建立新的回覆物件
            new_entry = {
                "text": data['new_response'],
                "admin": current_admin.username,
                "date_created": datetime.utcnow().isoformat()
            }
            
            current_responses.append(new_entry)
            log.responses = current_responses # 重新指派以觸發 SQLAlchemy 的變動追蹤
            
            # 自動標記為已解決 (如果有回覆的話)
            log.is_resolved = True
            log.date_resolved = datetime.utcnow()
            
        db.session.commit()
        return jsonify({
            "message": "紀錄已更新", 
            "responses": log.responses,
            "is_resolved": log.is_resolved
        }), 200