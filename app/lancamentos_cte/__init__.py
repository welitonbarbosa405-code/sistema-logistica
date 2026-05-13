from flask import Blueprint

lancamentos_cte_bp = Blueprint(
    'lancamentos_cte',
    __name__,
    url_prefix='/lancamentos-cte',
    template_folder='templates'
)

from . import routes
