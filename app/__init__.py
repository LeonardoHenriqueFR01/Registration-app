from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')

    db.init_app(app)
    login_manager.init_app(app)

    CORS(app)

    from .routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app
