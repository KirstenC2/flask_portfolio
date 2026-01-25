from . import admin_bp, token_required
from flask import request, jsonify
from models import db, DevTask, DevFeature

def _dev_task_to_dict(dt: DevTask):
    return {
        'id': dt.id,
        'content': dt.content,
        'status': dt.status,
        'priority': dt.priority,
        'cancel_reason': dt.cancel_reason,
        'dev_feature_id': dt.dev_feature_id,
        'date_created': dt.date_created.isoformat() if dt.date_created else None
    }

def _dev_feature_to_dict(df: DevFeature):
    return {
        'id': df.id,
        'title': df.title,
        'description': df.description,
        'project_title': df.project.title,
        'tasks': [_dev_task_to_dict(t) for t in df.tasks]
    }
# ====
#   task
# ===

@admin_bp.route('/tasks/<int:task_id>', methods=['DELETE','OPTIONS'])
@token_required
def delete_dev_task(current_admin, task_id):
    task = DevTask.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'})

@admin_bp.route('/tasks/<int:task_id>', methods=['PATCH','OPTIONS'])
@token_required
def edit_dev_task(current_admin, task_id):
    task = DevTask.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'status' in data:
        task.status = data['status']
    if 'content' in data:
        task.content = data['content']
    if 'cancel_reason' in data:
        task.cancel_reason = data['cancel_reason']
    if 'priority' in data:
        task.priority = data['priority']
    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})


@admin_bp.route('/dev-tasks', methods=['GET', 'OPTIONS'])
@token_required
def get_admin_dev_tasks(current_admin):
    dev_tasks = DevTask.query.join(DevFeature).order_by(DevTask.date_created.desc()).all()
    return jsonify([_dev_task_to_dict(dt) for dt in dev_tasks])

@admin_bp.route('/dev-tasks/<int:feature_id>', methods=['GET'])
@token_required
def get_feature_detail(current_admin, feature_id):
    feature = DevFeature.query.get_or_404(feature_id)
    
    return jsonify({
        "id": feature.id,
        "title": feature.title,
        "description": feature.description,
        "project_title": feature.project.title, # 方便在前端顯示麵包屑導航
        "tasks": [
            {
                "id": t.id,
                "content": t.content,
                "status": t.status,
                "priority": t.priority,
                "cancel_reason": t.cancel_reason,
                "date_created": t.date_created.isoformat()
            } for t in feature.tasks
        ]
    })


@admin_bp.route('features/<int:feature_id>/tasks', methods=['POST','OPTIONS'])
@token_required
def add_new_dev_task(current_admin, feature_id):
    data = request.get_json()
    
    task = DevTask(
        dev_feature_id=feature_id,
        content=data.get('content'),
        status=data.get('status'),
        priority=data.get('priority'),
        cancel_reason=data.get('cancel_reason')
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify(_dev_task_to_dict(task))


@admin_bp.route('projects/<int:project_id>/features', methods=['POST','OPTIONS'])
@token_required
def add_new_feature(current_admin, project_id):
    data = request.get_json()
    
    feature = DevFeature(
        project_id=project_id,
        title=data.get('title'),
        description=data.get('description')
    )
    
    db.session.add(feature)
    db.session.commit()
    
    return jsonify(_dev_feature_to_dict(feature))
