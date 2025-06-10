import os
import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import db, Project, Skill, Study, Experience, Education, Message, Admin

admin_bp = Blueprint('admin', __name__)
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', 'dev-secret-key-change-in-production')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
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

@admin_bp.route('/api/admin/login', methods=['POST'])
def login():
    auth = request.json
    if not auth or not auth.get('username') or not auth.get('password'):
        return jsonify({'message': 'Could not verify', 'error': 'Missing username or password'}), 401
    admin = Admin.query.filter_by(username=auth.get('username')).first()
    if not admin:
        return jsonify({'message': 'Could not verify', 'error': 'User not found'}), 401
    if admin.check_password(auth.get('password')):
        token = jwt.encode({
            'admin_id': admin.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, APP_SECRET_KEY, algorithm='HS256')
        admin.last_login = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'token': token,
            'admin': {
                'id': admin.id,
                'username': admin.username,
                'email': admin.email
            }
        })
    return jsonify({'message': 'Could not verify', 'error': 'Invalid password'}), 401

@admin_bp.route('/api/admin/register', methods=['POST'])
def register_admin():
    if Admin.query.count() > 0:
        return jsonify({'message': 'Admin already exists', 'error': 'Registration is disabled'}), 403
    data = request.json
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing data', 'error': 'Please provide username, email and password'}), 400
    new_admin = Admin(username=data.get('username'), email=data.get('email'))
    new_admin.set_password(data.get('password'))
    db.session.add(new_admin)
    db.session.commit()
    return jsonify({'message': 'Admin registered successfully'}), 201

# ... 其餘 /api/admin 路由全部複製過來，將 @app.route 改為 @admin_bp.route，token_required 也一併搬過來 ...

@admin_bp.route('/api/admin/messages', methods=['GET'])
@token_required
def get_messages(current_admin):
    messages = Message.query.order_by(Message.date_received.desc()).all()
    message_list = [{
        'id': msg.id,
        'name': msg.name,
        'email': msg.email,
        'subject': msg.subject,
        'message': msg.message,
        'read': msg.read,
        'date_received': msg.date_received.isoformat()
    } for msg in messages]
    return jsonify(message_list)

# ... 其餘 admin 相關路由同理 ...
