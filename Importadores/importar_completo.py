"""
Script Unificado de Importação e Atualização de Expedições
Executa importação de novas NFs e atualização de dados faltantes
"""

import os
import sys
import subprocess
from datetime import datetime

def print_header(texto, simbolo="="):
    """Imprime cabeçalho formatado"""
    linha = simbolo * 60
    print(f"\n{linha}")
    print(f"  {texto}")
    print(linha)

def executar_script(script_name, descricao):
    """Executa um script Python e retorna o resultado"""
    print(f"\n⏳ {descricao}...")
    print("-" * 40)
    
    try:
        # Executar o script
        resultado = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True
        )
        
        # Mostrar output
        if resultado.stdout:
            print(resultado.stdout)
        
        if resultado.returncode == 0:
            print(f"✅ {descricao} - CONCLUÍDO COM SUCESSO!")
            return True
        else:
            print(f"❌ {descricao} - ERRO!")
            if resultado.stderr:
                print(f"Detalhes do erro: {resultado.stderr}")
            return False
            
    except FileNotFoundError:
        print(f"❌ Erro: Script '{script_name}' não encontrado!")
        return False
    except Exception as e:
        print(f"❌ Erro ao executar {script_name}: {e}")
        return False

def main():
    """Função principal"""
    
    # Cabeçalho
    print_header("SISTEMA DE IMPORTAÇÃO E ATUALIZAÇÃO DE EXPEDIÇÕES", "=")
    print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    
    # Verificar se estamos na pasta correta
    if not os.path.exists('instance/app.db'):
        print("\n⚠️  AVISO: Banco de dados não encontrado!")
        print("    Certifique-se de estar na pasta correta do projeto.")
        resposta = input("\nContinuar mesmo assim? (s/n): ")
        if resposta.lower() != 's':
            print("Operação cancelada.")
            return
    
    # Verificar se os arquivos Excel existem
    pasta_base = 'base'
    if not os.path.exists(pasta_base):
        print(f"\n❌ ERRO: Pasta '{pasta_base}' não encontrada!")
        return
    
    arquivos_excel = [f for f in os.listdir(pasta_base) if f.endswith(('.xlsx', '.xls'))]
    if not arquivos_excel:
        print(f"\n❌ ERRO: Nenhum arquivo Excel encontrado na pasta '{pasta_base}'!")
        return
    
    print(f"\n📁 Arquivos Excel encontrados:")
    for arquivo in arquivos_excel:
        tamanho = os.path.getsize(os.path.join(pasta_base, arquivo)) / 1024 / 1024
        print(f"   • {arquivo} ({tamanho:.1f} MB)")
    
    # Etapa 1: Importar novas notas
    print_header("ETAPA 1: IMPORTAÇÃO DE NOVAS NOTAS", "-")
    sucesso_importacao = executar_script(
        "import_expedicao.py",
        "Importando novas notas fiscais"
    )
    
    if not sucesso_importacao:
        print("\n⚠️  Importação falhou, mas continuando com atualização...")
    
    # Pequena pausa entre processos
    import time
    time.sleep(2)
    
    # Etapa 2: Atualizar dados faltantes
    print_header("ETAPA 2: ATUALIZAÇÃO DE DADOS FALTANTES", "-")
    sucesso_atualizacao = executar_script(
        "atualizar_nfs.py",
        "Atualizando transportadora e datas de expedição"
    )
    
    # Resumo final
    print_header("RESUMO DO PROCESSO", "=")
    
    if sucesso_importacao and sucesso_atualizacao:
        print("✅ PROCESSO CONCLUÍDO COM SUCESSO!")
        print("   • Novas notas importadas")
        print("   • Dados faltantes atualizados")
    elif sucesso_importacao:
        print("⚠️  PROCESSO PARCIALMENTE CONCLUÍDO")
        print("   • Novas notas importadas ✅")
        print("   • Atualização de dados falhou ❌")
    elif sucesso_atualizacao:
        print("⚠️  PROCESSO PARCIALMENTE CONCLUÍDO")
        print("   • Importação de novas notas falhou ❌")
        print("   • Dados faltantes atualizados ✅")
    else:
        print("❌ PROCESSO FALHOU")
        print("   • Verifique os erros acima")
        print("   • Tente executar os scripts individualmente")
    
    print("\n" + "=" * 60)
    input("\nPressione ENTER para sair...")

if __name__ == "__main__":
    main()
