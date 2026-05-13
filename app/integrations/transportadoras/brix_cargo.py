# -*- coding: utf-8 -*-
"""
Consulta de Ocorrências de NF-e - API BRIX CARGO (Brudam)
Autor: Weliton Barbosa
Data: 2025-11-13
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
import urllib3
from requests.adapters import HTTPAdapter
from urllib3.exceptions import InsecureRequestWarning
from urllib3.util.retry import Retry

# ===== CONFIGURAÇÕES =====
URL_LOGIN = "https://brix.brudam.com.br/api/v1/acesso/auth/login"
URL_TRACKING = "https://brix.brudam.com.br/api/v1/tracking/ocorrencias/cnpj/nf"
REQUEST_TIMEOUT = 30
VERIFY_SSL = False

# Credenciais (pode sobrescrever via variáveis de ambiente)
USUARIO = os.getenv("BRIX_USUARIO", "8c062cd34375066610a16a74ccdc9bc0")
SENHA = os.getenv("BRIX_SENHA", "3596ee0288834f7ff43ab1770fcadef17cd4b9d627bf7c2d708f1d44585baf62")

# CNPJs permitidos (aceita múltiplos separados por vírgula)
_CNPJS_DEFAULT = "01186305000100,01186305000526,01186305000607"
CNPJS_PADRAO = [
    cnpj.strip()
    for cnpj in os.getenv("BRIX_CNPJ_LISTA", os.getenv("BRIX_CNPJ_PADRAO", _CNPJS_DEFAULT)).split(",")
    if cnpj.strip()
]

# Desabilitar avisos de SSL quando verify=False
if not VERIFY_SSL:
    urllib3.disable_warnings(InsecureRequestWarning)


def _build_session() -> requests.Session:
    session = requests.Session()
    session.verify = VERIFY_SSL
    adapter = HTTPAdapter(max_retries=Retry(
        total=3,
        read=3,
        connect=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"]
    ))
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({"User-Agent": "KUHN-Rastreamento/1.0"})
    return session


SESSION = _build_session()


# ===== HELPERS =====
def _buscar_previsao_recursivo(obj: Any, profundidade: int = 0) -> Optional[str]:
    """Busca recursivamente por campos que possam conter previsão de entrega."""
    if profundidade > 5:  # Limitar profundidade para evitar loops
        return None
    
    # Palavras-chave que indicam previsão de entrega
    keywords = [
        'previsao', 'previsão', 'previsaoentrega', 'previsao_entrega',
        'dataprevista', 'data_prevista', 'dataprevisaoentrega',
        'dtprevisao', 'dt_previsao', 'prazoentrega', 'prazo_entrega',
        'estimativaentrega', 'estimativa_entrega', 'dataestimada',
        'entregaprevista', 'entrega_prevista', 'prazo', 'eta',
        'expecteddelivery', 'deliverydate', 'delivery_date'
    ]
    
    if isinstance(obj, dict):
        # Primeiro, buscar diretamente nas chaves
        for key, value in obj.items():
            key_lower = key.lower().replace('_', '').replace('-', '')
            if any(kw in key_lower for kw in keywords):
                if value and isinstance(value, str):
                    return value
                elif isinstance(value, (int, float)):
                    return str(value)
        
        # Se não encontrou, buscar recursivamente
        for key, value in obj.items():
            result = _buscar_previsao_recursivo(value, profundidade + 1)
            if result:
                return result
    
    elif isinstance(obj, list):
        for item in obj:
            result = _buscar_previsao_recursivo(item, profundidade + 1)
            if result:
                return result
    
    return None


def _formatar_data(valor: Optional[str]) -> str:
    if not valor:
        return ""

    valor = str(valor).strip()
    formatos = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
    ]

    for fmt in formatos:
        try:
            return datetime.strptime(valor, fmt).strftime("%d/%m/%Y %H:%M")
        except ValueError:
            continue

    try:
        # último recurso: tratar timestamps ISO com timezone
        return datetime.fromisoformat(valor.replace("Z", "+00:00")).strftime("%d/%m/%Y %H:%M")
    except Exception:
        return valor


def _normalizar_status(status: Optional[str]) -> str:
    if status is None:
        return "Status não disponível"

    if not isinstance(status, str):
        status = str(status)

    status_limpo = status.strip().upper()
    mapeamento = {
        "COLETADO": "Coletado",
        "COLETA": "Coletado",
        "EM TRÂNSITO": "Em trânsito",
        "EM TRANSITO": "Em trânsito",
        "TRANSITO": "Em trânsito",
        "ENTREGUE": "Entregue",
        "ENTREGA": "Entregue",
        "PENDENTE": "Pendente",
        "PROBLEMA": "Problema",
        "DEVOLVIDO": "Devolvido",
    }
    return mapeamento.get(status_limpo, status.title())


def _normalizar_lista_ocorrencias(valor: Any) -> List[Dict[str, Any]]:
    if isinstance(valor, list):
        return valor
    if isinstance(valor, dict):
        if "items" in valor and isinstance(valor["items"], list):
            return valor["items"]
        return list(valor.values())
    if valor:
        return [valor]
    return []


def _extrair_payload(data: Any) -> Dict[str, Any]:
    payload = data
    if isinstance(payload, dict) and "data" in payload:
        payload = payload["data"]
    if isinstance(payload, list):
        return payload[0] if payload else {}
    if isinstance(payload, dict) and "resultado" in payload and isinstance(payload["resultado"], list):
        return payload["resultado"][0] if payload["resultado"] else {}
    return payload if isinstance(payload, dict) else {}


def _montar_evento(ocorrencia: Dict[str, Any]) -> Dict[str, str]:
    data_ocorrencia = (
        ocorrencia.get("dataHoraOcorrencia")
        or ocorrencia.get("data_ocorrencia")
        or ocorrencia.get("dataHora")
        or ocorrencia.get("data")
    )
    cidade = (
        ocorrencia.get("cidade")
        or ocorrencia.get("municipio")
        or (ocorrencia.get("unidade", {}) or {}).get("cidade")
    )
    filial = ocorrencia.get("filial") or ocorrencia.get("local") or ocorrencia.get("unidade")

    return {
        "data_hora": _formatar_data(data_ocorrencia),
        "filial": filial if isinstance(filial, str) else "",
        "cidade": cidade if isinstance(cidade, str) else "",
        "ocorrencia": ocorrencia.get("status") or ocorrencia.get("tipo") or "",
        "descricao": ocorrencia.get("descricao") or ocorrencia.get("descricaoOcorrencia") or ocorrencia.get("mensagem") or "",
    }


def _normalizar_resultado(payload: Dict[str, Any], numero_nf: str) -> Optional[Dict[str, Any]]:
    if not payload:
        return None

    ocorrencias_raw = (
        payload.get("ocorrencias")
        or payload.get("historico")
        or payload.get("tracking")
        or payload.get("eventos")
        or payload.get("dados")
        or payload.get("listaOcorrencias")
        or payload.get("lista_ocorrencias")
        or []
    )
    ocorrencias = _normalizar_lista_ocorrencias(ocorrencias_raw)
    historico = [_montar_evento(evt) for evt in ocorrencias if isinstance(evt, dict)]

    # Pegar o primeiro evento (mais recente) já que a API retorna em ordem decrescente
    primeira = ocorrencias[0] if ocorrencias else None
    
    # Pegar status da descrição do evento mais recente (não do código numérico)
    status_raw = None
    if primeira:
        status_raw = primeira.get("descricao") or primeira.get("status") or primeira.get("descricaoOcorrencia")
    status_raw = status_raw or payload.get("descricao") or payload.get("status") or payload.get("situacao")
    
    descricao = (
        (primeira.get("descricao") if primeira else None)
        or (primeira.get("descricaoOcorrencia") if primeira else None)
        or status_raw
        or ""
    )

    destino = payload.get("destino") or payload.get("destinatario") or {}
    
    # Para Brix, a cidade/razão do destinatário vem nos eventos
    cidade_destino = (
        destino.get("cidade")
        or payload.get("cidade_destino")
        or payload.get("cidadeDestino")
        or payload.get("municipioDestino")
        or payload.get("municipio_destino")
        or (primeira.get("razao_destinatario") if primeira else "")
        or ""
    )
    uf_destino = (
        destino.get("uf")
        or payload.get("uf_destino")
        or payload.get("ufDestino")
        or destino.get("estado")
        or payload.get("estadoDestino")
        or ""
    )

    # Buscar previsão em múltiplos campos possíveis (incluindo prev_entrega da Brix)
    previsao_raw = (
        payload.get("prev_entrega")  # Campo específico da API Brix!
        or payload.get("previsao_entrega")
        or payload.get("previsaoEntrega")
        or payload.get("previsao")
        or payload.get("dataPrevistaEntrega")
        or payload.get("data_prevista_entrega")
        or payload.get("dataPrevisaoEntrega")
        or payload.get("dtPrevisaoEntrega")
        or payload.get("dt_previsao_entrega")
        or payload.get("prazoEntrega")
        or payload.get("prazo_entrega")
        or payload.get("estimativaEntrega")
        or payload.get("estimativa_entrega")
        or destino.get("previsao")
        or destino.get("previsaoEntrega")
        or destino.get("data_prevista")
        or (primeira.get("data_entrega") if primeira else None)
        or (primeira.get("dataEntrega") if primeira else None)
        or (primeira.get("previsao") if primeira else None)
        or (primeira.get("previsaoEntrega") if primeira else None)
    )
      # Se não encontrou nos campos conhecidos, fazer busca recursiva
    if not previsao_raw:
        previsao_raw = _buscar_previsao_recursivo(payload)
    
    previsao = _formatar_data(previsao_raw)

    numero_formatado = (
        payload.get("numero_nf")
        or payload.get("numero")
        or payload.get("nf")
        or payload.get("numeroNF")
        or payload.get("notaFiscal")
        or (primeira.get("nf_numero") if primeira else None)
        or numero_nf
    )

    return {
        "transportadora": "Brix Cargo",
        "nf": str(numero_formatado),
        "status": _normalizar_status(status_raw),
        "descricao": descricao.strip() if isinstance(descricao, str) else "",
        "cidade_destino": (cidade_destino or "").upper(),
        "uf_destino": (uf_destino or "").upper(),
        "previsao": previsao,
        "historico": historico,
    }


# ===== FUNÇÕES PRINCIPAIS =====
def obter_token_jwt() -> Optional[str]:
    """Realiza login na API BRIX e retorna o token JWT."""
    payload = {"usuario": USUARIO, "senha": SENHA}
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
    }

    try:
        response = SESSION.post(URL_LOGIN, headers=headers, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"Erro ao autenticar na BRIX: {exc}")
        return None

    try:
        data = response.json()
    except ValueError:
        print("Resposta inválida ao obter token BRIX.")
        return None

    token = (data.get("data") or {}).get("access_key") or data.get("access_key")
    if not token:
        print("Token BRIX não encontrado na resposta.")
    return token


def consultar_tracking_nfe(token: str, cnpj: str, numero_nf: str, comprovante: int = 0) -> Optional[Dict[str, Any]]:
    """Consulta o rastreamento de uma NF-e usando CNPJ + número da nota e retorna o payload bruto."""
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {token}",
    }

    params = {
        "documento": cnpj,
        "numero": numero_nf,
        "comprovante": comprovante,
    }

    try:
        response = SESSION.get(URL_TRACKING, headers=headers, params=params, timeout=REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        print(f"Erro na consulta BRIX ({numero_nf}): {exc}")
        return None

    if response.status_code == 200:
        try:
            data = response.json()
        except ValueError:
            print("Resposta inválida da API BRIX ao consultar tracking.")
            return None
        return _extrair_payload(data)

    if response.status_code == 401:
        print("Token BRIX expirado ou inválido.")
    elif response.status_code == 404:
        print("Nota fiscal não encontrada na BRIX.")
    else:
        print(f"Erro ao consultar BRIX ({response.status_code}): {response.text}")
    return None


def consulta(numero_nf: str, cnpj: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Consulta pública utilizada pelo sistema de rastreamento.

    Args:
        numero_nf: Número da nota fiscal (string ou apenas dígitos).
        cnpj: Opcional - CNPJ a ser usado na consulta.

    Returns:
        Dicionário padronizado ou None se não encontrado.
    """
    numero_nf = (numero_nf or "").strip()
    if not numero_nf:
        return None

    token = obter_token_jwt()
    if not token:
        return None

    cnpjs_para_teste = [cnpj.strip()] if cnpj else CNPJS_PADRAO

    for cnpj_atual in cnpjs_para_teste:
        payload = consultar_tracking_nfe(token, cnpj_atual, numero_nf)
        if payload:
            resultado = _normalizar_resultado(payload, numero_nf)
            if resultado:
                resultado["cnpj_consultado"] = cnpj_atual
                return resultado

    return None


# ===== PROGRAMA PRINCIPAL (CLI) =====
def main():
    print("=" * 60)
    print("BRIX CARGO - CONSULTA DE RASTREAMENTO")
    print("Data/Hora:", datetime.now().strftime("%d/%m/%Y %H:%M"))
    print("=" * 60)

    numero_nf = input("Digite o número da NF (apenas números): ").strip()
    if not numero_nf.isdigit():
        print("Número da NF é obrigatório e deve conter apenas dígitos.")
        return

    resultado = consulta(numero_nf)
    if not resultado:
        print("NF não encontrada ou erro na consulta.")
        return

    print(json.dumps(resultado, indent=4, ensure_ascii=False))


if __name__ == "__main__":
    main()