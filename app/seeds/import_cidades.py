import os
import sys
import re
import time
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

# Adicionar o diretório raiz ao Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import create_app
from app.extensions import db
from app.models import CidadeAtendida
from sqlalchemy import func

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

def print_progress_bar(current, total, bar_length=50):
    """Imprime barra de progresso visual"""
    if total == 0:
        return
    
    percent = (current / total) * 100
    filled = int(bar_length * current / total)
    bar = "█" * filled + "░" * (bar_length - filled)
    
    # Cor baseada no percentual
    if percent < 30:
        color = Colors.BRIGHT_RED
    elif percent < 70:
        color = Colors.BRIGHT_YELLOW
    else:
        color = Colors.BRIGHT_GREEN
    
    print(f"\r{color}[{bar}]{Colors.RESET} {color}{percent:.1f}%{Colors.RESET} ({format_number(current)}/{format_number(total)})", end="", flush=True)

# Mapeamento de estados para siglas
ESTADOS_MAP = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
    'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
    'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
    'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
    'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
}

# ===================================================================
# Configuração
# ===================================================================
load_dotenv()

EXCEL_PATH = r"K:\Parts\Logística\11- INDICADOR GLOBAL\11.1 -BASE INDICADORES GLOBAIS\11.1.2 - CIDADES ATENDIDAS\cidades_atendidas_PADRONIZADA.xlsx"

