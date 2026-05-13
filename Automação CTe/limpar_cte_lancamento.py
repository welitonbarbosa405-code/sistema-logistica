# -*- coding: utf-8 -*-
"""
Script para limpar a tabela cte_lancamento do banco de dados
"""

import sqlite3
import sys
import os

def limpar_cte_lancamento():
    """Limpa todos os registros da tabela cte_lancamento"""
    
    db_path = r"C:\Users\kmbwba\Desktop\15- Projeto Web\instance\app.db"
    
    print("=" * 60)
    print("LIMPEZA DA TABELA CTE_LANCAMENTO")
    print("=" * 60)
    
    try:
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
        
        # Contar registros antes de limpar
        cursor.execute("SELECT COUNT(*) FROM cte_lancamento")
        total_antes = cursor.fetchone()[0]
        
        print(f"\n📊 Registros na tabela: {total_antes}")
        
        if total_antes == 0:
            print("\n⏭️  A tabela já está vazia!")
            conn.close()
            return True
        
        # Confirmação
        print("\n⚠️  ATENÇÃO! Você está prestes a DELETAR todos os registros!")
        confirmacao = input("Digite 'SIM' para confirmar a limpeza: ").strip().upper()
        
        if confirmacao != 'SIM':
            print("❌ Operação cancelada!")
            conn.close()
            return False
        
        # Deletar todos os registros
        print("\n🗑️  Deletando registros...")
        cursor.execute("DELETE FROM cte_lancamento")
        conn.commit()
        
        # Contar registros após limpeza
        cursor.execute("SELECT COUNT(*) FROM cte_lancamento")
        total_depois = cursor.fetchone()[0]
        
        # Resumo
        print("\n" + "=" * 60)
        print("RESUMO DA LIMPEZA")
        print("=" * 60)
        print(f"✅ Registros deletados: {total_antes}")
        print(f"📊 Total de registros agora: {total_depois}")
        print("=" * 60)
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro durante limpeza: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    sucesso = limpar_cte_lancamento()
    sys.exit(0 if sucesso else 1)
