# -*- coding: utf-8 -*-
"""
Script para sincronizar o status_cte da tabela lancamento_fiscal
baseado nos dados de cte_lancamento
"""

import sqlite3
import sys
import os

def sincronizar_status_cte():
    """Sincroniza status_cte da tabela lancamento_fiscal com base em cte_lancamento"""
    
    db_path = r"C:\Users\kmbwba\Desktop\15- Projeto Web\instance\app.db"
    
    print("=" * 70)
    print("SINCRONIZAÇÃO DE STATUS CTe")
    print("=" * 70)
    
    try:
        # Conectar ao banco de dados
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se as tabelas existem
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='cte_lancamento'
        """)
        if not cursor.fetchone():
            print("❌ Tabela 'cte_lancamento' não existe no banco!")
            return False
        
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='lancamento_fiscal'
        """)
        if not cursor.fetchone():
            print("❌ Tabela 'lancamento_fiscal' não existe no banco!")
            return False
        
        print("✅ Tabelas encontradas\n")
        
        # Contar registros antes
        cursor.execute("SELECT COUNT(*) FROM lancamento_fiscal")
        total_registros = cursor.fetchone()[0]
        print(f"📊 Total de registros em lancamento_fiscal: {total_registros}\n")
        
        # Passo 1: Atualizar registros que têm lançamento (LANÇADO)
        print("🔄 Passo 1: Marcando CTes com lançamento como 'Lançado'...")
        cursor.execute("""
            UPDATE lancamento_fiscal
            SET status_cte = 'Lançado'
            WHERE numero_cte IN (
                SELECT numero_nf FROM cte_lancamento
                WHERE numero_nf IS NOT NULL AND numero_nf != ''
                AND data_lancamento IS NOT NULL AND data_lancamento != ''
            )
        """)
        atualizados_lancado = cursor.rowcount
        print(f"   ✅ {atualizados_lancado} registro(s) marcado(s) como 'Lançado'\n")
          # Passo 2: Atualizar registros que NÃO têm lançamento (FALTA LANÇAMENTO)
        print("🔄 Passo 2: Marcando CTes sem lançamento como 'Falta Lançamento'...")
        cursor.execute("""
            UPDATE lancamento_fiscal
            SET status_cte = 'Falta Lançamento'
            WHERE numero_cte NOT IN (
                SELECT numero_nf FROM cte_lancamento
                WHERE numero_nf IS NOT NULL AND numero_nf != ''
            )
            AND (status_cte IS NULL OR status_cte = '')
        """)
        atualizados_falta = cursor.rowcount
        print(f"   ✅ {atualizados_falta} registro(s) marcado(s) como 'Falta Lançamento'\n")
        
        # Commit das alterações
        conn.commit()
        
        # Resumo dos status
        print("=" * 70)
        print("RESUMO DOS STATUS")
        print("=" * 70)
        
        cursor.execute("""
            SELECT status_cte, COUNT(*) 
            FROM lancamento_fiscal 
            GROUP BY status_cte
            ORDER BY status_cte
        """)
        
        for status, count in cursor.fetchall():
            status_display = status or 'Sem Status'
            print(f"   {status_display}: {count}")
        
        print("=" * 70)
        print(f"✅ Sincronização concluída com sucesso!")
        print(f"   Total atualizado: {atualizados_lancado + atualizados_falta}")
        print("=" * 70)
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro durante sincronização: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    sucesso = sincronizar_status_cte()
    sys.exit(0 if sucesso else 1)
