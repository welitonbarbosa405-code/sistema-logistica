import os
import re
import json
import requests
import urllib3
from urllib3.exceptions import InsecureRequestWarning
import xml.etree.ElementTree as ET
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ========= CONFIG =========
SSW_CNPJ  = os.getenv("SSW_CNPJ",  "01186305000100")
SSW_SENHA = os.getenv("SSW_SENHA", "0118")

SSW_URLS = [
    "https://ssw.inf.br/api/tracking",      # endpoint principal
    "https://ssw.inf.br/api/trackingdest",  # fallback
]

VERIFY_SSL = False
TIMEOUT = 25
# Suprime aviso apenas se a verificação estiver desativada explicitamente
if not VERIFY_SSL:
    urllib3.disable_warnings(InsecureRequestWarning)

# ========= HELPERS =========
DESTINO_RE   = re.compile(r"Destino:\s*([A-Z]{2})\s*/\s*([A-ZÁÂÃÉÊÍÓÔÕÚÇ0-9\-\s]+)", re.I)
PREV_ENT_RE  = re.compile(r"Previs[aã]o de entrega:\s*(\d{2}/\d{2}/\d{2,4})", re.I)

def _session():
    s = requests.Session()
    s.mount("https://", HTTPAdapter(max_retries=Retry(
        total=3, backoff_factor=2,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"]
    )))
    return s

def _fmt_data(d: str) -> str:
    """Normaliza datas 'dd/mm/aa' -> 'dd/mm/AAAA' quando possível."""
    if not d:
        return ""
    d = d.strip()
    try:
        # tenta 2 dígitos no ano
        if len(d.split("/")[-1]) == 2:
            return datetime.strptime(d, "%d/%m/%y").strftime("%d/%m/%Y")
        # tenta 4 dígitos
        return datetime.strptime(d, "%d/%m/%Y").strftime("%d/%m/%Y")
    except Exception:
        return d  # devolve cru se não deu pra parsear

def _parse_ssw_response(text: str, content_type: str):
    """
    Normaliza resposta SSW (JSON ou XML) para:
    {
      'header': {'remetente','destinatario'},
      'items':  [ {'data_hora','filial','cidade','ocorrencia','descricao'} ]
    }
    """
    out = {"header": {}, "items": []}

    # JSON?
    if "json" in (content_type or "").lower():
        try:
            js = json.loads(text)
            if js.get("success") is True:
                out["header"] = {
                    "remetente": (js.get("header") or {}).get("remetente"),
                    "destinatario": (js.get("header") or {}).get("destinatario"),
                }
                trilha = js.get("tracking") or js.get("items") or []
                for it in trilha:
                    out["items"].append({
                        "data_hora":  it.get("data_hora") or it.get("data_hora_efetiva"),
                        "filial":     it.get("filial"),
                        "cidade":     it.get("cidade"),
                        "ocorrencia": it.get("ocorrencia"),
                        "descricao":  it.get("descricao"),
                    })
                return out
        except Exception:
            pass

    # XML?
    try:
        root = ET.fromstring(text)
        ok = (root.findtext(".//success") or "").strip().lower() == "true"
        if ok:
            out["header"] = {
                "remetente": root.findtext(".//header/remetente"),
                "destinatario": root.findtext(".//header/destinatario"),
            }
            for it in root.findall(".//items/item"):
                out["items"].append({
                    "data_hora":  it.findtext("data_hora") or it.findtext("data_hora_efetiva"),
                    "filial":     it.findtext("filial"),
                    "cidade":     it.findtext("cidade"),
                    "ocorrencia": it.findtext("ocorrencia"),
                    "descricao":  it.findtext("descricao"),
                })
            return out
    except Exception:
        pass

    return None

def _ssw_call(nf: str):
    """
    Tenta JSON e FORM nos dois endpoints SSW.
    Retorna dicionário normalizado por _parse_ssw_response ou None.
    """
    # NF sem pontos/espacos
    try:
        nro_nf = str(int(str(nf).strip()))
    except Exception:
        nro_nf = str(nf).strip()

    payload = {"cnpj": SSW_CNPJ, "senha": SSW_SENHA, "nro_nf": nro_nf}
    s = _session()

    for url in SSW_URLS:
        # JSON
        try:
            r = s.post(url, json=payload, headers={"Content-Type": "application/json"},
                       timeout=TIMEOUT, verify=VERIFY_SSL)
            if r.status_code == 200:
                parsed = _parse_ssw_response(r.text, r.headers.get("content-type", ""))
                if parsed and parsed.get("items"):
                    return parsed
        except Exception:
            pass
        # FORM (normalmente XML)
        try:
            r = s.post(url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"},
                       timeout=TIMEOUT, verify=VERIFY_SSL)
            if r.status_code == 200:
                parsed = _parse_ssw_response(r.text, r.headers.get("content-type", ""))
                if parsed and parsed.get("items"):
                    return parsed
        except Exception:
            pass

    return None

# ========= FUNÇÃO PRINCIPAL =========
def consulta_api_carvalhima(nf: str):
    """
    Consulta a Carvalima (SSW) e devolve dicionário padronizado:
    {
      'transportadora','nf','status','descricao',
      'cidade_destino','uf_destino','previsao',
      'historico': [{'data_hora', 'filial', 'cidade', 'ocorrencia', 'descricao'}]
    }
    """
    resp = _ssw_call(nf)
    if not resp or not resp.get("items"):
        return None

    items = resp["items"]
    ultima = items[-1]  # último evento
    status = (ultima.get("ocorrencia") or "").strip()
    descricao = (ultima.get("descricao") or "").strip()

    # Varre TODAS as descrições para achar destino e previsão
    uf_dest, cid_dest, prev_ent = "", "", ""
    for it in items:
        desc = it.get("descricao") or ""
        # Destino
        m = DESTINO_RE.search(desc)
        if m:
            uf_dest  = (m.group(1) or "").strip().upper()
            cid_dest = (m.group(2) or "").strip().upper()
        # Previsão de entrega
        p = PREV_ENT_RE.search(desc)
        if p:
            prev_ent = _fmt_data(p.group(1))

    # Montar histórico completo com TODOS os eventos
    historico = []
    for it in items:
        historico.append({
            "data_hora": it.get("data_hora") or "",
            "filial": it.get("filial") or "",
            "cidade": it.get("cidade") or "",
            "ocorrencia": it.get("ocorrencia") or "",
            "descricao": it.get("descricao") or "",
        })

    return {
        "transportadora": "Carvalima",
        "nf": str(nf),
        "status": status or "Sem status",
        "descricao": descricao,
        "cidade_destino": cid_dest,
        "uf_destino": uf_dest,
        "previsao": prev_ent,
        "historico": historico,  # ✨ NOVO: Histórico completo
    }


# Compatibilidade com main.py
def consulta(nf: str):
    return consulta_api_carvalhima(nf)