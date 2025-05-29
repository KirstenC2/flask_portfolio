from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

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
