import os

class Config:
    SECRET_KEY = "your-secret-key-here-change-in-production"
    # Usar caminho absoluto para o banco de dados
    BASE_DIR = r"C:\Users\kmbwba\Desktop\15- Projeto Web"
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'app.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = True
    BCRYPT_LOG_ROUNDS = 12
    
    # Configurações de erro
    PROPAGATE_EXCEPTIONS = False
    TRAP_HTTP_EXCEPTIONS = True
    
    # Configurações de segurança
    SESSION_COOKIE_SECURE = False  # True em produção com HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = "memory://"
    RATELIMIT_DEFAULT = "1000 per hour"
    
    # Email (se necessário)
    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = int(os.getenv("MAIL_PORT") or 587)
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() in ["true", "on", "1"]
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

class DevConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(Config.BASE_DIR, 'instance', 'app.db')}"

class ProdConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or f"sqlite:///{os.path.join(Config.BASE_DIR, 'instance', 'app.db')}"
