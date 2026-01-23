from . import admin_bp,APP_SECRET_KEY, token_required
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from models import db, Admin

@admin_bp.route('/login', methods=['POST'])
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

@admin_bp.route('/register', methods=['POST'])
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
