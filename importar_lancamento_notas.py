import pandas as pd
import sqlite3

# ==============================
# 📂 Caminhos
# ==============================

arquivo = r'K:\Parts\Logística\11- INDICADOR GLOBAL\12.0 - BASE LANÇAMENTO NOTAS\ENTRADA_300.xlsx'
banco = r'C:\Users\kmbwba\Desktop\15- Projeto Web\instance\app.db'

print(f"📂 Usando banco: {banco}")

# ==============================
# 📥 Ler Excel
# ==============================

df = pd.read_excel(arquivo)

# ==============================
# 🔄 Renomear colunas
# ==============================

df = df.rename(columns={
    'Fornecedor': 'fornecedor',
    'Nome Fornecedor': 'nome_fornecedor',
    'CNPJ Fornecedor': 'cnpj_fornecedor',
    'NF Número': 'nf_numero',
    'Série': 'serie',
    'Espécie Doc': 'especie_doc',
    'Dt.Lancto': 'dt_lancamento',
    'Local': 'local',
    'Valor Total': 'valor_total',
    'Natureza': 'natureza',
    'OC': 'oc',
    'Dt.Entrada': 'dt_entrada',
    'Dt.Emissão': 'dt_emissao',
    'Chave de Acesso': 'chave_acesso',
    'Vencimentos': 'vencimentos'
})

# ==============================
# 🧹 TRATAMENTO (AJUSTADO)
# ==============================

# ✅ Converter datas
df['dt_lancamento'] = pd.to_datetime(df['dt_lancamento'], errors='coerce')
df['dt_entrada'] = pd.to_datetime(df['dt_entrada'], errors='coerce')
df['dt_emissao'] = pd.to_datetime(df['dt_emissao'], errors='coerce')

# ✅ Formatar datas para DD/MM/YYYY
df['dt_lancamento'] = df['dt_lancamento'].dt.strftime('%d/%m/%Y')
df['dt_entrada'] = df['dt_entrada'].dt.strftime('%d/%m/%Y')
df['dt_emissao'] = df['dt_emissao'].dt.strftime('%d/%m/%Y')

# ✅ Substituir valores nulos
df = df.where(pd.notnull(df), None)

# ✅ Corrigir valor
df['valor_total'] = df['valor_total'].replace(',', '.', regex=True)
df['valor_total'] = pd.to_numeric(df['valor_total'], errors='coerce')

# ✅ 🔑 Remover "#" da chave de acesso
df['chave_acesso'] = df['chave_acesso'].astype(str).str.replace('#', '', regex=False)

# ==============================
# 🗄 Conectar SQLite
# ==============================

conn = sqlite3.connect(banco)
cursor = conn.cursor()

# ==============================
# 🏗 Criar tabela automaticamente
# ==============================

cursor.execute("""
CREATE TABLE IF NOT EXISTS lancamento_notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    fornecedor TEXT,
    nome_fornecedor TEXT,
    cnpj_fornecedor TEXT,

    nf_numero TEXT,
    serie TEXT,
    especie_doc TEXT,

    dt_lancamento TEXT,
    local TEXT,
    valor_total REAL,

    natureza TEXT,
    oc TEXT,

    dt_entrada TEXT,
    dt_emissao TEXT,

    chave_acesso TEXT UNIQUE,

    vencimentos TEXT
)
""")

# ==============================
# 📤 Inserção dos dados
# ==============================

registros_inseridos = 0

for index, row in df.iterrows():
    try:
        cursor.execute("""
            INSERT OR IGNORE INTO lancamento_notas (
                fornecedor,
                nome_fornecedor,
                cnpj_fornecedor,
                nf_numero,
                serie,
                especie_doc,
                dt_lancamento,
                local,
                valor_total,
                natureza,
                oc,
                dt_entrada,
                dt_emissao,
                chave_acesso,
                vencimentos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row['fornecedor'],
            row['nome_fornecedor'],
            row['cnpj_fornecedor'],
            row['nf_numero'],
            row['serie'],
            row['especie_doc'],
            row['dt_lancamento'],
            row['local'],
            row['valor_total'],
            row['natureza'],
            row['oc'],
            row['dt_entrada'],
            row['dt_emissao'],
            row['chave_acesso'],
            row['vencimentos']
        ))

        registros_inseridos += cursor.rowcount

    except Exception as e:
        print(f"❌ Erro na linha {index}: {e}")

# ==============================
# 💾 Salvar e finalizar
# ==============================

conn.commit()
conn.close()

# ==============================
# ✅ Resultado
# ==============================

print("✅ Carga finalizada!")
print(f"📊 Registros inseridos: {registros_inseridos}")