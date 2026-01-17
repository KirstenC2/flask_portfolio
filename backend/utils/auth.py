import jwt
import os
from functools import wraps
from flask import request, jsonify
from models import Admin

APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', 'dev-secret-key')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow CORS preflight to pass without auth
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
            data = jwt.decode(token, APP_SECRET_KEY, algorithms=['HS256'])
            current_admin = Admin.query.filter_by(id=data['admin_id']).first()
            if not current_admin:
                return jsonify({'message': 'Invalid token!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401
        return f(current_admin, *args, **kwargs)
    return decorated

