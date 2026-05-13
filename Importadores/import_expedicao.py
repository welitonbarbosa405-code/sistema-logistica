# importar_expedicao_unica_tabela.py
import os
import re
import sqlite3
from glob import glob
from datetime import datetime
import pandas as pd

# ================== CONFIG ==================
BASE_DIR = r'C:\Users\kmbwba\Desktop\15- Projeto Web\base'         # pasta com os Excel (ex.: KMB.xlsx)
DB_PATH  = r'C:\Users\kmbwba\Desktop\15- Projeto Web\instance\app.db'  # usa seu app.db existente
VALID_EXT = ('.xlsx', '.xls', '.csv')

# Somente as colunas necessárias (nomes ORIGINAIS do Excel/CSV)
ORIG_COLS = [
    "Emissao", "Serie", "NF",
    "Produto", "Descricao", "Quantidade", "Valor Unitario", "Valor Item", "Valor Total",
    "Cliente", "Nome", "Municipio", "UF", "Pais",
    "Data/Hora Expedicao", "Data/Hora Saida", "Motorista", "CPF", "Transportadora", "Placa/UF",
    "Pedido", "T.Frete", "Refaturamento"
]

# Mapa de nomes originais -> normalizados
COL_MAP = {
    "Emissao": "emissao",
    "Serie": "serie",
    "NF": "nf",
    "Produto": "produto",
    "Descricao": "descricao",
    "Quantidade": "quantidade",
    "Valor Unitario": "valor_unitario",
    "Valor Item": "valor_item",
    "Valor Total": "valor_total",
    "Cliente": "cliente",
    "Nome": "nome_cliente",
    "Municipio": "municipio",
    "UF": "uf",
    "Pais": "pais",
    "Data/Hora Expedicao": "datahora_exped",
    "Data/Hora Saida": "datahora_saida",
    "Motorista": "motorista",
    "CPF": "cpf_motorista",
    "Transportadora": "transportadora",
    "Placa/UF": "placa_uf",
    "Pedido": "pedido",
    "T.Frete": "t_frete",
    "Refaturamento": "refaturamento",
}

# ================== BANCO ==================
def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def ensure_schema(conn: sqlite3.Connection):
    conn.executescript("""
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS expedicao (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,

      nf_key           TEXT NOT NULL,            -- FILIAL|SERIE|NF
      item_seq         INTEGER NOT NULL,         -- 1,2,3...

      filial           TEXT,
      fonte_arquivo    TEXT,
      dt_importacao    TEXT,

      emissao          TEXT,
      serie            TEXT,
      nf               TEXT,

      produto          TEXT,
      descricao        TEXT,
      quantidade       REAL,
      valor_unitario   REAL,
      valor_item       REAL,
      valor_total      REAL,

      cliente          TEXT,
      nome_cliente     TEXT,
      municipio        TEXT,
      uf               TEXT,
      pais             TEXT,

      datahora_exped   TEXT,
      datahora_saida   TEXT,
      motorista        TEXT,
      cpf_motorista    TEXT,
      transportadora   TEXT,
      placa_uf         TEXT,

      pedido           TEXT,
      t_frete          TEXT,
      refaturamento    TEXT,

      UNIQUE(nf_key, item_seq)
    );

    CREATE INDEX IF NOT EXISTS ix_expedicao_data      ON expedicao(emissao);
    CREATE INDEX IF NOT EXISTS ix_expedicao_fil_nf    ON expedicao(filial, serie, nf);
    CREATE INDEX IF NOT EXISTS ix_expedicao_transp    ON expedicao(transportadora);
    """)
    conn.commit()

