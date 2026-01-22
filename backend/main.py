import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

# Import extensions and models
from models import db, Project, Skill, Study, Experience, Education, Message, Admin
from seed_data import seed_sample_data

# Import Blueprints (Ensure these files exist in your 'routers' folder)
from routers.home import home_bp
from routers.contact import contact_bp
from routers.admin import admin_bp
from routers.blog import blog_bp
from routers.diary import diary_bp
from routers.minio import minio_bp
from routers.resume import resume_bp
from routers.projects import project_bp
from routers.health import health_bp

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# --- Configuration ---
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')

# Database Config: Use 'SQLALCHEMY_DATABASE_URI' from env (Postgres) or fallback to SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///portfolio.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- CORS Configuration ---
# Explicitly allow requests from your React Frontend (Localhost & Production URLs)
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1",
        # Add your Koyeb frontend URL here for production, e.g.:
        # "https://your-portfolio-frontend.koyeb.app"
    ]}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type"],
    supports_credentials=True,
)

# --- Initialize Extensions ---
db.init_app(app)

# --- Database Setup & Seeding ---
with app.app_context():
    # Create tables if they don't exist
    db.create_all()
    # Seed initial data (projects, skills, etc.)
    seed_sample_data()

# --- Register Blueprints ---
# This separates your routes into modular files in the 'routers/' folder
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
    # Run the server (Port 5001 matches your Docker/Koyeb config)
    app.run(host='0.0.0.0', port=5001, debug=True)