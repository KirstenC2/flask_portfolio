from . import admin_bp, token_required
from flask import request, jsonify
from models import db, Message

@admin_bp.route('/messages', methods=['GET', 'OPTIONS'])
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