# ================== UTIL ==================
def load_file(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext in ('.xlsx', '.xls'):
        return pd.read_excel(path, dtype=str, usecols=lambda c: c in ORIG_COLS)
    elif ext == '.csv':
        # ajuste o separador se necessário (muitos ERPs exportam com ';')
        return pd.read_csv(path, dtype=str, sep=';', engine='python',
                           usecols=lambda c: c in ORIG_COLS)
    else:
        raise ValueError(f'Extensão não suportada: {ext}')

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    rename_map = {}
    for col in df.columns:
        c = str(col).strip()
        c = re.sub(r"\s+", " ", c)
        rename_map[col] = COL_MAP.get(c, c)
    return df.rename(columns=rename_map)

def parse_dates(df: pd.DataFrame) -> pd.DataFrame:
    for col in ["emissao", "datahora_exped", "datahora_saida"]:
        if col in df.columns:
            # Suprime warnings de parsing de data
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                s = pd.to_datetime(df[col], errors='coerce', dayfirst=True)
                df[col] = s.dt.strftime("%Y-%m-%d %H:%M:%S").where(~s.isna(), None)
    return df

def get_filial_from_filename(path: str) -> str:
    base = os.path.basename(path)          # KMB.xlsx
    name, _ = os.path.splitext(base)       # KMB
    return name.strip().upper()

def build_nf_key(filial: str, serie: str, nf: str) -> str:
    serie = (serie or "").strip().upper()
    nf    = (nf or "").strip().upper()
    return f"{filial}|{serie}|{nf}"

def get_existing_nf_keys(conn: sqlite3.Connection, keys: list[str]) -> set[str]:
    if not keys:
        return set()
    existing = set()
    chunk = 999
    for i in range(0, len(keys), chunk):
        sub = keys[i:i+chunk]
        q = "SELECT DISTINCT nf_key FROM expedicao WHERE nf_key IN (%s)" % ",".join("?"*len(sub))
        rows = conn.execute(q, sub).fetchall()
        existing.update(r[0] for r in rows)
    return existing

def insert_items(conn: sqlite3.Connection, df: pd.DataFrame):
    cols = [
        "nf_key","item_seq","filial","fonte_arquivo","dt_importacao",
        "emissao","serie","nf",
        "produto","descricao","quantidade","valor_unitario","valor_item","valor_total",
        "cliente","nome_cliente","municipio","uf","pais",
        "datahora_exped","datahora_saida","motorista","cpf_motorista","transportadora","placa_uf",
        "pedido","t_frete","refaturamento"
    ]
    for c in cols:
        if c not in df.columns:
            df[c] = None
    sql = f"INSERT OR IGNORE INTO expedicao ({','.join(cols)}) VALUES ({','.join('?'*len(cols))})"
    conn.executemany(sql, df[cols].where(pd.notna(df[cols]), None).values.tolist())

# ================== PIPE ==================
def process_one_file(conn: sqlite3.Connection, path: str) -> tuple[int, int]:
    print(f"\n📁 Processando arquivo: {os.path.basename(path)}")
    
    df = load_file(path)
    if df.empty:
        print(f"   ⚠️  Arquivo vazio - ignorando")
        return 0, 0

    print(f"   📊 Linhas carregadas: {len(df)}")
    
    df = normalize_columns(df)
    df = parse_dates(df)

    filial = get_filial_from_filename(path)
    df["filial"] = filial
    df["fonte_arquivo"] = path
    df["dt_importacao"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print(f"   🏢 Filial detectada: {filial}")

    # garante mínimos
    for c in ["serie","nf","produto","descricao","quantidade","valor_unitario","valor_item","valor_total","emissao"]:
        if c not in df.columns:
            df[c] = None

    # limpa espaços
    df["serie"] = df["serie"].astype(str).str.strip()
    df["nf"]    = df["nf"].astype(str).str.strip()

    # descarta linhas sem série ou nf
    df_antes = len(df)
    df = df[(df["serie"].notna()) & (df["serie"].astype(str).str.len() > 0) &
            (df["nf"].notna())    & (df["nf"].astype(str).str.len() > 0)].copy()
    
    print(f"   🧹 Linhas válidas após limpeza: {len(df)} (removidas: {df_antes - len(df)})")
    
    if df.empty:
        print(f"   ⚠️  Nenhuma linha válida encontrada")
        return 0, 0

    # monta nf_key e item_seq
    df["nf_key"] = df.apply(lambda r: build_nf_key(filial, r.get("serie"), r.get("nf")), axis=1)
    df["item_seq"] = df.groupby("nf_key").cumcount() + 1
    
    nfs_unicas = df["nf_key"].nunique()
    print(f"   📋 NFs únicas encontradas: {nfs_unicas}")

    # BLOQUEIO: se a NF já existir, remove TODAS as linhas dessa NF
    exist = get_existing_nf_keys(conn, df["nf_key"].dropna().unique().tolist())
    if exist:
        print(f"   🔒 NFs já existentes no banco: {len(exist):,}")
        df = df[~df["nf_key"].isin(exist)].copy()
        print(f"   ✅ NFs novas para importar: {df['nf_key'].nunique():,}")
    else:
        print(f"   ✅ Todas as NFs são novas")
        
    if df.empty:
        print(f"   ⚠️  Nenhuma NF nova para importar")
        return 0, 0

    print(f"   💾 Inserindo {len(df)} itens no banco...")
    with conn:  # transação
        insert_items(conn, df)

    print(f"   ✅ Concluído: {df['nf_key'].nunique()} NFs | {len(df)} itens")
    return df["nf_key"].nunique(), len(df)

def import_all():
    print("🚀 INICIANDO IMPORTAÇÃO DE EXPEDIÇÃO")
    print("=" * 50)
    
    conn = connect_db()
    ensure_schema(conn)
    print("✅ Conexão com banco estabelecida")

    # arquivos na raiz da base e em subpastas
    files = [p for p in glob(os.path.join(BASE_DIR, "*")) if os.path.splitext(p)[1].lower() in VALID_EXT]
    files += [p for p in glob(os.path.join(BASE_DIR, "**", "*"), recursive=True) if os.path.splitext(p)[1].lower() in VALID_EXT]

    print(f"📂 Pasta base: {BASE_DIR}")
    print(f"📄 Arquivos encontrados: {len(files)}")
    for f in sorted(set(files)):
        print(f"   - {os.path.basename(f)}")
    print()
    
    # Estatísticas do banco antes da importação
    cursor = conn.execute("SELECT COUNT(*) FROM expedicao")
    total_existente = cursor.fetchone()[0]
    print(f"📊 Registros já existentes no banco: {total_existente:,}")
    
    cursor = conn.execute("SELECT filial, COUNT(*) FROM expedicao GROUP BY filial ORDER BY filial")
    filiais_existentes = cursor.fetchall()
    if filiais_existentes:
        print("🏢 Filiais já no banco:")
        for filial, count in filiais_existentes:
            print(f"   - {filial}: {count:,} registros")
    print()

    total_nf = total_itens = 0
    arquivos_processados = 0
    
    for f in sorted(set(files)):
        try:
            arquivos_processados += 1
            print(f"[{arquivos_processados}/{len(files)}] ", end="")
            n_nf, n_itens = process_one_file(conn, f)
            total_nf += n_nf
            total_itens += n_itens
        except Exception as e:
            print(f"❌ [ERRO] {os.path.basename(f)} -> {e}")

    conn.close()
    print("\n" + "=" * 50)
    print("🎉 IMPORTAÇÃO CONCLUÍDA!")
    print(f"📊 Total de NFs importadas: {total_nf:,}")
    print(f"📦 Total de itens importados: {total_itens:,}")
    print(f"📁 Arquivos processados: {arquivos_processados}")
    
    if total_nf == 0:
        print("ℹ️  Todas as NFs já existiam no banco - nenhuma duplicata!")
    else:
        print(f"✅ {total_nf:,} novas NFs adicionadas ao banco")
    
    print("=" * 50)

# ================== MAIN ==================
if __name__ == "__main__":
    import_all()