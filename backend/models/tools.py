
from datetime import datetime
from . import db

class Diary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    weather = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=True)
    emotion = db.Column(db.String(20), nullable=True)
    image_url = db.Column(db.String(200), nullable=True)
    def __repr__(self):
        return f"Diary('{self.date}', '{self.weather}', '{self.content}','{self.image_url})"
        
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    content_md = db.Column(db.Text, nullable=False)
    content_html = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(250), nullable=True)  # comma-separated
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"Post('{self.slug}', '{self.title}')"