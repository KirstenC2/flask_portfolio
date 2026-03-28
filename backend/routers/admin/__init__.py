import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify
from models import Admin
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', 'dev-secret-key-change-in-production')

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # 💡 關鍵修正：如果是預檢請求，直接回傳成功（204 No Content）
        # 這樣就不會進入後面的 Token 檢查邏輯
        if request.method == 'OPTIONS':
            return '', 204

        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, APP_SECRET_KEY, algorithms=['HS256'])
            current_admin = Admin.query.get(data['admin_id'])
            if not current_admin:
                return jsonify({'message': 'Invalid token!'}), 401
        except Exception as e:
            return jsonify({'message': f'Token error: {str(e)}'}), 401

        return f(current_admin, *args, **kwargs)
    return decorated

# Crucial: Import the routes AFTER defining admin_bp to avoid circular imports
from . import health,auth, skills, education, life_events,study, experience, dev_tasks, templates,warboard, motor, incomes, savings, recurring_expenses, quotation, projects, expenses, task_logs, message