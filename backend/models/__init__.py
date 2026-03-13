from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
from .finance_models import DebtRecord, PaymentLog, Transaction, Income, IncomeSource, RecurringExpense
from .saving_models import SavingGoal, GoalPlan
from .models import Project, Skill, Experience, Education, Study, Message, Admin, LifeEvent, Introduction, TaskDescription,ExperienceProject, Resume, DevFeature, DevTask, TechMeetingMinute
from .asset_models import MotorRecord, MotorTaxes
from .tools import Diary, Post
from .health_models import AlcoholLogs
from .template_models import ThinkingTemplate, TemplateStep, ThinkingProject, ProjectContent
from .quotation_models import PublicQuotation, PublicQuotationItem, StandardService