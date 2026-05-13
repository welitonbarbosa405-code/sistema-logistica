import os
import sys
import time
from dotenv import load_dotenv

# Adicionar o diretório raiz ao Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import CidadeAtendida

# ===================================================================
# Utilitários para logs coloridos
# ===================================================================
class Colors:
    """Códigos ANSI para cores no terminal"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    
    # Cores básicas
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # Cores brilhantes
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'

def log_header(text):
    """Imprime cabeçalho formatado"""
    separator = "=" * 70
    print(f"\n{Colors.BRIGHT_CYAN}{separator}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BRIGHT_WHITE}{text:^70}{Colors.RESET}")
    print(f"{Colors.BRIGHT_CYAN}{separator}{Colors.RESET}\n")

def log_success(text):
    """Imprime mensagem de sucesso"""
    print(f"{Colors.BRIGHT_GREEN}✓ {Colors.RESET}{Colors.GREEN}{text}{Colors.RESET}")

def log_info(text):
    """Imprime informação"""
    print(f"{Colors.BRIGHT_BLUE}ℹ {Colors.RESET}{Colors.BLUE}{text}{Colors.RESET}")

def log_warning(text):
    """Imprime aviso"""
    print(f"{Colors.BRIGHT_YELLOW}⚠ {Colors.RESET}{Colors.YELLOW}{text}{Colors.RESET}")

def log_error(text):
    """Imprime erro"""
    print(f"{Colors.BRIGHT_RED}✗ {Colors.RESET}{Colors.RED}{text}{Colors.RESET}")

def log_step(text):
    """Imprime passo do processo"""
    print(f"{Colors.BRIGHT_MAGENTA}→ {Colors.RESET}{Colors.MAGENTA}{text}{Colors.RESET}")

def format_number(num):
    """Formata número com separador de milhar"""
    return f"{num:,}".replace(",", ".")

def format_time(seconds):
    """Formata tempo em formato legível"""
    if seconds < 60:
        return f"{seconds:.2f}s"
    elif seconds < 3600:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}m {secs}s"
    else:
        hours = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours}h {mins}m {secs}s"

# ===================================================================
# Configuração
# ===================================================================
load_dotenv()

# ===================================================================
# Função principal
# ===================================================================
def limpar_cidades_atendidas():
    start_time = time.time()
    
    log_header("🗑️  LIMPEZA DA TABELA CIDADES ATENDIDAS")
    
    # Conecta ao app
    log_step("Conectando ao banco de dados...")
    app = create_app()
    
    with app.app_context():
        db.create_all()
        log_success("Conexão estabelecida com sucesso")
        
        # Contar registros antes
        log_step("Verificando registros existentes...")
        total_registros = CidadeAtendida.query.count()
        
        if total_registros == 0:
            log_warning("A tabela já está vazia. Nenhum registro para limpar.")
            return
        
        log_info(f"Total de registros encontrados: {Colors.BOLD}{Colors.BRIGHT_CYAN}{format_number(total_registros)}{Colors.RESET}")
        
        # Confirmação
        print(f"\n{Colors.BRIGHT_YELLOW}{'─' * 70}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BRIGHT_RED}⚠️  ATENÇÃO: Esta operação irá deletar TODOS os {format_number(total_registros)} registros!{Colors.RESET}")
        print(f"{Colors.BRIGHT_YELLOW}{'─' * 70}{Colors.RESET}\n")
        
        resposta = input(f"{Colors.BRIGHT_YELLOW}Deseja continuar? (digite 'SIM' para confirmar): {Colors.RESET}")
        
        if resposta.upper() != 'SIM':
            log_warning("Operação cancelada pelo usuário.")
            return
        
        # Limpar a tabela
        log_step("Removendo todos os registros...")
        delete_start = time.time()
        
        try:
            CidadeAtendida.query.delete()
            db.session.commit()
            
            delete_time = time.time() - delete_start
            
            # Verificar se foi limpo
            registros_restantes = CidadeAtendida.query.count()
            
            if registros_restantes == 0:
                log_success(f"Tabela limpa com sucesso em {format_time(delete_time)}")
                log_info(f"Total de registros removidos: {Colors.BOLD}{Colors.BRIGHT_GREEN}{format_number(total_registros)}{Colors.RESET}")
            else:
                log_error(f"Ainda existem {format_number(registros_restantes)} registro(s) na tabela!")
                
        except Exception as e:
            db.session.rollback()
            log_error(f"Erro ao limpar tabela: {e}")
            raise
        
        total_time = time.time() - start_time
        
        # Relatório final
        print()
        log_header("📊 RELATÓRIO FINAL")
        
        print(f"{Colors.BRIGHT_CYAN}{'━' * 70}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.BRIGHT_WHITE}ESTATÍSTICAS{Colors.RESET}")
        print(f"{Colors.BRIGHT_CYAN}{'━' * 70}{Colors.RESET}\n")
        
        print(f"{Colors.BRIGHT_GREEN}  ✓ Registros removidos:{Colors.RESET} {Colors.BOLD}{Colors.BRIGHT_GREEN}{format_number(total_registros):>12}{Colors.RESET}")
        print(f"{Colors.BLUE}  ⏱  Tempo total:{Colors.RESET}        {Colors.BOLD}{Colors.BRIGHT_BLUE}{format_time(total_time):>12}{Colors.RESET}")
        
        print()
        log_success("✅ Limpeza concluída com sucesso! A tabela está pronta para nova importação.")
        print()


# ===================================================================
# Execução direta
# ===================================================================
if __name__ == "__main__":
    try:
        limpar_cidades_atendidas()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.BRIGHT_YELLOW}Operação interrompida pelo usuário.{Colors.RESET}")
        sys.exit(0)
    except Exception as e:
        log_error(f"Erro inesperado na limpeza: {e}")
        import traceback
        print(f"\n{Colors.BRIGHT_RED}{'─' * 70}{Colors.RESET}")
        print(f"{Colors.BRIGHT_RED}DETALHES DO ERRO:{Colors.RESET}")
        print(f"{Colors.BRIGHT_RED}{'─' * 70}{Colors.RESET}")
        traceback.print_exc()
        sys.exit(1)

