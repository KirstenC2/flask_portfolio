import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Project, Skill, Study, Experience, Education

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
# Use a relative path that will work better with Docker
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///portfolio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with the app
db.init_app(app)

# Create the database tables
with app.app_context():
    db.create_all()
    
    # Add sample data if respective tables are empty
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
            # Programming Languages
            Skill(name='Python', category='Programming', proficiency=5),
            Skill(name='JavaScript', category='Programming', proficiency=4),
            Skill(name='TypeScript', category='Programming', proficiency=4),
            Skill(name='SQL', category='Programming', proficiency=4),
            Skill(name='HTML/CSS', category='Programming', proficiency=5),
            Skill(name='Java', category='Programming', proficiency=3),
            Skill(name='C#', category='Programming', proficiency=3),
            
            # Frameworks & Libraries
            Skill(name='Flask', category='Frameworks', proficiency=4),
            Skill(name='React', category='Frameworks', proficiency=4),
            Skill(name='Node.js', category='Frameworks', proficiency=3),
            Skill(name='Express', category='Frameworks', proficiency=3),
            Skill(name='Django', category='Frameworks', proficiency=3),
            Skill(name='Bootstrap', category='Frameworks', proficiency=5),
            Skill(name='Redux', category='Frameworks', proficiency=3),
            
            # DevOps & Tools
            Skill(name='Docker', category='DevOps', proficiency=4),
            Skill(name='Git', category='DevOps', proficiency=5),
            Skill(name='CI/CD', category='DevOps', proficiency=3),
            Skill(name='AWS', category='DevOps', proficiency=3),
            Skill(name='Jira', category='DevOps', proficiency=4),
            
            # Databases
            Skill(name='SQLite', category='Databases', proficiency=4),
            Skill(name='PostgreSQL', category='Databases', proficiency=3),
            Skill(name='MongoDB', category='Databases', proficiency=3),
            
        ]
        
        sample_studies = [
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
                status='Completed',
                progress=100,
                start_date=datetime.strptime('2024-09-01', '%Y-%m-%d'),
                completion_date=datetime.strptime('2024-12-20', '%Y-%m-%d'),
                github_url='https://github.com/KirstenC2/mern-project'
            )
        ]
        
        db.session.add_all(sample_projects)
        db.session.commit()
        
    # Add sample skills if skills table is empty
    if Skill.query.count() == 0:
        db.session.add_all(sample_skills)
        db.session.commit()
        
    # Add sample studies if studies table is empty
    if Study.query.count() == 0:
        db.session.add_all(sample_studies)
        db.session.commit()
        
    # Add sample experiences if experiences table is empty
    if Experience.query.count() == 0:
        sample_experiences = [
            Experience(
                title="Senior Full Stack Developer",
                company="Tech Innovations Inc.",
                description="Leading development of enterprise web applications using React, Node.js, and MongoDB. Implementing CI/CD pipelines and mentoring junior developers.",
                start_date=datetime(2023, 1, 1),
                end_date=None,
                is_current=True,
                order=4
            ),
            Experience(
                title="Full Stack Developer",
                company="Digital Solutions Ltd.",
                description="Developed responsive web applications with React and Express. Implemented RESTful APIs and worked with SQL and NoSQL databases.",
                start_date=datetime(2020, 3, 1),
                end_date=datetime(2022, 12, 31),
                is_current=False,
                order=3
            ),
            Experience(
                title="Frontend Developer",
                company="Web Creators Studio",
                description="Created responsive user interfaces using HTML, CSS, JavaScript, and React. Collaborated with designers to implement pixel-perfect UIs.",
                start_date=datetime(2018, 5, 1),
                end_date=datetime(2020, 2, 28),
                is_current=False,
                order=2
            ),
            Experience(
                title="Web Development Intern",
                company="Startup Incubator",
                description="Assisted in development of web applications. Learned modern JavaScript frameworks and best practices in web development.",
                start_date=datetime(2017, 6, 1),
                end_date=datetime(2018, 4, 30),
                is_current=False,
                order=1
            )
        ]
        
        db.session.add_all(sample_experiences)
        db.session.commit()
        
    # Add sample education if education table is empty
    if Education.query.count() == 0:
        sample_education = [
            Education(
                degree="Bachelor of Science in Computer Science",
                school="University of Technology",
                description="Focused on software engineering, web development, and database systems. Graduated with honors.",
                start_date=datetime(2014, 9, 1),
                end_date=datetime(2018, 5, 31),
                is_current=False,
                order=1
            ),
            Education(
                degree="Full Stack Web Development Certification",
                school="Tech Academy",
                description="Intensive program covering modern JavaScript frameworks, backend development, and deployment technologies.",
                start_date=datetime(2020, 1, 15),
                end_date=datetime(2020, 4, 15),
                is_current=False,
                order=2
            )
        ]
        
        db.session.add_all(sample_education)
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
    # Basic about information
    about_info = {
        'name': 'Kirsten Choo',
        'title': 'Fullstack Developer',
        'bio': 'Passionate about creating elegant, user-friendly applications with clean code.',
        'email': 'choovernjet@gmail.com'
    }
    
    # Get experiences in descending order (most recent first)
    experiences = Experience.query.order_by(Experience.order.desc()).all()
    experience_data = [{
        'id': exp.id,
        'title': exp.title,
        'company': exp.company,
        'description': exp.description,
        'start_date': exp.start_date.isoformat() if exp.start_date else None,
        'end_date': exp.end_date.isoformat() if exp.end_date else None,
        'is_current': exp.is_current,
        'year': format_date_range(exp.start_date, exp.end_date, exp.is_current)
    } for exp in experiences]
    
    # Get education in descending order (most recent first)
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
    
    # Combine all data
    return jsonify({
        **about_info,
        'experiences': experience_data,
        'education': education_data
    })

# Helper function for formatting date ranges
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
