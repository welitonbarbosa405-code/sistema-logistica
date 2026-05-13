# Blueprint de lançamentos fiscais
from flask import Blueprint

lancamentos_bp = Blueprint('lancamentos', __name__)

from . import routes
