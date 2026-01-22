import os
from flask import Blueprint, jsonify, request
from models import db, Project, Skill, Study, Experience, Education, LifeEvent, Introduction
import json
from datetime import datetime

home_bp = Blueprint('home', __name__)

UI_URL = os.environ.get('UI_URL', 'http://localhost:3000')

def format_date_range(start_date, end_date, is_current=False):
    start_year = start_date.year if start_date else ''
    if is_current:
        return f"{start_year} - Present"
    elif end_date:
        end_year = end_date.year
        if start_year == end_year:
            return str(start_year)
        else:
            return f"{start_year} - {end_year}"
    else:
        return str(start_year)

@home_bp.route('/api/home', methods=['GET'])
def home():
    projects = Project.query.order_by(Project.date_created.desc()).limit(3).all()
    featured_projects = [{
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'technologies': project.technologies,
        'image_url': project.image_url,
        'github_url': project.github_url,
        'date_created': project.date_created.isoformat() if project.date_created else None
    } for project in projects]
    skills = Skill.query.order_by(Skill.proficiency.desc()).limit(6).all()
    top_skills = [{
        'id': skill.id,
        'name': skill.name,
        'category': skill.category,
        'proficiency': skill.proficiency
    } for skill in skills]
    return jsonify({'featured_projects': featured_projects, 'top_skills': top_skills, 'ui_url': UI_URL})

@home_bp.route('/api/about', methods=['GET'])
def about():
    about_info = {
        'name': 'Kirsten Choo',
        'title': 'Fullstack Developer',
        'bio': 'Passionate about creating elegant, user-friendly applications with clean code.',
        'email': 'choovernjet@gmail.com'
    }
    experiences = Experience.query.order_by(Experience.order.desc()).all()
    experience_data = [{
        'id': exp.id,
        'title': exp.title,
        'company': exp.company,
        'description': exp.description,
        'start_date': exp.start_date.isoformat() if exp.start_date else None,
        'end_date': exp.end_date.isoformat() if exp.end_date else None,
        'is_current': exp.is_current,
        'year': format_date_range(exp.start_date, exp.end_date, exp.is_current),
        'projects': [
            {
                'id': p.id,
                'title': p.title,
                'description': p.description,
                'technologies': p.technologies,
                'project_url': p.project_url,
                'github_url': p.github_url,
            } for p in getattr(exp, 'projects', [])
        ]
    } for exp in experiences]
    education = Education.query.order_by(Education.order.desc()).all()
    education_data = [{
        'id': edu.id,
        'degree': edu.degree,
        'school': edu.school,
        'description': edu.description,
        'start_date': edu.start_date.isoformat() if edu.start_date else None,
        'end_date': edu.end_date.isoformat() if edu.end_date else None,
        'is_current': edu.is_current,
        'year': format_date_range(edu.start_date, edu.end_date, edu.is_current)
    } for edu in education]
    life_events = LifeEvent.query.order_by(LifeEvent.order.desc()).all()
    life_events_data = [{
        'id': ev.id,
        'title': ev.title,
        'description': ev.description,
        'start_date': ev.start_date.isoformat() if ev.start_date else None,
        'end_date': ev.end_date.isoformat() if ev.end_date else None,
        'is_current': ev.is_current,
        'year': format_date_range(ev.start_date, ev.end_date, ev.is_current)
    } for ev in life_events]
    return jsonify({**about_info, 'experiences': experience_data, 'education': education_data, 'life_events': life_events_data})

@home_bp.route('/api/introduction', methods=['GET'])
def introduction():
    # Optional role filter: /api/introduction?role=TPM
    requested_role = request.args.get('role')
    if requested_role:
        intro = Introduction.query.filter_by(role=requested_role).first()
        if not intro:
            intro = Introduction.query.first()
    else:
        intro = Introduction.query.first()
    # Gather all distinct roles for client-side switching
    try:
        available_roles = [r[0] for r in db.session.query(Introduction.role).distinct().all() if r[0]]
    except Exception:
        available_roles = []
    # Minimal about info aligned with current model
    about_info = {
        'role': getattr(intro, 'role', None) or 'TPM',
        'available_roles': available_roles,
        'bio': getattr(intro, 'bio', None),
    }
    # Parse JSON fields safely
    def parse_json_field(value, default):
        if not value:
            return default
        try:
            return json.loads(value)
        except Exception:
            return default

    # New field names on Introduction model
    languages = parse_json_field(getattr(intro, 'languages_code', None), ['ko','zh','en'])
    skill_passages = intro.skill_passages
    experiences = Experience.query.order_by(Experience.order.desc()).all()
    experience_data = [{
        'id': exp.id,
        'title': exp.title,
        'company': exp.company,
        'description': exp.description,
        'start_date': exp.start_date.isoformat() if exp.start_date else None,
        'end_date': exp.end_date.isoformat() if exp.end_date else None,
        'is_current': exp.is_current,
        'year': format_date_range(exp.start_date, exp.end_date, exp.is_current),
    } for exp in experiences]
    education = Education.query.order_by(Education.order.desc()).all()
    education_data = [{
        'id': edu.id,
        'degree': edu.degree,
        'school': edu.school,
        'description': edu.description,
        'start_date': edu.start_date.isoformat() if edu.start_date else None,
        'end_date': edu.end_date.isoformat() if edu.end_date else None,
        'is_current': edu.is_current,
        'year': format_date_range(edu.start_date, edu.end_date, edu.is_current)
    } for edu in education]
    return jsonify({
        **about_info,
        'experiences': experience_data,
        'education': education_data,
        'languages': languages,
        'bio': intro.bio,
        'skill_passages': skill_passages,
    })

