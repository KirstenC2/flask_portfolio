from flask import Blueprint, request, jsonify
from models import db, Message

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/api/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        contact_data = request.json
        new_message = Message(
            name=contact_data.get('name', ''),
            email=contact_data.get('email', ''),
            subject=contact_data.get('subject', ''),
            message=contact_data.get('message', ''),
            read=False
        )
        db.session.add(new_message)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Message received! I will get back to you soon.'})
    return jsonify({
        'email': 'choovernjet@gmail.com',
        'github': 'https://github.com/KirstenC2',
        'linkedin': 'https://linkedin.com/in/'
    })
