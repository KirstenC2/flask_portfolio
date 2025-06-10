import os
from flask import Flask
from flask_cors import CORS
from models import db, Project, Skill, Study, Experience, Education, Message, Admin
from routers.home import home_bp
from routers.contact import contact_bp
from routers.admin import admin_bp
from datetime import datetime
from seed_data import seed_sample_data
from dotenv import load_dotenv

# 載入 .env 檔案
load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///portfolio.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)



with app.app_context():
    db.create_all()
    seed_sample_data()

# 註冊 blueprint
app.register_blueprint(home_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(admin_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
