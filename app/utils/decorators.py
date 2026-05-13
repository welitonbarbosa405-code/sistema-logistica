from functools import wraps
from flask import redirect, url_for, flash
from flask_login import current_user

def admin_required(f):
    """Decorator que requer que o usuário seja admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Você precisa estar logado para acessar esta página.', 'error')
            return redirect(url_for('auth.login'))
        
        if current_user.role != 'admin':
            flash('Acesso negado. Apenas administradores podem acessar esta página.', 'error')
            return redirect(url_for('cidades.index'))
        
        return f(*args, **kwargs)
    return decorated_function
