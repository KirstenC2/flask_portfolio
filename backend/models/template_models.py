from datetime import datetime
from . import db

# 1. 模板定義：決定這是一個什麼樣的方法論
class ThinkingTemplate(db.Model):
    __tablename__ = 'thinking_templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False) # 例如: "McKinsey 7-Step", "SWOT", "PDCA"
    category = db.Column(db.String(50))              # 例如: "Business", "Health", "Personal"
    
    # 關聯該模板預設的步驟
    default_steps = db.relationship('TemplateStep', backref='template', cascade="all, delete-orphan")

# 2. 步驟定義：定義模板裡每一格的標題與引導語
class TemplateStep(db.Model):
    __tablename__ = 'template_steps'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('thinking_templates.id'))
    order = db.Column(db.Integer, nullable=False)    # 順序
    title = db.Column(db.String(100))                # 步驟名稱: "定義問題"
    prompt = db.Column(db.Text)                      # 引導語: "請使用SMART原則..."
    placeholder = db.Column(db.Text)                 # 輸入框提示

# 3. 分析專案：使用者真正開始寫的東西
class ThinkingProject(db.Model):
    __tablename__ = 'thinking_projects'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('thinking_templates.id'))
    title = db.Column(db.String(255), nullable=False) # 使用者自訂專案標題
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 實際填寫的內容
    step_contents = db.relationship('ProjectContent', backref='project', cascade="all, delete-orphan")

# 4. 內容儲存：每一格填寫的文字
class ProjectContent(db.Model):
    __tablename__ = 'project_contents'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('thinking_projects.id'))
    step_order = db.Column(db.Integer) # 對應 TemplateStep 的 order
    content = db.Column(db.Text)       # 使用者寫的答案