# ===================================================================
# Função principal
# ===================================================================
def importar_cidades():
    start_time = time.time()
    
    log_header("🚀 IMPORTAÇÃO DE CIDADES ATENDIDAS")
    
    # Verificação do arquivo
    log_step("Verificando arquivo Excel...")
    if not os.path.exists(EXCEL_PATH):
        log_error(f"Arquivo não encontrado: {EXCEL_PATH}")
        raise FileNotFoundError(f"Arquivo não encontrado: {EXCEL_PATH}")
    log_success(f"Arquivo encontrado: {os.path.basename(EXCEL_PATH)}")

    # Leitura do Excel
    log_step("Lendo arquivo Excel...")
    excel_start = time.time()
    df = pd.read_excel(EXCEL_PATH, dtype=str, engine="openpyxl").fillna("")
    excel_time = time.time() - excel_start
    log_success(f"Arquivo lido em {format_time(excel_time)}")

    # Normaliza nomes de colunas
    df.columns = [c.strip().lower() for c in df.columns]

    # Validação de colunas
    log_step("Validando estrutura do arquivo...")
    colunas_esperadas = [
        "transportadora",
        "cidade_origem",
        "cidade_destino",
        "estado_atendido",
        "prazo_entrega",
        "país"
    ]
    
    colunas_faltantes = [col for col in colunas_esperadas if col not in df.columns]
    if colunas_faltantes:
        log_error(f"Colunas obrigatórias ausentes: {', '.join(colunas_faltantes)}")
        raise ValueError(f"Colunas obrigatórias ausentes: {colunas_faltantes}")
    
    log_success(f"Todas as colunas obrigatórias encontradas")
    log_info(f"Colunas detectadas ({len(df.columns)}): {', '.join(df.columns[:5])}{'...' if len(df.columns) > 5 else ''}")

    # Limpeza e normalização
    log_step("Normalizando e limpando dados...")
    clean_start = time.time()
    
    df["transportadora"] = df["transportadora"].str.strip().str.title()
    df["cidade_origem"] = df["cidade_origem"].str.strip().str.upper()
    df["cidade_destino"] = df["cidade_destino"].str.strip().str.upper()
    df["estado_atendido"] = df["estado_atendido"].str.strip().str.title()
    df["estado_atendido"] = df["estado_atendido"].map(ESTADOS_MAP).fillna(df["estado_atendido"])
    df["país"] = df["país"].str.strip().str.title()
    
    if "obs" in df.columns:
        df["obs"] = df["obs"].str.strip()

    # Remove linhas inválidas
    df_before = len(df)
    df = df[(df["transportadora"] != "") & (df["cidade_destino"] != "")]
    df_after = len(df)
    linhas_removidas = df_before - df_after
    
    clean_time = time.time() - clean_start
    log_success(f"Dados normalizados em {format_time(clean_time)}")
    if linhas_removidas > 0:
        log_warning(f"{format_number(linhas_removidas)} linha(s) inválida(s) removida(s)")

    log_info(f"Total de registros válidos: {Colors.BOLD}{Colors.BRIGHT_CYAN}{format_number(df_after)}{Colors.RESET}")

    # Processo de importação
    log_step("Conectando ao banco de dados...")
    app = create_app()
    with app.app_context():
        db.create_all()
        log_success("Conexão estabelecida com sucesso")

        log_step("Iniciando importação...")
        log_info("Regra de duplicidade: mesma transportadora + cidade_origem + cidade_destino será ignorada")
        log_info("Verificando duplicatas no Excel e no banco de dados...")
        print()  # Linha em branco para a barra de progresso
        
        inseridos, ignorados, erros = 0, 0, 0
        total = len(df)
        process_start = time.time()
        
        # Verificar quantos registros já existem no banco
        total_no_banco = CidadeAtendida.query.count()
        if total_no_banco > 0:
            log_warning(f"Encontrados {format_number(total_no_banco)} registro(s) no banco. Esses serão considerados duplicatas.")
        
        # Set para rastrear combinações já processadas (evita duplicatas dentro do Excel)
        processadas = set()
        duplicatas_excel = []
        duplicatas_banco = []
        
        for idx, row in df.iterrows():
            try:
                # Usar dados já normalizados do DataFrame (não normalizar novamente)
                chave = (
                    str(row["transportadora"]).strip(),
                    str(row["cidade_origem"]).strip(),
                    str(row["cidade_destino"]).strip()
                )
                
                # Verificar se já processamos esta combinação no Excel
                if chave in processadas:
                    duplicatas_excel.append({
                        'linha': idx + 1,
                        'transportadora': chave[0],
                        'origem': chave[1],
                        'destino': chave[2]
                    })
                    ignorados += 1
                    continue
                
                # Verificar se já existe no banco de dados (usar func.upper para case-insensitive)
                existe = db.session.query(CidadeAtendida).filter(
                    func.upper(CidadeAtendida.transportadora) == chave[0].upper(),
                    func.upper(CidadeAtendida.cidade_origem) == chave[1].upper(),
                    func.upper(CidadeAtendida.cidade_destino) == chave[2].upper()
                ).first()

                if existe:
                    duplicatas_banco.append({
                        'linha': idx + 1,
                        'transportadora': chave[0],
                        'origem': chave[1],
                        'destino': chave[2]
                    })
                    processadas.add(chave)  # Adicionar ao set mesmo se já existe no banco
                    ignorados += 1
                else:
                    # Processar prazo_entrega
                    prazo_entrega = row["prazo_entrega"]
                    prazo_numerico = None
                    
                    if prazo_entrega and str(prazo_entrega).strip():
                        numeros = re.findall(r'\d+', str(prazo_entrega))
                        if numeros:
                            prazo_numerico = int(numeros[0])
                    
                    # Validar dados obrigatórios
                    if row["transportadora"] and row["cidade_origem"] and row["cidade_destino"]:
                        novo = CidadeAtendida(
                            transportadora=chave[0],
                            cidade_origem=chave[1],
                            cidade_destino=chave[2],
                            estado_atendido=row["estado_atendido"],
                            prazo_entrega=prazo_numerico,
                            pais=row["país"]
                        )
                        db.session.add(novo)
                        processadas.add(chave)  # Marcar como processada
                        inseridos += 1
                    else:
                        erros += 1
                    
            except Exception as e:
                erros += 1
                if erros <= 5:  # Mostrar apenas os primeiros 5 erros
                    log_error(f"Linha {idx + 1}: {str(e)[:100]}")
                continue
            
            # Atualizar barra de progresso a cada 100 registros ou no final
            processados = inseridos + ignorados + erros
            if processados % 100 == 0 or processados == total:
                print_progress_bar(processados, total)

        db.session.commit()
        process_time = time.time() - process_start
        
        print()  # Nova linha após a barra de progresso
        print()  # Espaço extra
        
        # Relatório de duplicatas (mostrar primeiras 10 de cada tipo)
        if duplicatas_excel or duplicatas_banco:
            if duplicatas_excel:
                log_info(f"Duplicatas encontradas dentro do Excel: {len(duplicatas_excel)}")
                if len(duplicatas_excel) <= 10:
                    for dup in duplicatas_excel:
                        log_warning(f"  Linha {dup['linha']}: {dup['transportadora']} | {dup['origem']} → {dup['destino']}")
                else:
                    for dup in duplicatas_excel[:5]:
                        log_warning(f"  Linha {dup['linha']}: {dup['transportadora']} | {dup['origem']} → {dup['destino']}")
                    log_info(f"  ... e mais {len(duplicatas_excel) - 5} duplicata(s) no Excel")
            
            if duplicatas_banco:
                log_info(f"Duplicatas encontradas no banco de dados: {len(duplicatas_banco)}")
                if len(duplicatas_banco) <= 10:
                    for dup in duplicatas_banco:
                        log_warning(f"  Linha {dup['linha']}: {dup['transportadora']} | {dup['origem']} → {dup['destino']}")
                else:
                    for dup in duplicatas_banco[:5]:
                        log_warning(f"  Linha {dup['linha']}: {dup['transportadora']} | {dup['origem']} → {dup['destino']}")
                    log_info(f"  ... e mais {len(duplicatas_banco) - 5} duplicata(s) no banco")
            
            print()

    # Relatório final
    total_time = time.time() - start_time
    
    log_header("📊 RELATÓRIO FINAL")
    
    # Estatísticas principais
    print(f"{Colors.BRIGHT_CYAN}{'━' * 70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BRIGHT_WHITE}ESTATÍSTICAS DE IMPORTAÇÃO{Colors.RESET}")
    print(f"{Colors.BRIGHT_CYAN}{'━' * 70}{Colors.RESET}\n")
    
    # Inseridos
    status_ins = Colors.BRIGHT_GREEN if inseridos > 0 else Colors.DIM
    print(f"{status_ins}  ✓ Inseridos:{Colors.RESET}        {Colors.BOLD}{Colors.BRIGHT_GREEN}{format_number(inseridos):>12}{Colors.RESET}")
    
    # Ignorados
    status_ign = Colors.BRIGHT_YELLOW if ignorados > 0 else Colors.DIM
    print(f"{status_ign}  ⊙ Ignorados:{Colors.RESET}        {Colors.BOLD}{Colors.BRIGHT_YELLOW}{format_number(ignorados):>12}{Colors.RESET}")
    if ignorados > 0:
        print(f"{Colors.DIM}     (duplicatas no Excel ou já existentes no banco){Colors.RESET}")
    
    # Erros
    status_err = Colors.BRIGHT_RED if erros > 0 else Colors.BRIGHT_GREEN
    print(f"{status_err}  ✗ Erros:{Colors.RESET}           {Colors.BOLD}{status_err}{format_number(erros):>12}{Colors.RESET}")
    
    print(f"\n{Colors.BRIGHT_CYAN}{'─' * 70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BRIGHT_WHITE}  Total Processado:{Colors.RESET} {Colors.BOLD}{Colors.BRIGHT_CYAN}{format_number(total):>12}{Colors.RESET}\n")
    
    # Tempo de execução
    print(f"{Colors.BRIGHT_CYAN}{'━' * 70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BRIGHT_WHITE}PERFORMANCE{Colors.RESET}")
    print(f"{Colors.BRIGHT_CYAN}{'━' * 70}{Colors.RESET}\n")
    
    print(f"{Colors.BLUE}  ⏱  Tempo total:{Colors.RESET}        {Colors.BOLD}{Colors.BRIGHT_BLUE}{format_time(total_time):>12}{Colors.RESET}")
    print(f"{Colors.BLUE}  ⚡ Tempo de processamento:{Colors.RESET} {Colors.BOLD}{Colors.BRIGHT_BLUE}{format_time(process_time):>12}{Colors.RESET}")
    
    if inseridos > 0:
        velocidade = inseridos / process_time if process_time > 0 else 0
        print(f"{Colors.BLUE}  🚀 Velocidade:{Colors.RESET}           {Colors.BOLD}{Colors.BRIGHT_BLUE}{format_number(int(velocidade)):>12} reg/s{Colors.RESET}")
    
    print()
    
    # Status final
    if erros == 0 and inseridos > 0:
        log_success(f"✅ Importação concluída com sucesso! {inseridos} novo(s) registro(s) adicionado(s).")
    elif erros == 0 and inseridos == 0:
        log_info("ℹ️  Nenhum novo registro. Base de dados já está atualizada.")
    else:
        log_warning(f"⚠️  Importação concluída com {erros} erro(s). Verifique os logs acima.")
    
    print()


# ===================================================================
# Execução direta
# ===================================================================
if __name__ == "__main__":
    try:
        importar_cidades()
    except FileNotFoundError as e:
        log_error(f"Arquivo não encontrado: {e}")
        sys.exit(1)
    except ValueError as e:
        log_error(f"Erro de validação: {e}")
        sys.exit(1)
    except Exception as e:
        log_error(f"Erro inesperado na importação: {e}")
        import traceback
        print(f"\n{Colors.BRIGHT_RED}{'─' * 70}{Colors.RESET}")
        print(f"{Colors.BRIGHT_RED}DETALHES DO ERRO:{Colors.RESET}")
        print(f"{Colors.BRIGHT_RED}{'─' * 70}{Colors.RESET}")
        traceback.print_exc()
        sys.exit(1)