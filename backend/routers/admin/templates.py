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

@admin_bp.route('/thinking/templates', methods=['GET'])
def get_report_templates():
    templates = ThinkingTemplate.query.all()
    return jsonify([{'id': t.id, 'name': t.name, 'category': t.category} for t in templates])

@admin_bp.route('/thinking/templates/<int:tid>', methods=['GET'])
def get_report_template_detail(tid):
    template = ThinkingTemplate.query.get_or_404(tid)
    steps = sorted(template.default_steps, key=lambda x: x.order)
    return jsonify({
        'id': template.id,
        'name': template.name,
        'steps': [{
            'id': s.id,
            'title': s.title,
            'prompt': s.prompt,
            'placeholder': s.placeholder,
            'order': s.order
        } for s in steps]
    })

@admin_bp.route('/thinking/projects', methods=['POST'])
@token_required
def create_report(current_admin):
    data = request.get_json()
    
    # 建立專案主表
    new_project = ThinkingProject(
        template_id=data['template_id'],
        title=data['title'],
        ref_type=data.get('ref_type'),
        ref_id=data.get('ref_id')
    )
    db.session.add(new_project)
    db.session.flush() # 取得新專案 ID

    # 儲存每一格的內容
    for step_id, content in data['contents'].items():
        new_content = ProjectContent(
            project_id=new_project.id,
            step_id=int(step_id),
            content=content
        )
        db.session.add(new_content)
    
    db.session.commit()
    return jsonify({'message': 'Report saved successfully!', 'id': new_project.id})

@admin_bp.route('/thinking/weekly-reports', methods=['GET'])
@token_required
def get_weekly_reports(current_admin):
    # 1. 篩選 ref_type 為 weekly_report
    # 2. 按照建立時間倒序排列（最新的在最上面）
    reports = ThinkingProject.query.filter_by(ref_type='weekly_report')\
                .order_by(ThinkingProject.created_at.desc()).all()
    
    result = []
    for r in reports:
        # 取得關聯模板的資訊
        template = ThinkingTemplate.query.get(r.template_id)
        
        result.append({
            'id': r.id,
            'title': r.title,
            'template_name': template.name if template else "未知模板",
            'category': template.category if template else "N/A",
            'ref_tag': r.ref_tag, # 儲存日期的欄位
            'created_at': r.created_at.isoformat(),
            'step_count': len(r.step_contents)
        })
    
    return jsonify(result)

@admin_bp.route('/thinking/projects/<int:pid>', methods=['GET'])
@token_required
def get_report_detail(current_admin, pid):
    project = ThinkingProject.query.get_or_404(pid)
    template = ThinkingTemplate.query.get(project.template_id)
    
    # 取得所有內容，並關聯對應的步驟標題
    contents = []
    for content in project.step_contents:
        step = TemplateStep.query.get(content.step_id)
        contents.append({
            'title': step.title if step else "未知步驟",
            'content': content.content,
            'order': step.order if step else 0
        })
    
    # 按順序排列
    contents.sort(key=lambda x: x['order'])
    
    return jsonify({
        'title': project.title,
        'template_name': template.name if template else "未知模板",
        'created_at': project.created_at.isoformat(),
        'ref_tag': project.ref_tag,
        'contents': contents
    })