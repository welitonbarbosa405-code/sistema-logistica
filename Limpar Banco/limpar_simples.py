# Script simples para limpar tabela expedição
from app import create_app
from app.models import Expedicao
from app.extensions import db

app = create_app()
with app.app_context():
    total = Expedicao.query.count()
    print(f"Removendo {total:,} registros...")
    
    Expedicao.query.delete()
    db.session.commit()
    
    print("✅ Tabela expedição limpa!")
