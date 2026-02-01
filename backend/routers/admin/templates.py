from flask import request, jsonify
from models.template_models import ThinkingTemplate, TemplateStep, db
from . import token_required,admin_bp

# 1. 獲取所有模板 (清單模式)
@admin_bp.route('/templates', methods=['GET'])
@token_required
def get_templates(current_admin):
    templates = ThinkingTemplate.query.all()
    # 這裡回傳包含步驟細節的字典
    return jsonify([{
        "id": t.id,
        "name": t.name,
        "category": t.category,
        "steps": [{
            "order": s.order,
            "title": s.title,
            "prompt": s.prompt,
            "placeholder": s.placeholder
        } for s in sorted(t.default_steps, key=lambda x: x.order)]
    } for t in templates])

# 2. 儲存或更新模板 (核心 CRUD)
@admin_bp.route('/templates/save', methods=['POST'])
@token_required
def save_template(current_admin):
    data = request.json
    template_id = data.get('id')
    
    try:
        if template_id:
            # 更新模式
            template = ThinkingTemplate.query.get(template_id)
            template.name = data.get('name')
            template.category = data.get('category')
            # 刪除舊步驟，準備重新寫入 (最保險的同步方式)
            TemplateStep.query.filter_by(template_id=template.id).delete()
        else:
            # 新增模式
            template = ThinkingTemplate(
                name=data.get('name'),
                category=data.get('category')
            )
            db.session.add(template)
            db.session.flush() # 取得 template.id

        # 寫入步驟
        for i, step_data in enumerate(data.get('steps', [])):
            new_step = TemplateStep(
                template_id=template.id,
                order=i + 1,
                title=step_data.get('title'),
                prompt=step_data.get('prompt'),
                placeholder=step_data.get('placeholder')
            )
            db.session.add(new_step)

        db.session.commit()
        return jsonify({"success": True, "message": "模板已優雅地存檔"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

# 3. 刪除模板
@admin_bp.route('/templates/<int:tid>', methods=['DELETE'])
@token_required
def delete_template(current_admin, tid):
    template = ThinkingTemplate.query.get_or_404(tid)
    try:
        db.session.delete(template)
        db.session.commit()
        return jsonify({"success": True, "message": "模板已移除"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500