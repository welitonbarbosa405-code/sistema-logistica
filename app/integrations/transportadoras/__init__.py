from .carvalima import consulta as carvalima_consulta
from .rodonaves import consulta as rodonaves_consulta
from .minuano import consulta as minuano_consulta
from .sao_miguel import consulta as sao_miguel_consulta
from .transjoi import consulta as transjoi_consulta
from .brix_cargo import consulta as brix_cargo_consulta
from .atual import consulta as atual_consulta
from .princesa import consulta as princesa_consulta  # ADICIONADO

# Mapeamento de transportadoras para suas funções de consulta
TRANSPORTADORAS = {
    'Carvalima': carvalima_consulta,
    'Rodonaves': rodonaves_consulta,
    'Minuano': minuano_consulta,
    'Expresso São Miguel': sao_miguel_consulta,
    'Transjoi': transjoi_consulta,
    'Brix Cargo': brix_cargo_consulta,
    'Atual': atual_consulta,
    'Princesa dos Campos': princesa_consulta,  # ADICIONADO
}

def consultar_transportadora(transportadora: str, codigo: str):
    """
    Consulta uma transportadora específica
    
    Args:
        transportadora: Nome da transportadora
        codigo: Código de rastreamento (NF)
    
    Returns:
        Dict com informações do rastreamento ou None
    """
    if transportadora not in TRANSPORTADORAS:
        return None
    
    try:
        consulta_func = TRANSPORTADORAS[transportadora]
        return consulta_func(codigo)
    except Exception as e:
        print(f"Erro ao consultar {transportadora}: {e}")
        return None

def listar_transportadoras():
    """Retorna lista de transportadoras disponíveis"""
    return list(TRANSPORTADORAS.keys())
