from flask import Blueprint

feiras_bp = Blueprint('feiras', __name__, url_prefix='/feiras')

from . import routes
