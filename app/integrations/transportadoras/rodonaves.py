# scripts/api_clients/rodonaves.py
import os
import json
import time
import requests
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# =========================================================
# CONFIG
# =========================================================
RTE_AUTH_URL  = "https://customer-apigateway.rte.com.br/token"
RTE_TRACK_URL = "https://tracking-apigateway.rte.com.br/api/v1/tracking"

# credenciais (puxe de env ou deixe os defaults)
RTE_AUTH = {
    "auth_type":  os.getenv("RTE_AUTH_TYPE", "DEV"),
    "grant_type": "password",
    "username":   os.getenv("RTE_USER", "KUHNBRASIL"),
    "password":   os.getenv("RTE_PASS", "A1YN4KDT"),
}

RTE_CNPJ_EMITENTE = os.getenv("RTE_CNPJ", "01186305000100")
RTE_SERIE_FIXA    = os.getenv("RTE_SERIE", "1")

VERIFY_SSL = False
TIMEOUT    = 30

# Onde cachear o token (no mesmo diretório deste arquivo)
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_CACHE_FILE = os.path.join(_THIS_DIR, ".rte_token_cache.json")

# =========================================================
# HTTP / SESSION
# =========================================================
def _session() -> requests.Session:
    s = requests.Session()
    s.mount("https://", HTTPAdapter(max_retries=Retry(
        total=3, backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"]
    )))
    return s

