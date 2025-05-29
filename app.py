import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash
from models import db, Project, Skill, Study

app = Flask(__name__)
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

@app.route('/')
def home():
    projects = Project.query.order_by(Project.date_created.desc()).limit(3).all()
    skills = Skill.query.all()
    
    # Group skills by category
    skill_categories = {}
    for skill in skills:
        if skill.category not in skill_categories:
            skill_categories[skill.category] = []
        skill_categories[skill.category].append(skill)
    
    return render_template('index.html', projects=projects, skill_categories=skill_categories)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/projects')
def projects():
    projects = Project.query.order_by(Project.date_created.desc()).all()
    return render_template('projects.html', projects=projects)

@app.route('/project/<int:project_id>')
def project(project_id):
    project = Project.query.get_or_404(project_id)
    return render_template('project_detail.html', project=project)

@app.route('/skills')
def skills():
    skills = Skill.query.all()
    
    # Group skills by category
    skill_categories = {}
    for skill in skills:
        if skill.category not in skill_categories:
            skill_categories[skill.category] = []
        skill_categories[skill.category].append(skill)
            
    return render_template('skills.html', skill_categories=skill_categories)

@app.route('/studies')
def studies():
    # Get all studies and group them by status
    all_studies = Study.query.order_by(Study.start_date.desc()).all()
    
    study_by_status = {
        'In Progress': [],
        'Completed': [],
        'Planned': []
    }
    
    for study in all_studies:
        if study.status in study_by_status:
            study_by_status[study.status].append(study)
        else:
            study_by_status['Planned'].append(study)  # Default to planned if status not recognized
    
    return render_template('studies.html', study_by_status=study_by_status, active_page='studies')

@app.route('/study/<int:study_id>')
def study_detail(study_id):
    study = Study.query.get_or_404(study_id)
    return render_template('study_detail.html', study=study)

@app.route('/contact')
def contact():
    return render_template('contact.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
