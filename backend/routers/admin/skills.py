from . import admin_bp,APP_SECRET_KEY, token_required
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from models import db, Skill

# ----------------------
# Skills CRUD (Admin)
# ----------------------

def _skill_to_dict(s: Skill):
    return {
        'id': s.id,
        'name': s.name,
        'category': s.category,
        'proficiency': s.proficiency,
        'description': s.description,
    }

@admin_bp.route('/skills', methods=['GET', 'OPTIONS'])
@token_required
def list_admin_skills(current_admin):
    skills = Skill.query.order_by(Skill.category.asc(), Skill.name.asc()).all()
    return jsonify([_skill_to_dict(s) for s in skills])

@admin_bp.route('/skills', methods=['POST', 'OPTIONS'])
@token_required
def create_admin_skill(current_admin):
    data = request.get_json(force=True) or {}
    s = Skill(
        name=(data.get('name') or '').strip(),
        category=data.get('category') or '',
        proficiency=int(data.get('proficiency') or 0),
        description=data.get('description') or '',
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(_skill_to_dict(s)), 201

@admin_bp.route('/skills/<int:skill_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_admin_skill(current_admin, skill_id):
    s = Skill.query.get_or_404(skill_id)
    data = request.get_json(force=True) or {}
    if 'name' in data:
        s.name = (data.get('name') or '').strip()
    if 'category' in data:
        s.category = data.get('category') or ''
    if 'proficiency' in data:
        try:
            s.proficiency = int(data.get('proficiency') or 0)
        except Exception:
            pass
    if 'description' in data:
        s.description = data.get('description') or ''
    db.session.commit()
    return jsonify(_skill_to_dict(s))

@admin_bp.route('/skills/<int:skill_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_skill(current_admin, skill_id):
    s = Skill.query.get_or_404(skill_id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({'message': 'Skill deleted'})
