from flask_cors import CORS
from models import Project,db
from flask import Blueprint, request, jsonify
import os
project_bp = Blueprint('project', __name__)
CORS(project_bp, 
     resources={"/api/projects/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"])
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', 'dev-secret-key-change-in-production')

@project_bp.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project_detail(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404
    
    return jsonify({
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "technologies": project.technologies,
        "image_url": project.image_url,
        "goals": project.goals,       # 確保資料庫有這欄位
        "features": project.features, # 確保資料庫有這欄位
        "project_type": project.project_type,
        "project_url": project.project_url,
        "github_url": project.github_url,
        "date_created": project.date_created.isoformat()
    })

@project_bp.route('/api/admin/projects', methods=['GET'])
def get_admin_projects():
    project_type = request.args.get('type')
    if project_type:
        projects = Project.query.filter_by(project_type=project_type).all()
    else:
        projects = Project.query.all()
    
    return jsonify([{
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "technologies": project.technologies,
        "image_url": project.image_url,
        "goals": project.goals,
        "features": project.features,
        "project_type": project.project_type,
        "project_url": project.project_url,
        "github_url": project.github_url,
        "date_created": project.date_created.isoformat()
    } for project in projects])

