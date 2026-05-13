"""
Script para atualizar dados de expedição faltantes no banco de dados
Atualiza transportadora, data de expedição e outros campos que estavam vazios
quando a NF foi importada inicialmente.
"""

import os
import sqlite3
import pandas as pd
from datetime import datetime
import warnings

# Configurações
BASE_DIR = r'C:\Users\kmbwba\Desktop\15- Projeto Web\base'
DB_PATH = r'C:\Users\kmbwba\Desktop\15- Projeto Web\instance\app.db'

# Colunas necessárias
COLS_NEEDED = [
    "NF", "Serie", "Produto",
    "Data/Hora Expedicao", "Data/Hora Saida", 
    "Motorista", "CPF", "Transportadora", "Placa/UF"
]

def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def load_excel_data():
    """Carrega todos os arquivos Excel da pasta base"""
    all_data = []
    
    # Listar arquivos Excel
    excel_files = [f for f in os.listdir(BASE_DIR) if f.endswith(('.xlsx', '.xls'))]
    
    for file in excel_files:
        filepath = os.path.join(BASE_DIR, file)
        filial = os.path.splitext(file)[0].upper()  # KMB, KTO, etc.
        
        print(f"  Lendo arquivo {file}...")
        try:
            df = pd.read_excel(filepath, dtype=str)
            df['filial'] = filial
            all_data.append(df)
        except Exception as e:
            print(f"    Erro ao ler {file}: {e}")
    
    if all_data:
        return pd.concat(all_data, ignore_index=True)
    return pd.DataFrame()

def parse_date(date_str):
    """Converte string de data para formato do banco"""
    if pd.isna(date_str) or date_str == 'nan' or date_str == '':
        return None
    
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            dt = pd.to_datetime(date_str, errors='coerce', dayfirst=True)
            if pd.isna(dt):
                return None
            return dt.strftime("%Y-%m-%d %H:%M:%S")
    except:
        return None

def get_nfs_sem_dados(conn):
    """Retorna NFs que estão sem transportadora ou data de expedição"""
    query = """
    SELECT DISTINCT filial, serie, nf, nf_key
    FROM expedicao
    WHERE (transportadora IS NULL OR transportadora = '')
       OR (datahora_exped IS NULL OR datahora_exped = '')
    ORDER BY filial, nf
    """
    
    cursor = conn.cursor()
    cursor.execute(query)
    return cursor.fetchall()

def atualizar_nf(conn, nf_key, dados_excel):
    """Atualiza uma NF específica com dados do Excel"""
    
    # Preparar dados para atualização
    updates = []
    params = []
    
    if pd.notna(dados_excel.get('Transportadora')) and dados_excel.get('Transportadora'):
        updates.append("transportadora = ?")
        params.append(str(dados_excel['Transportadora']).strip())
    
    if pd.notna(dados_excel.get('Data/Hora Expedicao')):
        data_exp = parse_date(dados_excel['Data/Hora Expedicao'])
        if data_exp:
            updates.append("datahora_exped = ?")
            params.append(data_exp)
    
    if pd.notna(dados_excel.get('Data/Hora Saida')):
        data_saida = parse_date(dados_excel['Data/Hora Saida'])
        if data_saida:
            updates.append("datahora_saida = ?")
            params.append(data_saida)
    
    if pd.notna(dados_excel.get('Motorista')) and dados_excel.get('Motorista'):
        updates.append("motorista = ?")
        params.append(str(dados_excel['Motorista']).strip())
    
    if pd.notna(dados_excel.get('CPF')) and dados_excel.get('CPF'):
        updates.append("cpf_motorista = ?")
        params.append(str(dados_excel['CPF']).strip())
    
    if pd.notna(dados_excel.get('Placa/UF')) and dados_excel.get('Placa/UF'):
        updates.append("placa_uf = ?")
        params.append(str(dados_excel['Placa/UF']).strip())
    
    if updates:
        params.append(nf_key)
        sql = f"UPDATE expedicao SET {', '.join(updates)} WHERE nf_key = ?"
        
        cursor = conn.cursor()
        cursor.execute(sql, params)
        return cursor.rowcount
    
    return 0

