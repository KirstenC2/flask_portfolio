from . import admin_bp, token_required
from flask import request, jsonify
from models import DevTask

def _dev_task_to_dict(dt: DevTask):
    return {
        'id': dt.id,
        'title': dt.title,
        'description': dt.description,
        'status': dt.status,
        'priority': dt.priority,
        'due_date': dt.due_date.isoformat() if dt.due_date else None,
        'date_created': dt.date_created.isoformat() if dt.date_created else None
    }

@admin_bp.route('/dev-tasks', methods=['GET', 'OPTIONS'])
@token_required
def get_admin_dev_tasks(current_admin):
    dev_tasks = DevTask.query.order_by(DevTask.date_created.desc()).all()
    return jsonify([_dev_task_to_dict(dt) for dt in dev_tasks])
