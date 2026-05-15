from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_wtf import CSRFProtect

# ❌ removido limiter e talisman (temporário)

db = SQLAlchemy()
login_manager = LoginManager()
bcrypt = Bcrypt()
csrf = CSRFProtect()

# login
login_manager.login_view = "auth.login"
login_manager.login_message_category = "warning"