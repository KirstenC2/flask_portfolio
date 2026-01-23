import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from models import Admin
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', 'dev-secret-key-change-in-production')

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # 1. Handle OPTIONS immediately
        if request.method == 'OPTIONS':
            return ('', 204)

        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            # Note: Ensure APP_SECRET_KEY is accessible here
            data = jwt.decode(token, APP_SECRET_KEY, algorithms=['HS256'])
            current_admin = Admin.query.get(data['admin_id'])
            if not current_admin:
                return jsonify({'message': 'Invalid token!'}), 401
        except Exception as e:
            return jsonify({'message': f'Token error: {str(e)}'}), 401

        # 2. Pass current_admin to the actual route function
        return f(current_admin, *args, **kwargs)
    return decorated
# Crucial: Import the routes AFTER defining admin_bp to avoid circular imports
from . import auth, admin, skills, education, life_events,study, projects, admin