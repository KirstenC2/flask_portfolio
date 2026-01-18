from flask_cors import CORS
from models import Skill,db
from ..utils.auth import token_required
from flask import Blueprint, request, jsonify
import os
admin_skill_bp = Blueprint('admin_skill', __name__)
CORS(admin_skill_bp, 
     resources={"/api/admin/skills/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"])
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', 'dev-secret-key-change-in-production')


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

@admin_skill_bp.route('/api/admin/skills', methods=['GET', 'OPTIONS'])
@token_required
def list_admin_skills(current_admin):
    skills = Skill.query.order_by(Skill.category.asc(), Skill.name.asc()).all()
    return jsonify([_skill_to_dict(s) for s in skills])

@admin_skill_bp.route('/api/admin/skills', methods=['POST', 'OPTIONS'])
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

@admin_skill_bp.route('/api/admin/skills/<int:skill_id>', methods=['PUT', 'OPTIONS'])
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

@admin_skill_bp.route('/api/admin/skills/<int:skill_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_skill(current_admin, skill_id):
    s = Skill.query.get_or_404(skill_id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({'message': 'Skill deleted'})
