# -*- coding: utf-8 -*-
"""
Script para importar dados de CTe Lançamento do Excel para o banco de dados
Arquivo: BASE PRODESYS/lancamento.xlsx
Colunas: NF Número | Dt.Lancto | Chave de Acesso
"""

import sys
import os
from datetime import datetime
import sqlite3

# Adicionar o diretório ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import openpyxl
except ImportError:
    print("❌ openpyxl não instalado. Instalando...")
    os.system("pip install openpyxl")
    import openpyxl

def importar_cte_lancamento():
    """Importa dados do Excel para a tabela cte_lancamento"""
    
    # Caminho do arquivo
    arquivo_path = r"C:\Users\kmbwba\Desktop\15- Projeto Web\Automação CTe\BASE PRODESYS\lancamento.xlsx"
    db_path = r"C:\Users\kmbwba\Desktop\15- Projeto Web\instance\app.db"
    
    print("=" * 60)
    print("IMPORTAÇÃO DE CTe LANÇAMENTO")
    print("=" * 60)
    
    # Verificar se o arquivo existe
    if not os.path.exists(arquivo_path):
        print(f"❌ Arquivo não encontrado: {arquivo_path}")
        return False
    
    print(f"\n📂 Arquivo: {arquivo_path}")
    
    try:
        # Carregar o Excel
        workbook = openpyxl.load_workbook(arquivo_path)
        sheet = workbook.active
        
        print(f"📊 Sheet: {sheet.title}")
        
        # Conectar ao banco de dados
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se a tabela existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='cte_lancamento'
        """)
        if not cursor.fetchone():
            print("❌ Tabela 'cte_lancamento' não existe no banco!")
            return False
        
        print("✅ Tabela 'cte_lancamento' encontrada\n")
        
        registros_adicionados = 0
        registros_duplicados = 0
        registros_erro = 0
        
        # Percorrer as linhas (começar da linha 2, pois a 1 é cabeçalho)
        for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            try:
                numero_nf = row[0]  # Coluna A: NF Número
                data_lancamento = row[1]  # Coluna B: Dt.Lancto
                chave_acesso = row[2]  # Coluna C: Chave de Acesso
                
                # Validar dados
                if not numero_nf or not data_lancamento or not chave_acesso:
                    print(f"⚠️  Linha {row_idx}: Dados incompletos - Pulando")
                    registros_erro += 1
                    continue
                  # Converter numero_nf para string
                numero_nf = str(numero_nf).strip()
                
                # Limpar chave de acesso: remover # da inicial
                chave_acesso = str(chave_acesso).strip()
                if chave_acesso.startswith('#'):
                    chave_acesso = chave_acesso[1:].strip()
                  # Converter data se for objeto datetime do Excel
                if isinstance(data_lancamento, datetime):
                    data_lancamento_str = data_lancamento.strftime('%d/%m/%Y')
                    data_lancamento_display = data_lancamento.strftime('%d/%m/%Y')
                else:
                    # Tentar parsear como string (formato DD/MM/YYYY)
                    try:
                        data_obj = datetime.strptime(str(data_lancamento).strip(), '%d/%m/%Y')
                        data_lancamento_str = data_obj.strftime('%d/%m/%Y')
                        data_lancamento_display = data_obj.strftime('%d/%m/%Y')
                    except ValueError:
                        print(f"⚠️  Linha {row_idx}: Formato de data inválido '{data_lancamento}' - Pulando")
                        registros_erro += 1
                        continue
                  # Tentar inserir o registro
                try:
                    cursor.execute("""
                        INSERT INTO cte_lancamento (numero_nf, data_lancamento, chave_acesso)
                        VALUES (?, ?, ?)
                    """, (numero_nf, data_lancamento_str, chave_acesso))
                    
                    registros_adicionados += 1
                    print(f"✅ Linha {row_idx}: NF {numero_nf} - {data_lancamento_display} - OK")
                    
                except sqlite3.IntegrityError as e:
                    # Erro de UNIQUE constraint (duplicado)
                    registros_duplicados += 1
                    print(f"⚠️  Linha {row_idx}: NF {numero_nf} - JÁ EXISTE (duplicado)")
                    
            except Exception as e:
                registros_erro += 1
                print(f"❌ Linha {row_idx}: Erro ao processar - {str(e)}")
        
        # Commit das alterações
        conn.commit()
        
        # Contar registros na tabela
        cursor.execute("SELECT COUNT(*) FROM cte_lancamento")
        total_registros = cursor.fetchone()[0]
        
        # Resumo
        print("\n" + "=" * 60)
        print("RESUMO DA IMPORTAÇÃO")
        print("=" * 60)
        print(f"✅ Registros adicionados: {registros_adicionados}")
        print(f"⚠️  Registros duplicados (não adicionados): {registros_duplicados}")
        print(f"❌ Registros com erro: {registros_erro}")
        print(f"📊 Total de registros na tabela: {total_registros}")
        print("=" * 60)
        
        conn.close()
        workbook.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante importação: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    sucesso = importar_cte_lancamento()
    sys.exit(0 if sucesso else 1)