@home_bp.route('/api/experience', methods=['GET'])
def experience():
    """Return experience page data expected by the frontend.
    Structure includes: name, title, email, bio, experiences[], education[].
    """
    about_info = {
        'name': 'Kirsten Choo',
        'title': 'Fullstack Developer',
        'bio': 'Passionate about creating elegant, user-friendly applications with clean code.',
        'email': 'choovernjet@gmail.com'
    }
    experiences = Experience.query.order_by(Experience.order.desc()).all()
    experience_data = [{
        'id': exp.id,
        'title': exp.title,
        'company': exp.company,
        'description': exp.description,
        'start_date': exp.start_date.isoformat() if exp.start_date else None,
        'end_date': exp.end_date.isoformat() if exp.end_date else None,
        'is_current': exp.is_current,
        'year': format_date_range(exp.start_date, exp.end_date, exp.is_current),
        'projects': [
            {
                'id': p.id,
                'title': p.title,
                'description': p.description,
                'technologies': p.technologies,
                'project_url': p.project_url,
                'github_url': p.github_url,
            } for p in getattr(exp, 'projects', [])
        ]
    } for exp in experiences]
    education = Education.query.order_by(Education.order.desc()).all()
    education_data = [{
        'id': edu.id,
        'degree': edu.degree,
        'school': edu.school,
        'description': edu.description,
        'start_date': edu.start_date.isoformat() if edu.start_date else None,
        'end_date': edu.end_date.isoformat() if edu.end_date else None,
        'is_current': edu.is_current,
        'year': format_date_range(edu.start_date, edu.end_date, edu.is_current)
    } for edu in education]
    life_events = LifeEvent.query.order_by(LifeEvent.order.desc()).all()
    life_events_data = [{
        'id': ev.id,
        'title': ev.title,
        'description': ev.description,
        'start_date': ev.start_date.isoformat() if ev.start_date else None,
        'end_date': ev.end_date.isoformat() if ev.end_date else None,
        'is_current': ev.is_current,
        'year': format_date_range(ev.start_date, ev.end_date, ev.is_current)
    } for ev in life_events]
    return jsonify({**about_info, 'experiences': experience_data, 'education': education_data, 'life_events': life_events_data})

@home_bp.route('/api/projects', methods=['GET'])
def projects():
    all_projects = Project.query.order_by(Project.date_created.desc()).all()
    projects_data = [{
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'technologies': project.technologies,
        'image_url': project.image_url,
        'goals': project.goals,
        'features': project.features,
        'github_url': project.github_url,
        'date_created': project.date_created.isoformat() if project.date_created else None
    } for project in all_projects]
    return jsonify(projects_data)

@home_bp.route('/api/project/<int:project_id>', methods=['GET'])
def project(project_id):
    project = Project.query.get_or_404(project_id)
    project_data = {
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'technologies': project.technologies,
        'image_url': project.image_url,
        'goals': project.goals,
        'features': project.features,
        'github_url': project.github_url,
        'date_created': project.date_created.isoformat() if project.date_created else None
    }
    return jsonify(project_data)

@home_bp.route('/api/skills', methods=['GET'])
def skills():
    all_skills = Skill.query.all()
    skill_categories = {}
    for skill in all_skills:
        if skill.category not in skill_categories:
            skill_categories[skill.category] = []
        skill_categories[skill.category].append({
            'id': skill.id,
            'name': skill.name,
            'category': skill.category,
            'proficiency': skill.proficiency
        })
    return jsonify(skill_categories)

@home_bp.route('/api/studies', methods=['GET'])
def studies():
    all_studies = Study.query.order_by(Study.start_date.desc()).all()
    study_groups = {'in_progress': [], 'completed': [], 'planned': []}
    for study in all_studies:
        study_data = {
            'id': study.id,
            'title': study.title,
            'description': study.description,
            'category': study.category,
            'source': study.source,
            'status': study.status,
            'progress': study.progress,
            'start_date': study.start_date.isoformat() if study.start_date else None,
            'completion_date': study.completion_date.isoformat() if study.completion_date else None,
            'github_url': study.github_url,
            'certificate_url': study.certificate_url,
            'notes': study.notes
        }
        if study.status == 'In Progress':
            study_groups['in_progress'].append(study_data)
        elif study.status == 'Completed':
            study_groups['completed'].append(study_data)
        elif study.status == 'Planned':
            study_groups['planned'].append(study_data)
    return jsonify(study_groups)

@home_bp.route('/api/study/<int:study_id>', methods=['GET'])
def study_detail(study_id):
    study = Study.query.get_or_404(study_id)
    study_data = {
        'id': study.id,
        'title': study.title,
        'description': study.description,
        'category': study.category,
        'source': study.source,
        'status': study.status,
        'progress': study.progress,
        'start_date': study.start_date.isoformat() if study.start_date else None,
        'completion_date': study.completion_date.isoformat() if study.completion_date else None,
        'github_url': study.github_url,
        'certificate_url': study.certificate_url,
        'notes': study.notes
    }
    return jsonify(study_data)