def main():
    print("=" * 60)
    print("ATUALIZAÇÃO DE DADOS DE EXPEDIÇÃO FALTANTES")
    print("=" * 60)
    print()
    
    # Conectar ao banco
    conn = connect_db()
    
    # Carregar dados do Excel
    print("1. Carregando dados atuais do Excel...")
    df_excel = load_excel_data()
    
    if df_excel.empty:
        print("   Erro: Nenhum dado carregado do Excel!")
        return
    
    print(f"   Total de linhas carregadas: {len(df_excel)}")
    
    # Limpar colunas
    if 'NF' in df_excel.columns:
        df_excel['NF'] = df_excel['NF'].astype(str).str.strip()
    if 'Serie' in df_excel.columns:
        df_excel['Serie'] = df_excel['Serie'].astype(str).str.strip()
    
    # Buscar NFs sem dados
    print("\n2. Buscando NFs sem transportadora ou data de expedição...")
    nfs_sem_dados = get_nfs_sem_dados(conn)
    print(f"   Encontradas {len(nfs_sem_dados)} NFs incompletas")
    
    if not nfs_sem_dados:
        print("   Todas as NFs já possuem dados completos!")
        return
    
    # Processar cada NF
    print("\n3. Atualizando NFs com dados do Excel...")
    total_atualizadas = 0
    nfs_atualizadas = []
    
    for filial, serie, nf, nf_key in nfs_sem_dados:
        # Buscar dados no Excel
        filtro = (df_excel['filial'] == filial) & \
                 (df_excel['NF'] == nf) & \
                 (df_excel['Serie'] == serie)
        
        dados = df_excel[filtro]
        
        if not dados.empty:
            # Pegar primeira linha (geralmente são todas iguais para mesma NF)
            dados_nf = dados.iloc[0]
            
            # Verificar se tem dados novos para atualizar
            tem_transp = pd.notna(dados_nf.get('Transportadora')) and dados_nf.get('Transportadora')
            tem_data = pd.notna(dados_nf.get('Data/Hora Expedicao')) and dados_nf.get('Data/Hora Expedicao')
            
            if tem_transp or tem_data:
                linhas = atualizar_nf(conn, nf_key, dados_nf)
                if linhas > 0:
                    total_atualizadas += linhas
                    nfs_atualizadas.append({
                        'nf': nf,
                        'filial': filial,
                        'transportadora': dados_nf.get('Transportadora', 'N/A'),
                        'data_expedicao': dados_nf.get('Data/Hora Expedicao', 'N/A')
                    })
                    print(f"   [OK] NF {nf} ({filial}): Atualizada com sucesso")
    
    # Commit das alterações
    conn.commit()
    
    # Resultados
    print("\n" + "=" * 60)
    print("RESULTADO DA ATUALIZAÇÃO")
    print("=" * 60)
    print(f"Total de registros atualizados: {total_atualizadas}")
    print(f"NFs únicas atualizadas: {len(nfs_atualizadas)}")
    
    if nfs_atualizadas:
        print("\nDetalhes das NFs atualizadas:")
        for i, nf_info in enumerate(nfs_atualizadas[:20], 1):  # Mostrar até 20
            print(f"  {i}. NF {nf_info['nf']} ({nf_info['filial']})")
            print(f"     Transportadora: {nf_info['transportadora']}")
            print(f"     Data Expedição: {nf_info['data_expedicao']}")
        
        if len(nfs_atualizadas) > 20:
            print(f"  ... e mais {len(nfs_atualizadas) - 20} NFs")
    
    # Verificar especificamente a NF 210.800
    print("\n" + "=" * 60)
    print("VERIFICAÇÃO DA NF 210.800")
    print("=" * 60)
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT nf, transportadora, datahora_exped, motorista
        FROM expedicao
        WHERE nf = '210.800'
        LIMIT 2
    """)
    rows = cursor.fetchall()
    
    for row in rows:
        print(f"  NF: {row[0]}")
        print(f"  Transportadora: {row[1]}")
        print(f"  Data Expedição: {row[2]}")
        print(f"  Motorista: {row[3]}")
        print()
    
    conn.close()
    print("Processo concluído!")

if __name__ == "__main__":
    main()
