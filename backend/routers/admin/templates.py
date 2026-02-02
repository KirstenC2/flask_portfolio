from flask import request, jsonify
from models.template_models import ThinkingTemplate, TemplateStep, ThinkingProject, ProjectContent, db
from . import token_required, admin_bp
from datetime import datetime

# --- 模板 CRUD ---

@admin_bp.route('/templates', methods=['GET'])
@token_required
def get_templates(current_admin):
    templates = ThinkingTemplate.query.all()
    return jsonify([{
        "id": t.id,
        "name": t.name,
        "category": t.category,
        "steps": [{
            "id": s.id,
            "order": s.order,
            "title": s.title,
            "prompt": s.prompt,
            "placeholder": s.placeholder
        } for s in sorted(t.default_steps, key=lambda x: x.order)]
    } for t in templates])

@admin_bp.route('/templates', methods=['POST'])
@token_required
def create_template(current_admin):
    data = request.json
    new_template = ThinkingTemplate(name=data['name'], category=data.get('category'))
    db.session.add(new_template)
    db.session.flush() # 取得 template.id

    # 批次建立步驟
    for idx, step in enumerate(data.get('steps', [])):
        new_step = TemplateStep(
            template_id=new_template.id,
            order=idx + 1,
            title=step['title'],
            prompt=step.get('prompt'),
            placeholder=step.get('placeholder')
        )
        db.session.add(new_step)
    
    db.session.commit()
    return jsonify({"message": "Template created", "id": new_template.id}), 201

@admin_bp.route('/templates/<int:id>', methods=['DELETE'])
@token_required
def delete_template(current_admin, id):
    template = ThinkingTemplate.query.get_or_404(id)
    db.session.delete(template)
    db.session.commit()
    return jsonify({"message": "Template deleted"})

    # --- 分析專案 CRUD ---

@admin_bp.route('/thinking-projects', methods=['POST'])
@token_required
def create_thinking_project(current_admin):
    data = request.json # 期待包含 template_id, title
    
    if not data.get('ref_id'):
        return jsonify({"error": "必須關聯一個專案"}), 400

    new_project = ThinkingProject(
        template_id=data['template_id'],
        title=data['title'],
        ref_id=data['ref_id'],
        ref_type='project'
    )
    db.session.add(new_project)
    db.session.flush()

    # 2. 根據模板步驟自動初始化空白內容 (初始化策略)
    template_steps = TemplateStep.query.filter_by(template_id=data['template_id']).all()
    for step in template_steps:
        content = ProjectContent(
            project_id=new_project.id,
            step_id=step.id,
            content="" # 初始為空字串
        )
        db.session.add(content)
    
    db.session.commit()
    return jsonify({"message": "Project initialized", "id": new_project.id}), 201

@admin_bp.route('/thinking-projects/<int:id>', methods=['GET'])
@token_required
def get_project_detail(current_admin, id):
    project = ThinkingProject.query.get_or_404(id)
    template = ThinkingTemplate.query.get(project.template_id)
    
    # 將內容與模板的步驟描述合併回傳，方便前端渲染
    contents = {c.step_id: c.content for c in project.step_contents}
    steps_data = []
    for s in sorted(template.default_steps, key=lambda x: x.order):
        steps_data.append({
            "step_id": s.id,
            "title": s.title,
            "prompt": s.prompt,
            "placeholder": s.placeholder,
            "content": contents.get(s.id, "")
        })

    return jsonify({
        "id": project.id,
        "title": project.title,
        "template_name": template.name,
        "created_at": project.created_at.isoformat(),
        "steps": steps_data
    })
    
@admin_bp.route('/thinking-projects/<int:id>', methods=['PUT'])
@token_required
def update_project_content(current_admin, id):
    data = request.json  # 前端傳來的格式: {"contents": [{"step_id": 1, "content": "..."}, ...]}
    
    for item in data.get('contents', []):
        # 關鍵修正：這裡必須使用 step_id 來 filter
        content_record = ProjectContent.query.filter_by(
            project_id=id, 
            step_id=item['step_id'] 
        ).first()
        
        if content_record:
            content_record.content = item['content']
            # print(f"Updating step {item['step_id']} with content") # 調試用
            
    db.session.commit()
    return jsonify({"message": "Progress saved"})

@admin_bp.route('/thinking-projects/<int:id>', methods=['DELETE','OPTIONS'])
@token_required
def delete_thinking_project(current_admin, id):
    project = ThinkingProject.query.get_or_404(id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"})