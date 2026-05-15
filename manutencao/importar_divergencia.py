import pandas as pd
import sqlite3
from datetime import datetime

# ==========================================
# CAMINHOS
# ==========================================
excel_path = r"C:\Users\kmbwba\Desktop\15- Projeto Web\bases_notas.xlsx"
db_path = r"C:\Users\kmbwba\Desktop\15- Projeto Web\instance\app.db"

# ==========================================
# LER EXCEL
# ==========================================
df = pd.read_excel(excel_path)

# Padronizar nomes das colunas
df.columns = [col.strip().lower() for col in df.columns]

# ✅ CORREÇÃO PRINCIPAL: converter data
df['data'] = pd.to_datetime(df['data'], errors='coerce')
df['data'] = df['data'].dt.strftime('%Y-%m-%d')  # formato SQLite

# ==========================================
# CONECTAR NO BANCO
# ==========================================
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# ==========================================
# DEBUG: LISTAR TABELAS
# ==========================================
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("📋 Tabelas encontradas no banco:")
for table in tables:
    print("-", table[0])

# ==========================================
# INSERIR DADOS
# ==========================================
inseridos  = 0
ignorados  = 0

for _, row in df.iterrows():
    try:
        cursor.execute("""
            SELECT COUNT(*) FROM divergencias_nota
            WHERE nota_fiscal = ? AND fornecedor = ? AND divergencia = ?
        """, (
            row.get('nota_fiscal'),
            row.get('fornecedor'),
            row.get('divergencia'),
        ))
        if cursor.fetchone()[0] > 0:
            print(f"⚠️  Ignorado (já existe): NF {row.get('nota_fiscal')} | {row.get('fornecedor')}")
            ignorados += 1
            continue

        cursor.execute("""
            INSERT INTO divergencias_nota (
                data,
                nota_fiscal,
                fornecedor,
                divergencia,
                ordem_compra,
                item,
                comprador,
                provider,
                email_provider,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row.get('data'),
            row.get('nota_fiscal'),
            row.get('fornecedor'),
            row.get('divergencia'),
            row.get('ordem_compra'),
            None,
            row.get('comprador'),
            row.get('provider'),
            row.get('email_provider'),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        inseridos += 1

    except Exception as e:
        print(f"❌ Erro ao inserir linha {row.name}")
        print("Erro:", e)

# ==========================================
# SALVAR E FECHAR
# ==========================================
conn.commit()
conn.close()

print(f"\n✅ Importação finalizada! Inseridos: {inseridos} | Ignorados (duplicados): {ignorados}")