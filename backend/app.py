import os
from flask import Flask
from flask_cors import CORS
from models import db, Project, Skill, Study, Experience, Education, Message, Admin
from routers.home import home_bp
from routers.contact import contact_bp
from routers.admin import admin_bp
from routers.blog import blog_bp
from routers.diary import diary_bp
from routers.minio import minio_bp
from routers.resume import resume_bp
from routers.projects import project_bp
from routers.health import health_bp
from datetime import datetime
from seed_data import seed_sample_data
from dotenv import load_dotenv
# 載入 .env 檔案
load_dotenv()

app = Flask(__name__)
# Explicit CORS config to support Authorization header from React dev server
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1"
    ]}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type"],
    supports_credentials=True,
)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///portfolio.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()
    seed_sample_data()

# 註冊 blueprint
app.register_blueprint(home_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(blog_bp)
app.register_blueprint(diary_bp)
app.register_blueprint(minio_bp)
app.register_blueprint(resume_bp)
app.register_blueprint(project_bp)
app.register_blueprint(health_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
