from flask import Blueprint

indicadores_bp = Blueprint('indicadores', __name__, url_prefix='/indicadores')

from . import routes
