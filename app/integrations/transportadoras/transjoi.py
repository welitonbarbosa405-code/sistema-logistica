# scripts/api_clients/transjoi.py
import os
import requests
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ====== CONFIG ======
TRANSJOI_URL = "https://quick.transjoi.com.br/api/rastreamento"

# Token da API (defina via variável de ambiente ou deixe o padrão abaixo)
TRANSJOI_TOKEN = os.getenv("TRANSJOI_TOKEN", "c87e366a5d42d47701c51b6faba7fa39")

# Defaults para consulta por NF
TRANSJOI_CNPJ_EMITENTE = os.getenv("TRANSJOI_CNPJ_EMITENTE", "01186305000100")
TRANSJOI_SERIE_NFE     = os.getenv("TRANSJOI_SERIE_NFE", "1")  # ajuste se sua série for 0

VERIFY_SSL = True
TIMEOUT    = 30
# AQUI ESTA LINHA REPRESENTA UMA FUNÇÃO  REQUEST
def _session():
    s = requests.Session()
    s.mount("https://", HTTPAdapter(max_retries=Retry(
        total=3, backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["POST"]
    )))
    return s

def _fmt_date_br(s: str) -> str:
    """Transjoi retorna 'YYYY-MM-DD' em alguns campos; converte para dd/mm/aaaa."""
    if not s:
        return ""
    try:
        return datetime.strptime(s, "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        return s  # já vem ok ou formato diferente

def _normalize_nf(nf: str) -> str:
    only_digits = "".join(ch for ch in str(nf) if ch.isdigit())
    try:
        return str(int(only_digits))  # remove zeros à esquerda
    except Exception:
        return only_digits or str(nf)

def _status_curto(texto: str) -> str:
    t = (texto or "").lower()
    if "entregue" in t or "entrega" in t and "realizada" in t:
        return "Entrega realizada"
    if "em trânsito" in t or "transito" in t or "embarque" in t:
        return "Em trânsito"
    if "coleta" in t:
        return "Coletada"
    if "prev" in t or "prazo" in t:
        return "Prevista/Programada"
    return (texto or "").split(".")[0].strip()

def _post(payload: dict):
    s = _session()
    headers = {
        "Content-Type": "application/json",
        "token": TRANSJOI_TOKEN,
    }
    r = s.post(TRANSJOI_URL, json=payload, headers=headers, timeout=TIMEOUT, verify=VERIFY_SSL)
    if r.status_code != 200:
        return None
    try:
        j = r.json()
    except Exception:
        return None
    # Alguns erros vêm como {"sucesso": false, "mensagem": "..."}; trate como None
    if isinstance(j, dict) and j.get("sucesso") is False:
        return None
    return j

def consulta_por_nf(nf: str, serie: str = None, cnpj_emitente: str = None):
    """
    Consulta por NF (preferencial).
    Campos aceitos pela doc:
      - nro_nfe, ser_nfe, cnpj_emi
    """
    serie = (serie or TRANSJOI_SERIE_NFE).strip()
    cnpj  = (cnpj_emitente or TRANSJOI_CNPJ_EMITENTE).strip()
    payload = {
        "nro_nfe": _normalize_nf(nf).zfill(6),  # alguns backends gostam com zeros; ajuste se precisar
        "ser_nfe": serie,
        "cnpj_emi": cnpj,
    }
    data = _post(payload)
    if not data or not isinstance(data, dict):
        return None

    # Campos principais (exemplo da doc)
    nf_resp   = data.get("numero_documento") or nf
    status    = data.get("status") or ""
    mensagem  = data.get("mensagem") or ""
    prazo     = _fmt_date_br(data.get("prazo"))
    destino   = (data.get("descricao_filial_destino") or "").upper()

    # Status curto + descrição
    status_curto = _status_curto(status or mensagem)
    descricao = status or mensagem

    # Montar histórico (Transjoi pode retornar lista de eventos em 'historico' ou 'tracking')
    historico = []
    eventos = data.get("historico") or data.get("tracking") or data.get("eventos") or []
    if isinstance(eventos, list):
        for evt in eventos:
            if isinstance(evt, dict):
                historico.append({
                    "data_hora": evt.get("data_hora") or evt.get("data") or "",
                    "filial": evt.get("filial") or evt.get("local") or "",
                    "cidade": evt.get("cidade") or evt.get("local") or "",
                    "ocorrencia": evt.get("tipo") or evt.get("status") or "",
                    "descricao": evt.get("descricao") or evt.get("mensagem") or str(evt),
                })

    return {
        "transportadora": "Transjoi",
        "nf": _normalize_nf(nf_resp),
        "status": status_curto,
        "descricao": descricao,
        "cidade_destino": destino,
        "uf_destino": "",
        "previsao": prazo,
        "historico": historico,  # ✨ NOVO: Histórico completo
    }

def consulta_por_documento(cod_filial: str, nro_doc: str, serie_doc: str):
    """
    Alternativa por documento (compatível com doc de exemplo).
    """
    payload = {
        "cod_filial": str(cod_filial),
        "nro_doc": str(nro_doc),
        "serie_doc": str(serie_doc),
    }
    data = _post(payload)
    if not data or not isinstance(data, dict):
        return None

    nf_resp   = data.get("numero_documento") or nro_doc
    status    = data.get("status") or ""
    mensagem  = data.get("mensagem") or ""
    prazo     = _fmt_date_br(data.get("prazo"))
    destino   = (data.get("descricao_filial_destino") or "").upper()

    status_curto = _status_curto(status or mensagem)
    descricao = status or mensagem

    # Montar histórico
    historico = []
    eventos = data.get("historico") or data.get("tracking") or data.get("eventos") or []
    if isinstance(eventos, list):
        for evt in eventos:
            if isinstance(evt, dict):
                historico.append({
                    "data_hora": evt.get("data_hora") or evt.get("data") or "",
                    "filial": evt.get("filial") or evt.get("local") or "",
                    "cidade": evt.get("cidade") or evt.get("local") or "",
                    "ocorrencia": evt.get("tipo") or evt.get("status") or "",
                    "descricao": evt.get("descricao") or evt.get("mensagem") or str(evt),
                })

    return {
        "transportadora": "Transjoi",
        "nf": _normalize_nf(nf_resp),
        "status": status_curto,
        "descricao": descricao,
        "cidade_destino": destino,
        "uf_destino": "",
        "previsao": prazo,
        "historico": historico,
    }

# Função padrão para o seu main.py usar em cascata:
def consulta(nf: str, serie: str = None):
    """
    Wrapper padrão do projeto: tenta por NF (nro_nfe/ser_nfe/cnpj_emi).
    Se quiser usar por documento, chame consulta_por_documento separadamente.
    """
    return consulta_por_nf(nf, serie=serie, cnpj_emitente=TRANSJOI_CNPJ_EMITENTE)

if __name__ == "__main__":
    # Teste rápido (vai retornar None se a combinação não existir)
    print(consulta("123456"))
    # print(consulta_por_documento("03", "001189635", "0"))