# =========================================================
# TOKEN CACHE
# =========================================================
def _load_token_from_cache() -> Optional[Dict[str, Any]]:
    try:
        with open(TOKEN_CACHE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception:
        return None

def _save_token_to_cache(access_token: str, expires_at_epoch: float) -> None:
    try:
        with open(TOKEN_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump({"access_token": access_token, "expires_at": expires_at_epoch}, f)
    except Exception:
        pass

def _token_valid(cached: Dict[str, Any]) -> bool:
    try:
        # margem de 60s para evitar expirar no meio da chamada
        return float(cached.get("expires_at", 0.0)) - 60 > time.time()
    except Exception:
        return False

def _login_new_token() -> Optional[str]:
    s = _session()
    try:
        r = s.post(
            RTE_AUTH_URL,
            data=RTE_AUTH,
            headers={"content-type": "application/x-www-form-urlencoded"},
            timeout=TIMEOUT,
            verify=VERIFY_SSL,
        )
        if r.status_code != 200:
            return None
        js = r.json()
        access_token = js.get("access_token")
        if not access_token:
            return None
        # muitas APIs retornam expires_in em segundos; se não vier, assume 55 min
        expires_in = int(js.get("expires_in", 55 * 60))
        expires_at = time.time() + expires_in
        _save_token_to_cache(access_token, expires_at)
        return access_token
    except Exception:
        return None

def _get_token_smart(force_refresh: bool = False) -> Optional[str]:
    if not force_refresh:
        cached = _load_token_from_cache()
        if cached and _token_valid(cached):
            return cached.get("access_token")
    # sem cache ou expirado → login
    return _login_new_token()

# =========================================================
# HELPERS
# =========================================================
def _nf9(nf: str) -> str:
    digits = "".join(ch for ch in str(nf) if ch.isdigit())
    return digits.zfill(9)

def _iso_to_dt(s: str) -> Optional[datetime]:
    try:
        return datetime.fromisoformat((s or "").replace("Z", "+00:00"))
    except Exception:
        return None

def _fmt_br_dt(dt: Optional[datetime]) -> str:
    return dt.strftime("%d/%m/%Y %H:%M") if isinstance(dt, datetime) else ""

def _status_curto(descricao: str) -> str:
    t = (descricao or "").lower()
    if "entrega finalizada" in t or "entreg" in t:
        return "Entrega finalizada"
    if "em trânsito" in t or "em transito" in t:
        return "Em trânsito"
    if "recebida pela transportadora" in t or "mercadoria recebida" in t:
        return "Mercadoria recebida"
    if "colet" in t:
        return "Coletada"
    if "aguardando" in t or "pendente" in t:
        return "Aguardando"
    return (descricao or "").split(".")[0].strip()

def _first_event0_date(events: List[Dict[str, Any]]) -> Optional[datetime]:
    """
    Data-base = data do evento com EventCode == '0' mais antigo;
    se não existir '0', usa o evento MAIS ANTIGO no geral.
    """
    if not events:
        return None
    ev0 = [e for e in events if str(e.get("EventCode", "")).strip() == "0"]
    cand = ev0 if ev0 else events
    base_evt = min(cand, key=lambda e: _iso_to_dt(e.get("Date")) or datetime.max.replace(tzinfo=timezone.utc))
    return _iso_to_dt(base_evt.get("Date"))

# =========================================================
# CORE
# =========================================================
def _do_tracking_request(token: str, nf: str) -> Optional[Dict[str, Any]]:
    s = _session()
    headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}
    params  = {
        "InvoiceNumber": _nf9(nf),
        "TaxIdRegistration": RTE_CNPJ_EMITENTE,
        "DocumentSerie": RTE_SERIE_FIXA,
    }
    r = s.get(RTE_TRACK_URL, headers=headers, params=params, timeout=TIMEOUT, verify=VERIFY_SSL)
    if r.status_code == 200:
        return r.json()
    # se 401/403, força refresh e tenta 1x
    if r.status_code in (401, 403):
        new_token = _get_token_smart(force_refresh=True)
        if not new_token:
            return None
        headers["Authorization"] = f"Bearer {new_token}"
        r2 = s.get(RTE_TRACK_URL, headers=headers, params=params, timeout=TIMEOUT, verify=VERIFY_SSL)
        if r2.status_code == 200:
            return r2.json()
    return None

def consulta(nf: str) -> Optional[Dict[str, Any]]:
    """
    Consulta a Rodonaves (RTE) por NF e retorna:
    {
        "transportadora": "Rodonaves",
        "nf": "...",
        "status": "...",          # curto (ex.: "Em trânsito")
        "descricao": "...",       # completo
        "cidade_destino": "...",  # usando RecipientDescription
        "uf_destino": "",
        "previsao": "dd/mm/aaaa hh:mm"
    }
    ou None se não encontrou.
    """
    token = _get_token_smart()
    if not token:
        return None

    data = _do_tracking_request(token, nf)
    if not data:
        return None

    events = data.get("Events") or []

    # último evento para descrição
    last_evt = max(events, key=lambda e: _iso_to_dt(e.get("Date")) or datetime.min.replace(tzinfo=timezone.utc)) if events else None
    descricao = (last_evt.get("Description") or "").strip() if last_evt else ""
    status    = _status_curto(descricao)

    # previsão pela regra: primeiro evento 0 + ExpectedDeliveryDays
    previsao_txt = ""
    base_dt = _first_event0_date(events)
    try:
        dias_prev = int(data.get("ExpectedDeliveryDays")) if data.get("ExpectedDeliveryDays") not in (None, "") else None
    except Exception:
        dias_prev = None
    if base_dt and dias_prev is not None:
        previsao_txt = _fmt_br_dt(base_dt + timedelta(days=dias_prev))

    destino = (data.get("RecipientDescription") or "").upper()

    nf_raw = data.get("FiscalDocumentNumber") or data.get("InvoiceNumber") or str(nf)
    try:
        nf_fmt = str(int(nf_raw))
    except Exception:
        nf_fmt = nf_raw.lstrip("0") or nf_raw

    # Montar histórico completo com TODOS os eventos
    historico = []
    for evt in events:
        evt_date = _iso_to_dt(evt.get("Date"))
        historico.append({
            "data_hora": _fmt_br_dt(evt_date) if evt_date else "",
            "filial": evt.get("City") or "",
            "cidade": evt.get("City") or "",
            "ocorrencia": f"Código {evt.get('EventCode', '')}" if evt.get('EventCode') else "",
            "descricao": evt.get("Description") or "",
        })

    return {
        "transportadora": "Rodonaves",
        "nf": nf_fmt,
        "status": status,
        "descricao": descricao,
        "cidade_destino": destino,
        "uf_destino": "",
        "previsao": previsao_txt,
        "historico": historico,  # ✨ NOVO: Histórico completo
    }

# Execução direta de teste rápido:
if __name__ == "__main__":
    # ajuste aqui para testar isolado
    teste_nf = "207032"
    print(consulta(teste_nf))