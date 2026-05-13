import os
from flask import Flask, redirect, url_for
from config import DevConfig
from .extensions import db, login_manager, bcrypt, csrf, limiter, talisman

# registra modelos
from . import models

# Blueprints
from .auth.routes import auth_bp

def create_app(config_class=DevConfig):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # Garante pasta instance e fallback do SQLite absoluto
    os.makedirs(app.instance_path, exist_ok=True)
    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        db_path = os.path.join(app.instance_path, "app.db")
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"

    # Extensões
    db.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    csrf.init_app(app)              # ✅ reativado
    limiter.init_app(app)

    # Segurança de headers (force_https=True em produção)
    csp = {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
        "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.tailwindcss.com",
            "https://cdn.jsdelivr.net",
            "https://fonts.googleapis.com",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://*.openstreetmap.org"],
        "connect-src": [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://nominatim.openstreetmap.org",
        ],
    }
    talisman.init_app(app, content_security_policy=csp, force_https=False)

    # Adicionar funções globais ao Jinja2
    app.jinja_env.globals.update(max=max, min=min)
    
    # Blueprints
    app.register_blueprint(auth_bp)

    try:
        from .cidades.routes import cidades_bp
        app.register_blueprint(cidades_bp)
    except Exception as e:
        print(f"Erro ao registrar cidades_bp: {e}")

    try:
        from .rastreamento.routes import rastreamento_bp
        app.register_blueprint(rastreamento_bp)
    except Exception as e:
        print(f"Erro ao registrar rastreamento_bp: {e}")

    try:
        from .expedicoes.routes import expedicoes_bp
        app.register_blueprint(expedicoes_bp)
    except Exception as e:
        print(f"Erro ao registrar expedicoes_bp: {e}")

    try:
        from .consumiveis import consumiveis_bp
        app.register_blueprint(consumiveis_bp)
    except Exception as e:
        print(f"Erro ao registrar consumiveis_bp: {e}")

    try:
        from .divergencias.routes import divergencias_bp
        app.register_blueprint(divergencias_bp)
    except Exception as e:
        print(f"Erro ao registrar divergencias_bp: {e}")
        # Criar blueprint simples se a importação falhar
        from flask import Blueprint, render_template, request, jsonify, current_app
        from flask_login import login_required, current_user
        from .models import Consumivel
        from .utils.decorators import admin_required
        
        consumiveis_bp_simples = Blueprint('consumiveis', __name__, url_prefix='/consumiveis')
        
        @consumiveis_bp_simples.route('/')
        @login_required
        def index():
            return render_template('consumiveis_index.html', 
                                 consumiveis=None, 
                                 total_consumiveis=0,
                                 estoque_critico=0,
                                 estoque_baixo=0,
                                 estoque_esgotado=0,
                                 filiais=[],
                                 filial_filtro='',
                                 nivel_filtro='')
        
        @consumiveis_bp_simples.route('/cadastrar', methods=['GET', 'POST'])
        @login_required
        @admin_required
        def cadastrar():
            if request.method == 'POST':
                try:
                    data = request.get_json() if request.is_json else request.form
                    
                    filial = data.get('filial', '').strip()
                    codigo = data.get('codigo', '').strip()
                    descricao = data.get('descricao', '').strip()
                    saldo_estoque = int(data.get('saldo_estoque', 0))
                    estoque_minimo = int(data.get('estoque_minimo', 0))
                    unidade_medida = (data.get('unidade_medida', 'UN') or 'UN').strip().upper()
                    
                    # Validações
                    if not all([filial, codigo, descricao, unidade_medida]):
                        return jsonify({'error': 'Filial, código, descrição e unidade de medida são obrigatórios'}), 400
                    
                    if len(unidade_medida) > 20:
                        return jsonify({'error': 'Unidade de medida deve ter no máximo 20 caracteres'}), 400
                    
                    if saldo_estoque < 0 or estoque_minimo < 0:
                        return jsonify({'error': 'Valores de estoque não podem ser negativos'}), 400
                    
                    # Verificar se já existe
                    existente = Consumivel.query.filter_by(filial=filial, codigo=codigo).first()
                    if existente:
                        return jsonify({'error': f'Consumível {codigo} já cadastrado para a filial {filial}'}), 400
                    
                    # Criar novo consumível
                    consumivel = Consumivel(
                        filial=filial,
                        codigo=codigo,
                        descricao=descricao,
                        saldo_estoque=saldo_estoque,
                        estoque_minimo=estoque_minimo,
                        unidade_medida=unidade_medida
                    )
                    
                    # Calcular nível de estoque
                    consumivel.atualizar_nivel_estoque()
                    
                    current_app.extensions['sqlalchemy'].db.session.add(consumivel)
                    current_app.extensions['sqlalchemy'].db.session.commit()
                    
                    return jsonify({
                        'success': True,
                        'message': 'Consumível cadastrado com sucesso!',
                        'consumivel': consumivel.to_dict()
                    })
                
                except ValueError as e:
                    return jsonify({'error': 'Valores numéricos inválidos'}), 400
                except Exception as e:
                    current_app.extensions['sqlalchemy'].db.session.rollback()
                    return jsonify({'error': f'Erro ao cadastrar consumível: {str(e)}'}), 500
            
            return render_template('consumiveis_cadastrar.html')
        
        app.register_blueprint(consumiveis_bp_simples)
        print("Blueprint simples de consumíveis registrado com funcionalidades completas")

    try:
        from .lancamentos import lancamentos_bp
        app.register_blueprint(lancamentos_bp)
    except Exception as e:
        print(f"Erro ao registrar lancamentos_bp: {e}")

    try:
        from .lancamentos_cte import lancamentos_cte_bp
        app.register_blueprint(lancamentos_cte_bp)
    except Exception as e:
        print(f"Erro ao registrar lancamentos_cte_bp: {e}")

    try:
        from .indicadores import indicadores_bp
        app.register_blueprint(indicadores_bp)
    except Exception as e:
        print(f"Erro ao registrar indicadores_bp: {e}")

    try:
        from .feiras import feiras_bp
        app.register_blueprint(feiras_bp)
    except Exception as e:
        print(f"Erro ao registrar feiras_bp: {e}")

    try:
        # ⚠️ Importa os módulos de rotas para registrar endpoints da API
        from .api import api_bp
        from .api import data_routes, import_routes  # noqa: F401
        app.register_blueprint(api_bp)
    except Exception as e:
        print(f"Erro ao registrar api_bp: {e}")

    # Rotas simples
    @app.route("/")
    def index():
        from flask_login import current_user
        if current_user.is_authenticated:
            return redirect(url_for("cidades.index"))
        return redirect(url_for("auth.login"))

    @app.route("/teste")
    def teste():
        return '<h1>Aplicação funcionando corretamente!</h1><p><a href="/auth/login">Ir para Login</a></p>'

    # Handler de erro personalizado
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Se for uma requisição JSON/API, retornar JSON
        from flask import request
        if request.is_json or request.path.startswith('/api/') or request.path.startswith('/consumiveis/'):
            if 'UNIQUE constraint failed' in str(e) and 'filial' in str(e) and 'codigo' in str(e):
                return jsonify({
                    'error': '⚠️ Consumível já cadastrado!',
                    'details': 'Este código já existe para esta filial.',
                    'suggestion': 'Verifique se o código está correto ou edite o consumível existente.'
                }), 400
            return jsonify({'error': 'Erro interno do servidor'}), 500
        
        # Para outras requisições, usar comportamento padrão
        return e

    # Banco
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Aviso: Erro ao criar tabelas: {e}")

    return app