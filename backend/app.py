import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Project, Skill, Study

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///portfolio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with the app
db.init_app(app)

# Create the database tables
with app.app_context():
    db.create_all()
    
    # Add sample data if database is empty
    if Project.query.count() == 0:
        sample_projects = [
            Project(
                title='Flask Portfolio Website',
                description='A responsive portfolio website built with Flask and SQLite to showcase projects and skills.',
                technologies='Python, Flask, SQLAlchemy, HTML, CSS, Docker',
                image_url='portfolio_website.jpg',
                github_url='https://github.com/KirstenC2/flask_portfolio'
            ),
            Project(
                title='E-commerce Platform',
                description='A fully-featured e-commerce platform with user authentication, product catalog, and payment processing.',
                technologies='React, Node.js, Express, MongoDB',
                image_url='ecommerce.jpg',
                github_url='https://github.com/username/ecommerce'
            )
        ]
        
        sample_skills = [
            Skill(name='Python', category='Programming', proficiency=5),
            Skill(name='JavaScript', category='Programming', proficiency=4),
            Skill(name='Flask', category='Frameworks', proficiency=4),
            Skill(name='React', category='Frameworks', proficiency=3),
            Skill(name='Docker', category='DevOps', proficiency=4),
            Skill(name='UI/UX Design', category='Design', proficiency=3)
        ]
        
        sample_studies = [
            Study(
                title='Advanced Machine Learning',
                description='Deep dive into advanced machine learning algorithms including neural networks, deep learning, and reinforcement learning.',
                category='Course',
                source='Coursera - Stanford University',
                status='In Progress',
                progress=65,
                start_date=datetime.strptime('2025-01-15', '%Y-%m-%d'),
                github_url='https://github.com/KirstenC2/machine-learning-study'
            ),
            Study(
                title='Rust Programming',
                description='Learning Rust programming language for systems programming and high-performance applications.',
                category='Self-study',
                source='Rust Programming Book',
                status='In Progress',
                progress=40,
                start_date=datetime.strptime('2025-03-10', '%Y-%m-%d'),
                github_url='https://github.com/KirstenC2/rust-learning'
            ),
            Study(
                title='AWS Solutions Architect',
                description='Preparation for the AWS Solutions Architect certification, covering cloud architecture best practices.',
                category='Certification',
                source='Amazon Web Services',
                status='Planned',
                progress=0,
                start_date=datetime.strptime('2025-06-01', '%Y-%m-%d')
            ),
            Study(
                title='Full Stack Development with MERN',
                description='Comprehensive course on building full-stack applications with MongoDB, Express, React, and Node.js.',
                category='Course',
                source='Udemy',
                status='Completed',
                progress=100,
                start_date=datetime.strptime('2024-09-01', '%Y-%m-%d'),
                completion_date=datetime.strptime('2024-12-20', '%Y-%m-%d'),
                github_url='https://github.com/KirstenC2/mern-project',
                certificate_url='https://udemy.com/certificate/123456'
            )
        ]
        
        db.session.add_all(sample_projects)
        db.session.add_all(sample_skills)
        db.session.add_all(sample_studies)
        db.session.commit()

# API endpoints
@app.route('/api/home', methods=['GET'])
def home():
    # Get featured projects
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
    
    # Get top skills
    skills = Skill.query.order_by(Skill.proficiency.desc()).limit(6).all()
    top_skills = [{
        'id': skill.id,
        'name': skill.name,
        'category': skill.category,
        'proficiency': skill.proficiency
    } for skill in skills]
    
    return jsonify({
        'featured_projects': featured_projects,
        'top_skills': top_skills
    })

@app.route('/api/about', methods=['GET'])
def about():
    # You can return any about page content as JSON
    return jsonify({
        'name': 'Kirsten Choo',
        'title': 'Fullstack Developer',
        'bio': 'Passionate about creating elegant, user-friendly applications with clean code.',
        'education': 'University of Technology',
        'experience': '5+ years of development experience',
        'email': 'choovernjet@gmail.com'
    })

@app.route('/api/projects', methods=['GET'])
def projects():
    all_projects = Project.query.order_by(Project.date_created.desc()).all()
    projects_data = [{
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'technologies': project.technologies,
        'image_url': project.image_url,
        'github_url': project.github_url,
        'date_created': project.date_created.isoformat() if project.date_created else None
    } for project in all_projects]
    
    return jsonify(projects_data)

@app.route('/api/project/<int:project_id>', methods=['GET'])
def project(project_id):
    project = Project.query.get_or_404(project_id)
    project_data = {
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'technologies': project.technologies,
        'image_url': project.image_url,
        'github_url': project.github_url,
        'date_created': project.date_created.isoformat() if project.date_created else None
    }
    
    return jsonify(project_data)

@app.route('/api/skills', methods=['GET'])
def skills():
    all_skills = Skill.query.all()
    
    # Group skills by category
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

@app.route('/api/studies', methods=['GET'])
def studies():
    all_studies = Study.query.order_by(Study.start_date.desc()).all()
    
    # Group studies by status
    study_groups = {
        'in_progress': [],
        'completed': [],
        'planned': []
    }
    
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

@app.route('/api/study/<int:study_id>', methods=['GET'])
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

@app.route('/api/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        # Handle contact form submission
        contact_data = request.json
        # Here you would typically send an email or save to database
        # For now, we'll just return success
        return jsonify({'success': True, 'message': 'Message received! I will get back to you soon.'})
    
    # GET request - return contact information
    return jsonify({
        'email': 'choovernjet@gmail.com',
        'github': 'https://github.com/KirstenC2',
        'linkedin': 'https://linkedin.com/in/'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
