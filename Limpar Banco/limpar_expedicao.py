# Script para limpar todos os dados da tabela expedição
from app import create_app
from app.models import Expedicao
from app.extensions import db

def limpar_tabela_expedicao():
    """Remove todos os registros da tabela expedição"""
    app = create_app()
    with app.app_context():
        print("=== LIMPEZA DA TABELA EXPEDICAO ===")
        print()
        
        # Contar registros antes da limpeza
        total_antes = Expedicao.query.count()
        print(f"Registros encontrados: {total_antes:,}")
        
        if total_antes == 0:
            print("Tabela já está vazia!")
            return
        
        # Confirmar ação
        print()
        print("⚠️  ATENÇÃO: Esta ação irá REMOVER TODOS os dados da tabela expedição!")
        print("Esta ação NÃO PODE ser desfeita!")
        print()
        
        confirmacao = input("Digite 'CONFIRMAR' para prosseguir: ")
        
        if confirmacao != 'CONFIRMAR':
            print("Operação cancelada pelo usuário.")
            return
        
        print()
        print("Removendo registros...")
        
        try:
            # Remover todos os registros
            Expedicao.query.delete()
            
            # Confirmar a transação
            db.session.commit()
            
            # Verificar se foi limpo
            total_depois = Expedicao.query.count()
            
            print(f"✅ Limpeza concluída!")
            print(f"Registros removidos: {total_antes:,}")
            print(f"Registros restantes: {total_depois:,}")
            
            if total_depois == 0:
                print("🎉 Tabela completamente limpa!")
            else:
                print("⚠️  Ainda restam registros na tabela.")
                
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erro durante a limpeza: {e}")
            print("Transação cancelada.")

def limpar_tabela_expedicao_forcado():
    """Remove todos os registros SEM confirmação (para uso em scripts)"""
    app = create_app()
    with app.app_context():
        print("=== LIMPEZA FORÇADA DA TABELA EXPEDICAO ===")
        
        total_antes = Expedicao.query.count()
        print(f"Registros encontrados: {total_antes:,}")
        
        if total_antes == 0:
            print("Tabela já está vazia!")
            return
        
        try:
            Expedicao.query.delete()
            db.session.commit()
            
            total_depois = Expedicao.query.count()
            print(f"✅ Limpeza concluída!")
            print(f"Registros removidos: {total_antes:,}")
            print(f"Registros restantes: {total_depois:,}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erro durante a limpeza: {e}")

if __name__ == "__main__":
    # Escolher o método
    print("Escolha o método de limpeza:")
    print("1. Limpeza com confirmação (recomendado)")
    print("2. Limpeza forçada (sem confirmação)")
    
    opcao = input("Digite 1 ou 2: ").strip()
    
    if opcao == "1":
        limpar_tabela_expedicao()
    elif opcao == "2":
        limpar_tabela_expedicao_forcado()
    else:
        print("Opção inválida!")
