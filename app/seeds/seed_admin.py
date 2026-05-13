import os
import sys
from dotenv import load_dotenv

# Adicionar o diretório raiz ao Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import create_app
from app.extensions import db
from app.models import User

load_dotenv()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@kuhn.com.br")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")

def main():
    app = create_app()
    with app.app_context():
        db.create_all()
        u = User.query.filter_by(email=ADMIN_EMAIL.lower()).first()
        if not u:
            u = User(email=ADMIN_EMAIL.lower(), role="admin")
            u.set_password(ADMIN_PASSWORD)
            db.session.add(u)
            db.session.commit()
            print(f"Admin criado: {ADMIN_EMAIL}")
        else:
            print("Admin já existe.")

if __name__ == "__main__":
    main()