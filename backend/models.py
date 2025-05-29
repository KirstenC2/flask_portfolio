from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    technologies = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(200), nullable=True)
    project_url = db.Column(db.String(200), nullable=True)
    github_url = db.Column(db.String(200), nullable=True)
    date_created = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f"Project('{self.title}', '{self.technologies}')"

class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # e.g., 'Programming', 'Design', 'Soft Skills'
    proficiency = db.Column(db.Integer, nullable=False)  # 1-5 scale
    
    def __repr__(self):
        return f"Skill('{self.name}', '{self.category}', {self.proficiency})"
        
class Study(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # e.g., 'Course', 'Book', 'Project', 'Certification'
    source = db.Column(db.String(100), nullable=True)  # e.g., 'Coursera', 'Udemy', 'Book Title'
    status = db.Column(db.String(20), nullable=False)  # e.g., 'In Progress', 'Completed', 'Planned'
    progress = db.Column(db.Integer, nullable=True)  # Percentage of completion (0-100)
    start_date = db.Column(db.DateTime, nullable=True)
    completion_date = db.Column(db.DateTime, nullable=True)
    github_url = db.Column(db.String(200), nullable=True)  # Link to GitHub repo if applicable
    certificate_url = db.Column(db.String(200), nullable=True)  # Link to certificate if applicable
    notes = db.Column(db.Text, nullable=True)  # Additional notes or key learnings
    
    def __repr__(self):
        return f"Study('{self.title}', '{self.category}', '{self.status}')"

class Experience(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)  # Job title
    company = db.Column(db.String(100), nullable=False)  # Company name
    description = db.Column(db.Text, nullable=False)  # Job description
    start_date = db.Column(db.DateTime, nullable=False)  # Start date
    end_date = db.Column(db.DateTime, nullable=True)  # End date (null if current job)
    is_current = db.Column(db.Boolean, default=False)  # Whether this is the current job
    order = db.Column(db.Integer, default=0)  # Order for display (higher = more recent)
    
    def __repr__(self):
        return f"Experience('{self.title}', '{self.company}')"

class Education(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    degree = db.Column(db.String(100), nullable=False)  # Degree/certification name
    school = db.Column(db.String(100), nullable=False)  # Institution name
    description = db.Column(db.Text, nullable=True)  # Description of studies
    start_date = db.Column(db.DateTime, nullable=False)  # Start date
    end_date = db.Column(db.DateTime, nullable=True)  # End date
    is_current = db.Column(db.Boolean, default=False)  # Whether currently studying
    order = db.Column(db.Integer, default=0)  # Order for display (higher = more recent)
    
    def __repr__(self):
        return f"Education('{self.degree}', '{self.school}')"

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)  # Whether message has been read
    date_received = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f"Message('{self.name}', '{self.subject[:20]}...', {self.read})"

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f"Admin('{self.username}', '{self.email}')"
        
