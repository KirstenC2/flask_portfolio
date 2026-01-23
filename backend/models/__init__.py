from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
from .finance_models import DebtRecord, PaymentLog
from .models import Project, Skill, Experience, Education, Study, Message, Admin, LifeEvent, Introduction, TaskDescription,ExperienceProject, Resume
from .asset_models import MotorRecord
from .tools import Diary, Post