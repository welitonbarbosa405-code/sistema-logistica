from flask import Blueprint

divergencias_bp = Blueprint('divergencias', __name__, url_prefix='/divergencias')

from . import routes
