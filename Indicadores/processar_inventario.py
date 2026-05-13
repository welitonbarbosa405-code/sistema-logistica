import os
import pandas as pd
import sqlite3
import unicodedata

# Caminho da pasta com os arquivos
pasta = r'K:\Parts\Logística\11- INDICADOR GLOBAL\11.1 -BASE INDICADORES GLOBAIS\11.1.4 - INVENTARIO'

# Caminho do banco SQLite
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'app.db')

# Mapeamento de códigos de filial
filiais = {
    '2002': 'KMB',
    '2102': 'KMT',
    '2202': 'KBR',
    '2302': 'KTO'
}

# Lista para armazenar os dados de todos os arquivos
dados_resumo = []

# Colunas obrigatórias (padronizadas)
colunas_necessarias = ['date', 'article', 'qte d', 'qte s', 'area', 'user']

def padroniza_coluna(col):
    # Remove acentos, deixa minúsculo e tira espaços extras
    return unicodedata.normalize('NFKD', col).encode('ASCII', 'ignore').decode('ASCII').lower().strip()

print("=" * 60)
print("PROCESSANDO ARQUIVOS DE INVENTÁRIO")
print("=" * 60)

# Percorrer todos os arquivos na pasta
for arquivo in os.listdir(pasta):
    if arquivo == 'resumo_inventario.xlsx':
        continue
    if arquivo.endswith('.xlsx') or arquivo.endswith('.xls'):
        caminho_arquivo = os.path.join(pasta, arquivo)
        
        # Identificar a filial com base no nome do arquivo
        filial = None
        for codigo, nome in filiais.items():
            if codigo in arquivo:
                filial = nome
                break
        if filial is None:
            print(f"⚠️  Atenção: Não foi possível identificar a filial para o arquivo {arquivo}")
            continue
        
        # Ler os dados a partir da linha 8 (header=7)
        try:
            print(f"📂 Processando: {arquivo} (Filial: {filial})")
            df = pd.read_excel(caminho_arquivo, header=7)
            # Padroniza os nomes das colunas
            df.columns = [padroniza_coluna(col) for col in df.columns]
            # Verifica se todas as colunas necessárias existem
            if all(col in df.columns for col in colunas_necessarias):
                df_resumo = df[colunas_necessarias].copy()
                df_resumo.columns = ['data', 'codigo', 'quantidade_sistema', 'quantidade_inventariada', 'zona', 'usuario']
                df_resumo['filial'] = filial
                df_resumo['data'] = pd.to_datetime(df_resumo['data']).dt.strftime('%d/%m/%Y')
                df_resumo['data'] = df_resumo['data'].astype(str)
                dados_resumo.append(df_resumo)
                print(f"✅ {len(df_resumo)} linhas processadas")
            else:
                print(f"❌ Arquivo {arquivo} não possui todas as colunas necessárias. Colunas encontradas: {df.columns.tolist()}")
                continue
        except Exception as e:
            print(f"❌ Erro ao processar {arquivo}: {e}")

# Concatenar todos os dados em um único DataFrame
if dados_resumo:
    print("\n" + "=" * 60)
    print("SALVANDO RESUMO E IMPORTANDO PARA BANCO")
    print("=" * 60)
    
    resumo_final = pd.concat(dados_resumo, ignore_index=True)
    
    # Salvar arquivo Excel
    caminho_saida = os.path.join(pasta, 'resumo_inventario.xlsx')
    resumo_final.to_excel(caminho_saida, index=False)
    print(f"📊 Resumo salvo como '{caminho_saida}'")
    
    # Conectar ao banco SQLite
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Criar tabela se não existir
        print("🗄️  Criando/Verificando tabela no banco...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS inventario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                codigo TEXT NOT NULL,
                quantidade_sistema INTEGER,
                quantidade_inventariada INTEGER,
                zona TEXT,
                usuario TEXT,
                filial TEXT,
                UNIQUE(data, codigo, filial)
            )
        ''')
        conn.commit()
        print("✅ Tabela pronta")
        
        # Inserir dados na tabela
        print("📥 Importando dados para o banco...")
        registros_inseridos = 0
        registros_duplicados = 0
        
        for _, row in resumo_final.iterrows():
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO inventario (data, codigo, quantidade_sistema, quantidade_inventariada, zona, usuario, filial)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    str(row['data']),
                    str(row['codigo']),
                    int(row['quantidade_sistema']) if not pd.isna(row['quantidade_sistema']) else None,
                    int(row['quantidade_inventariada']) if not pd.isna(row['quantidade_inventariada']) else None,
                    str(row['zona']),
                    str(row['usuario']),
                    str(row['filial'])
                ))
                registros_inseridos += 1
            except sqlite3.IntegrityError:
                registros_duplicados += 1
            except Exception as e:
                print(f"❌ Erro ao inserir linha: {e}")
        
        conn.commit()
        conn.close()
        
        print(f"✅ Importação concluída!")
        print(f"   - Registros inseridos: {registros_inseridos}")
        print(f"   - Registros duplicados (ignorados): {registros_duplicados}")
        print("\n" + "=" * 60)
        print("PROCESSO FINALIZADO COM SUCESSO!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Erro ao conectar/importar no banco: {e}")
else:
    print("❌ Nenhum dado foi processado.")
