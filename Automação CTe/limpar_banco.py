import sqlite3
import os

DB_PATH = os.path.join('..', 'instance', 'app.db')

print(f"Limpando tabela 'lancamento_fiscal' no banco: {os.path.abspath(DB_PATH)}\n")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

try:
    # Obter contagem antes da limpeza
    cur.execute("SELECT COUNT(*) FROM lancamento_fiscal")
    count_antes = cur.fetchone()[0]
    
    # Deletar registros
    cur.execute("DELETE FROM lancamento_fiscal")
    conn.commit()
    
    # Obter contagem depois da limpeza
    cur.execute("SELECT COUNT(*) FROM lancamento_fiscal")
    count_depois = cur.fetchone()[0]
    
    print(f"✓ Registros removidos: {count_antes}")
    print(f"✓ Registros restantes: {count_depois}")
    print("\n✅ Todos os registros da tabela 'lancamento_fiscal' foram removidos com sucesso!")
    
except Exception as e:
    print(f"❌ Erro ao limpar a tabela: {e}")
finally:
    conn.close()
