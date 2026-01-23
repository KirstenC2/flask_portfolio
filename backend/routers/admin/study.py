from . import admin_bp,APP_SECRET_KEY, token_required
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from models import db, Study

# ----------------------
# Studies CRUD (Admin)
# ----------------------

def _study_to_dict(st: Study):
    return {
        'id': st.id,
        'title': st.title,
        'description': st.description,
        'category': st.category,
        'source': st.source,
        'status': st.status,
        'progress': st.progress,
        'start_date': st.start_date.isoformat() if getattr(st, 'start_date', None) else None,
        'completion_date': st.completion_date.isoformat() if getattr(st, 'completion_date', None) else None,
        'github_url': st.github_url,
        'certificate_url': st.certificate_url,
        'notes': st.notes,
    }

def _parse_date_maybe(value):
    if not value:
        return None
    try:
        from datetime import datetime
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return datetime.strptime(value, '%Y-%m-%d')
    except Exception:
        return None

@admin_bp.route('/studies', methods=['GET', 'OPTIONS'])
@token_required
def list_admin_studies(current_admin):
    studies = Study.query.order_by(Study.id.desc()).all()
    return jsonify([_study_to_dict(st) for st in studies])

@admin_bp.route('/studies', methods=['POST', 'OPTIONS'])
@token_required
def create_admin_study(current_admin):
    data = request.get_json(force=True) or {}
    st = Study(
        title=(data.get('title') or '').strip(),
        description=data.get('description'),
        category=data.get('category'),
        source=data.get('source'),
        status=data.get('status'),
        progress=int(data.get('progress') or 0),
        start_date=_parse_date_maybe(data.get('start_date')),
        completion_date=_parse_date_maybe(data.get('completion_date')),
        github_url=data.get('github_url'),
        certificate_url=data.get('certificate_url'),
        notes=data.get('notes'),
    )
    db.session.add(st)
    db.session.commit()
    return jsonify(_study_to_dict(st)), 201

@admin_bp.route('/studies/<int:study_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_admin_study(current_admin, study_id):
    st = Study.query.get_or_404(study_id)
    data = request.get_json(force=True) or {}
    if 'title' in data:
        st.title = (data.get('title') or '').strip()
    if 'description' in data:
        st.description = data.get('description')
    if 'category' in data:
        st.category = data.get('category')
    if 'source' in data:
        st.source = data.get('source')
    if 'status' in data:
        st.status = data.get('status')
    if 'progress' in data:
        try:
            st.progress = int(data.get('progress') or 0)
        except Exception:
            pass
    if 'start_date' in data:
        st.start_date = _parse_date_maybe(data.get('start_date'))
    if 'completion_date' in data:
        st.completion_date = _parse_date_maybe(data.get('completion_date'))
    if 'github_url' in data:
        st.github_url = data.get('github_url')
    if 'certificate_url' in data:
        st.certificate_url = data.get('certificate_url')
    if 'notes' in data:
        st.notes = data.get('notes')
    db.session.commit()
    return jsonify(_study_to_dict(st))

@admin_bp.route('/studies/<int:study_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_study(current_admin, study_id):
    st = Study.query.get_or_404(study_id)
    db.session.delete(st)
    db.session.commit()
    return jsonify({'message': 'Study deleted'})

