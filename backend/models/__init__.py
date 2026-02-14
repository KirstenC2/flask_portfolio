from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
from .finance_models import DebtRecord, PaymentLog, Transaction
from .models import Project, Skill, Experience, Education, Study, Message, Admin, LifeEvent, Introduction, TaskDescription,ExperienceProject, Resume, DevFeature, DevTask
from .asset_models import MotorRecord, MotorTaxes
from .tools import Diary, Post
from .health_models import AlcoholLogs
from .template_models import ThinkingTemplate, TemplateStep, ThinkingProject, ProjectContent