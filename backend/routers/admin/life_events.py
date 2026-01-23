from . import admin_bp,APP_SECRET_KEY, token_required
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from models import db, LifeEvent

# ----------------------
# Life Events CRUD (Admin)
# ----------------------

def _parse_date(value):
    if not value:
        return None
    try:
        # Accept ISO strings like '2024-12-20' or '2024-12-20T00:00:00'
        from datetime import datetime
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return datetime.strptime(value, '%Y-%m-%d')
    except Exception:
        return None

def _life_event_to_dict(ev: LifeEvent):
    return {
        'id': ev.id,
        'title': ev.title,
        'description': ev.description,
        'start_date': ev.start_date.isoformat() if ev.start_date else None,
        'end_date': ev.end_date.isoformat() if ev.end_date else None,
        'is_current': ev.is_current,
        'order': ev.order,
    }

@admin_bp.route('/life-events', methods=['GET', 'OPTIONS'])
@token_required
def list_life_events(current_admin):
    events = LifeEvent.query.order_by(LifeEvent.order.desc()).all()
    return jsonify([_life_event_to_dict(ev) for ev in events])

@admin_bp.route('/life-events', methods=['POST', 'OPTIONS'])
@token_required
def create_life_event(current_admin):
    data = request.get_json(force=True) or {}
    ev = LifeEvent(
        title=data.get('title', '').strip(),
        description=data.get('description'),
        start_date=_parse_date(data.get('start_date')),
        end_date=_parse_date(data.get('end_date')),
        is_current=bool(data.get('is_current', False)),
        order=int(data.get('order', 0)) if str(data.get('order', '0')).isdigit() else 0,
    )
    db.session.add(ev)
    db.session.commit()
    return jsonify(_life_event_to_dict(ev)), 201

@admin_bp.route('/life-events/<int:event_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_life_event(current_admin, event_id):
    ev = LifeEvent.query.get_or_404(event_id)
    data = request.get_json(force=True) or {}
    if 'title' in data:
        ev.title = (data.get('title') or '').strip()
    if 'description' in data:
        ev.description = data.get('description')
    if 'start_date' in data:
        ev.start_date = _parse_date(data.get('start_date'))
    if 'end_date' in data:
        ev.end_date = _parse_date(data.get('end_date'))
    if 'is_current' in data:
        ev.is_current = bool(data.get('is_current'))
    if 'order' in data:
        try:
            ev.order = int(data.get('order') or 0)
        except Exception:
            pass
    db.session.commit()
    return jsonify(_life_event_to_dict(ev))

@admin_bp.route('/life-events/<int:event_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_life_event(current_admin, event_id):
    ev = LifeEvent.query.get_or_404(event_id)
    db.session.delete(ev)
    db.session.commit()
    return jsonify({'message': 'Life event deleted'})
