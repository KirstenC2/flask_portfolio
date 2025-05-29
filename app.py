import os
from flask import Flask, render_template, request, redirect, url_for, flash
from models import db, Project, Skill

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
        
        db.session.add_all(sample_projects)
        db.session.add_all(sample_skills)
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

@app.route('/contact')
def contact():
    return render_template('contact.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
