from . import admin_bp,APP_SECRET_KEY, token_required
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from models import db, Education
def _parse_dt(val):
    if not val:
        return None
    from datetime import datetime
    try:
        return datetime.fromisoformat(val)
    except ValueError:
        try:
            return datetime.strptime(val, '%Y-%m-%d')
        except Exception:
            return None
# ----------------------
# Education CRUD (Admin)
# ----------------------

def _edu_to_dict(edu: Education):
    return {
        'id': edu.id,
        'degree': edu.degree,
        'school': edu.school,
        'description': edu.description,
        'start_date': edu.start_date.isoformat() if edu.start_date else None,
        'end_date': edu.end_date.isoformat() if edu.end_date else None,
        'is_current': edu.is_current,
        'order': edu.order,
    }

@admin_bp.route('/education', methods=['GET', 'OPTIONS'])
@token_required
def list_education(current_admin):
    items = Education.query.order_by(Education.order.desc()).all()
    return jsonify([_edu_to_dict(e) for e in items])

@admin_bp.route('/education', methods=['POST', 'OPTIONS'])
@token_required
def create_education(current_admin):
    data = request.get_json(force=True) or {}
    edu = Education(
        degree=(data.get('degree') or '').strip(),
        school=(data.get('school') or '').strip(),
        description=data.get('description') or '',
        start_date=_parse_dt(data.get('start_date')),
        end_date=_parse_dt(data.get('end_date')),
        is_current=bool(data.get('is_current', False)),
        order=int(data.get('order') or 0) if str(data.get('order') or '').lstrip('-').isdigit() else 0,
    )
    db.session.add(edu)
    db.session.commit()
    return jsonify(_edu_to_dict(edu)), 201

@admin_bp.route('/education/<int:edu_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_education(current_admin, edu_id):
    edu = Education.query.get_or_404(edu_id)
    data = request.get_json(force=True) or {}
    if 'degree' in data:
        edu.degree = (data.get('degree') or '').strip()
    if 'school' in data:
        edu.school = (data.get('school') or '').strip()
    if 'description' in data:
        edu.description = data.get('description') or ''
    if 'start_date' in data:
        edu.start_date = _parse_dt(data.get('start_date'))
    if 'end_date' in data:
        edu.end_date = _parse_dt(data.get('end_date'))
    if 'is_current' in data:
        edu.is_current = bool(data.get('is_current'))
    if 'order' in data:
        try:
            edu.order = int(data.get('order') or 0)
        except Exception:
            pass
    db.session.commit()
    return jsonify(_edu_to_dict(edu))

@admin_bp.route('/education/<int:edu_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_education(current_admin, edu_id):
    edu = Education.query.get_or_404(edu_id)
    db.session.delete(edu)
    db.session.commit()
    return jsonify({'message': 'Education deleted'})
