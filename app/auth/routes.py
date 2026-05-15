from datetime import datetime, timedelta
from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from . import auth_bp
from .forms import LoginForm, RegisterForm
from app.extensions import db
from app.models import User

# configurações de bloqueio
LOCK_WINDOW = timedelta(minutes=15)
MAX_FAILS = 5

@auth_bp.route("/login", methods=["GET", "POST"])
#@limiter.limit("10/minute")
def login():
    if current_user.is_authenticated:
        return redirect(url_for("cidades.index"))

    form = LoginForm()
    template_params = {
        "form": form,
        "body_class": "page-login",
        "disable_nav": True,
        "disable_footer": True,
        "full_width": True,
        "suppress_flashed_messages": True,
    }
    if form.validate_on_submit():
        email = form.email.data.lower().strip()
        user = User.query.filter_by(email=email).first()
        now = datetime.utcnow()

        # usuário bloqueado?
        if user and user.lock_until and user.lock_until > now:
            restante = int((user.lock_until - now).total_seconds() // 60) + 1
            flash(f"Conta bloqueada por tentativas inválidas. Tente novamente em ~{restante} min.", "danger")
            return render_template("login.html", **template_params)

        if user and user.check_password(form.password.data) and user.is_active:
            user.failed_attempts = 0
            user.lock_until = None
            db.session.commit()
            login_user(user)
            next_page = request.args.get("next")
            return redirect(next_page or url_for("cidades.index"))
        else:
            if user:
                user.failed_attempts = (user.failed_attempts or 0) + 1
                if user.failed_attempts >= MAX_FAILS:
                    user.lock_until = now + LOCK_WINDOW
                    user.failed_attempts = 0
                db.session.commit()
            flash("Credenciais inválidas.", "danger")

    return render_template("login.html", **template_params)

@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Você saiu da sessão.", "info")
    return redirect(url_for("auth.login"))

@auth_bp.route("/register", methods=["GET", "POST"])
@login_required
def register():
    # só admin pode criar usuários via UI
    if current_user.role != "admin":
        flash("Apenas administradores podem criar usuários.", "warning")
        return redirect(url_for("cidades.index"))

    form = RegisterForm()
    if form.validate_on_submit():
        email = form.email.data.lower().strip()
        if User.query.filter_by(email=email).first():
            flash("E-mail já cadastrado.", "warning")
            users = User.query.all()
            return render_template("usuarios_portaria.html", form=form, users=users)
        
        # Obter role do formulário (padrão: user)
        role = request.form.get("role", "user")
        u = User(email=email, role=role)
        u.set_password(form.password.data)
        db.session.add(u)
        db.session.commit()
        flash("Usuário criado com sucesso!", "success")
        return redirect(url_for("auth.register"))
      # Listar todos os usuários
    users = User.query.all()
    return render_template("usuarios_portaria.html", form=form, users=users)


@auth_bp.route("/usuario/<int:id>", methods=["GET"])
@login_required
def get_usuario(id):
    """Obter dados de um usuário para edição"""
    if current_user.role != "admin":
        return jsonify({"error": "Acesso negado"}), 403
    
    user = User.query.get_or_404(id)
    return jsonify({
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    })


@auth_bp.route("/usuario/<int:id>/editar", methods=["POST"])
@login_required
def editar_usuario(id):
    """Editar um usuário existente"""
    if current_user.role != "admin":
        return jsonify({"error": "Acesso negado"}), 403
    
    user = User.query.get_or_404(id)
    
    # Não permitir editar o próprio usuário se for o único admin
    if user.id == current_user.id:
        admin_count = User.query.filter_by(role="admin").count()
        if admin_count <= 1:
            return jsonify({"error": "Não é possível editar o único administrador do sistema"}), 400
    
    data = request.get_json() if request.is_json else request.form
    
    # Atualizar email
    new_email = data.get("email", "").lower().strip()
    if new_email and new_email != user.email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({"error": "Este e-mail já está em uso"}), 400
        user.email = new_email
    
    # Atualizar role
    new_role = data.get("role", user.role)
    if new_role in ["admin", "user"]:
        user.role = new_role
    
    # Atualizar senha (se fornecida)
    new_password = data.get("password", "")
    if new_password:
        user.set_password(new_password)
    
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Usuário {user.email} atualizado com sucesso!"
    })


@auth_bp.route("/usuario/<int:id>/excluir", methods=["DELETE", "POST"])
@login_required
def excluir_usuario(id):
    """Excluir um usuário"""
    if current_user.role != "admin":
        return jsonify({"error": "Acesso negado"}), 403
    
    user = User.query.get_or_404(id)
    
    # Não permitir excluir o próprio usuário
    if user.id == current_user.id:
        return jsonify({"error": "Você não pode excluir sua própria conta"}), 400
    
    # Não permitir excluir o último admin
    if user.role == "admin":
        admin_count = User.query.filter_by(role="admin").count()
        if admin_count <= 1:
            return jsonify({"error": "Não é possível excluir o único administrador do sistema"}), 400
    
    email = user.email
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Usuário {email} excluído com sucesso!"
    })