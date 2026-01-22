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
    goals = db.Column(db.Text)    # 新增
    features = db.Column(db.Text) # 新增
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
    description = db.Column(db.Text, nullable=True)
    def __repr__(self):
        return f"Skill('{self.name}', '{self.category}', {self.proficiency}, '{self.description}')"
        
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
    leaving_reason = db.Column(db.Text, nullable=True)  # Reason for leaving (if applicable)
    # Relationship to projects completed during this experience
    projects = db.relationship('ExperienceProject', backref='experience', lazy=True, cascade='all, delete-orphan')
    tasks = db.relationship('TaskDescription', backref='experience', cascade='all, delete-orphan')
    def __repr__(self):
        return f"Experience('{self.title}', '{self.company}')"

class TaskDescription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    experience_id = db.Column(db.Integer, db.ForeignKey('experience.id'), nullable=False)
    
    # 例如: 'Backend', 'DevOps', 'Management'
    category = db.Column(db.String(50), nullable=False) 
    
    # 例如: 'Standard', 'Brief', 'Detailed'
    version_name = db.Column(db.String(50), nullable=False) 
    
    # 實際的描述內容
    content = db.Column(db.Text, nullable=False)
    
    # 標記這個面向下的這個版本是否為「目前選用」
    is_active = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"[{self.category}] {self.version_name}"

# Per-experience projects
class ExperienceProject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    experience_id = db.Column(db.Integer, db.ForeignKey('experience.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    technologies = db.Column(db.String(200), nullable=True)
    project_url = db.Column(db.String(200), nullable=True)
    github_url = db.Column(db.String(200), nullable=True)

    def __repr__(self):
        return f"ExperienceProject('{self.title}', exp_id={self.experience_id})"

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

class Diary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    weather = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=True)
    emotion = db.Column(db.String(20), nullable=True)
    image_url = db.Column(db.String(200), nullable=True)
    def __repr__(self):
        return f"Diary('{self.date}', '{self.weather}', '{self.content}','{self.image_url})"
        

# Personal life story events (non-work experience)
class LifeEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    is_current = db.Column(db.Boolean, default=False)
    order = db.Column(db.Integer, default=0)  # For manual ordering if needed

    def __repr__(self):
        return f"LifeEvent('{self.title}', current={self.is_current})"

class Introduction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    languages_code = db.Column(db.Text, nullable=True)       # JSON string for languages list (e.g., ["ko","zh","en"])
    bio = db.Column(db.Text, nullable=True)  # JSON string for PM/TPM passages per language { ko: {topic: text}, zh: {...}, en: {...} }
    skill_passages = db.Column(db.Text, nullable=True)  # JSON string for PM/TPM passages per language { ko: {topic: text}, zh: {...}, en: {...} }
    role = db.Column(db.Text, nullable=True)  # JSON string for PM/TPM passages per language { ko: {topic: text}, zh: {...}, en: {...} }

    def __repr__(self):
        return f"Introduction()"

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

class Resume(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False) # 例如: "Software Engineer v1"
    file_name = db.Column(db.String(255), nullable=False) # 存儲在 MinIO 的 unique_filename
    is_active = db.Column(db.Boolean, default=False) # 是否為當前網站下載使用的版本
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class DebtRecord(db.Model):
    __tablename__ = 'debt_records'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)  # 標題，例如 "跟小明借的午餐費"
    total_amount = db.Column(db.Numeric(15, 2), nullable=False)  # 原始總金額
    
    # 時間戳記
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 反向關聯：透過 debt_record.payments 即可取得所有還款紀錄
    # backref 會自動在 PaymentLog 增加一個 .debt 屬性
    payments = db.relationship('PaymentLog', backref='debt', lazy=True, cascade="all, delete-orphan")

    @property
    def current_balance(self):
        """計算目前剩餘應還金額"""
        paid_total = sum(p.amount for p in self.payments)
        return self.total_amount - Decimal(str(paid_total))

    @property
    def is_fully_paid(self):
        """是否已還清"""
        return self.current_balance <= 0

    def __repr__(self):
        return f'<Debt {self.title}: {self.current_balance}/{self.total_amount}>'


# ----------------------------------------------------------------
# 2. 還款明細表：紀錄每次還錢的日期、金額
# ----------------------------------------------------------------
class PaymentLog(db.Model):
    __tablename__ = 'payment_logs'

    id = db.Column(db.Integer, primary_key=True)
    debt_id = db.Column(db.Integer, db.ForeignKey('debt_records.id'), nullable=False)
    
    # 核心紀錄：還了多少錢、什麼時候還的
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    payment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # 使用者可以自定義日期
    
    # 備註（例如：轉帳單號、現金交付等）
    note = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Payment {self.payment_date}: {self.amount}>'


class MotorRecord(db.Model):
    __tablename__ = 'motor_records'
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(50), default="換機油") # 預設機油，也可記輪胎等
    mileage = db.Column(db.Integer, nullable=False)        # 里程數
    price = db.Column(db.Integer, nullable=False)          # 價格
    maintenance_date = db.Column(db.Date, nullable=False)  # 維修日期
    note = db.Column(db.String(200))                       # 備註（機油品牌等）
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    def to_dict(self):
        return {
            "id": self.id,
            "item_name": self.item_name,
            "mileage": self.mileage,
            "price": self.price,
            "maintenance_date": self.maintenance_date.isoformat(),
            "note": self.note
        }