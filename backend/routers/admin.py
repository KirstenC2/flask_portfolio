import os
import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import db, Project, Skill, Study, Experience, Education, Message, Admin, LifeEvent

admin_bp = Blueprint('admin', __name__)
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', 'dev-secret-key-change-in-production')

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

# ----------------------
# Projects CRUD (Admin)
# ----------------------

def _project_to_dict(p: Project):
    return {
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'technologies': p.technologies,
        'image_url': p.image_url,
        'project_url': p.project_url,
        'github_url': p.github_url,
        'date_created': p.date_created.isoformat() if p.date_created else None
    }

@admin_bp.route('/api/admin/projects', methods=['GET', 'OPTIONS'])
@token_required
def get_admin_projects(current_admin):
    projects = Project.query.order_by(Project.date_created.desc()).all()
    return jsonify([_project_to_dict(p) for p in projects])

@admin_bp.route('/api/admin/projects', methods=['POST', 'OPTIONS'])
@token_required
def create_admin_project(current_admin):
    data = request.get_json(force=True) or {}
    p = Project(
        title=(data.get('title') or '').strip(),
        description=data.get('description'),
        technologies=data.get('technologies'),
        image_url=data.get('image_url'),
        project_url=data.get('project_url'),
        github_url=data.get('github_url'),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(_project_to_dict(p)), 201

@admin_bp.route('/api/admin/projects/<int:project_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_admin_project(current_admin, project_id):
    p = Project.query.get_or_404(project_id)
    data = request.get_json(force=True) or {}
    if 'title' in data:
        p.title = (data.get('title') or '').strip()
    if 'description' in data:
        p.description = data.get('description')
    if 'technologies' in data:
        p.technologies = data.get('technologies')
    if 'image_url' in data:
        p.image_url = data.get('image_url')
    if 'project_url' in data:
        p.project_url = data.get('project_url')
    if 'github_url' in data:
        p.github_url = data.get('github_url')
    db.session.commit()
    return jsonify(_project_to_dict(p))

@admin_bp.route('/api/admin/projects/<int:project_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_project(current_admin, project_id):
    p = Project.query.get_or_404(project_id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})

# ----------------------
# Skills CRUD (Admin)
# ----------------------

def _skill_to_dict(s: Skill):
    return {
        'id': s.id,
        'name': s.name,
        'category': s.category,
        'proficiency': s.proficiency,
    }

@admin_bp.route('/api/admin/skills', methods=['GET', 'OPTIONS'])
@token_required
def list_admin_skills(current_admin):
    skills = Skill.query.order_by(Skill.category.asc(), Skill.name.asc()).all()
    return jsonify([_skill_to_dict(s) for s in skills])

@admin_bp.route('/api/admin/skills', methods=['POST', 'OPTIONS'])
@token_required
def create_admin_skill(current_admin):
    data = request.get_json(force=True) or {}
    s = Skill(
        name=(data.get('name') or '').strip(),
        category=data.get('category') or '',
        proficiency=int(data.get('proficiency') or 0),
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(_skill_to_dict(s)), 201

@admin_bp.route('/api/admin/skills/<int:skill_id>', methods=['PUT', 'OPTIONS'])
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
    db.session.commit()
    return jsonify(_skill_to_dict(s))

@admin_bp.route('/api/admin/skills/<int:skill_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_skill(current_admin, skill_id):
    s = Skill.query.get_or_404(skill_id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({'message': 'Skill deleted'})

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

@admin_bp.route('/api/admin/studies', methods=['GET', 'OPTIONS'])
@token_required
def list_admin_studies(current_admin):
    studies = Study.query.order_by(Study.id.desc()).all()
    return jsonify([_study_to_dict(st) for st in studies])

@admin_bp.route('/api/admin/studies', methods=['POST', 'OPTIONS'])
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

@admin_bp.route('/api/admin/studies/<int:study_id>', methods=['PUT', 'OPTIONS'])
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

@admin_bp.route('/api/admin/studies/<int:study_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_admin_study(current_admin, study_id):
    st = Study.query.get_or_404(study_id)
    db.session.delete(st)
    db.session.commit()
    return jsonify({'message': 'Study deleted'})

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

@admin_bp.route('/api/admin/life-events', methods=['GET', 'OPTIONS'])
@token_required
def list_life_events(current_admin):
    events = LifeEvent.query.order_by(LifeEvent.order.desc()).all()
    return jsonify([_life_event_to_dict(ev) for ev in events])

@admin_bp.route('/api/admin/life-events', methods=['POST', 'OPTIONS'])
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

@admin_bp.route('/api/admin/life-events/<int:event_id>', methods=['PUT', 'OPTIONS'])
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

@admin_bp.route('/api/admin/life-events/<int:event_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_life_event(current_admin, event_id):
    ev = LifeEvent.query.get_or_404(event_id)
    db.session.delete(ev)
    db.session.commit()
    return jsonify({'message': 'Life event deleted'})

# ----------------------
# Experience CRUD (Admin)
# ----------------------

def _exp_to_dict(exp: Experience):
    return {
        'id': exp.id,
        'title': exp.title,
        'company': exp.company,
        'description': exp.description,
        'start_date': exp.start_date.isoformat() if exp.start_date else None,
        'end_date': exp.end_date.isoformat() if exp.end_date else None,
        'is_current': exp.is_current,
        'order': exp.order,
    }

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

@admin_bp.route('/api/admin/experience', methods=['GET', 'OPTIONS'])
@token_required
def list_experience(current_admin):
    exps = Experience.query.order_by(Experience.order.desc()).all()
    return jsonify([_exp_to_dict(e) for e in exps])

@admin_bp.route('/api/admin/experience', methods=['POST', 'OPTIONS'])
@token_required
def create_experience(current_admin):
    data = request.get_json(force=True) or {}
    exp = Experience(
        title=(data.get('title') or '').strip(),
        company=(data.get('company') or '').strip(),
        description=data.get('description') or '',
        start_date=_parse_dt(data.get('start_date')),
        end_date=_parse_dt(data.get('end_date')),
        is_current=bool(data.get('is_current', False)),
        order=int(data.get('order') or 0) if str(data.get('order') or '').lstrip('-').isdigit() else 0,
    )
    db.session.add(exp)
    db.session.commit()
    return jsonify(_exp_to_dict(exp)), 201

@admin_bp.route('/api/admin/experience/<int:exp_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_experience(current_admin, exp_id):
    exp = Experience.query.get_or_404(exp_id)
    data = request.get_json(force=True) or {}
    if 'title' in data:
        exp.title = (data.get('title') or '').strip()
    if 'company' in data:
        exp.company = (data.get('company') or '').strip()
    if 'description' in data:
        exp.description = data.get('description') or ''
    if 'start_date' in data:
        exp.start_date = _parse_dt(data.get('start_date'))
    if 'end_date' in data:
        exp.end_date = _parse_dt(data.get('end_date'))
    if 'is_current' in data:
        exp.is_current = bool(data.get('is_current'))
    if 'order' in data:
        try:
            exp.order = int(data.get('order') or 0)
        except Exception:
            pass
    db.session.commit()
    return jsonify(_exp_to_dict(exp))

@admin_bp.route('/api/admin/experience/<int:exp_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_experience(current_admin, exp_id):
    exp = Experience.query.get_or_404(exp_id)
    db.session.delete(exp)
    db.session.commit()
    return jsonify({'message': 'Experience deleted'})

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

@admin_bp.route('/api/admin/education', methods=['GET', 'OPTIONS'])
@token_required
def list_education(current_admin):
    items = Education.query.order_by(Education.order.desc()).all()
    return jsonify([_edu_to_dict(e) for e in items])

@admin_bp.route('/api/admin/education', methods=['POST', 'OPTIONS'])
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

@admin_bp.route('/api/admin/education/<int:edu_id>', methods=['PUT', 'OPTIONS'])
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

@admin_bp.route('/api/admin/education/<int:edu_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_education(current_admin, edu_id):
    edu = Education.query.get_or_404(edu_id)
    db.session.delete(edu)
    db.session.commit()
    return jsonify({'message': 'Education deleted'})
