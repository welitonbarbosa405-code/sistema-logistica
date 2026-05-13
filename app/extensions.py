from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_wtf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman

db = SQLAlchemy()
login_manager = LoginManager()
bcrypt = Bcrypt()
csrf = CSRFProtect()
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
talisman = Talisman()

# Where to redirect for login
login_manager.login_view = "auth.login"
login_manager.login_message_category = "warning"