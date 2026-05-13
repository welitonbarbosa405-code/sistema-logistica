# scripts/api_clients/minuano.py
import os
import requests
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ====== CONFIG ======
MINUANO_LOGIN_URL = "https://api.transminuano.com.br/endpoint/login"
MINUANO_TRACK_URL = "https://api.transminuano.com.br/endpoint/tracking"

# Credenciais fornecidas
MINUANO_CNPJ = os.getenv("MINUANO_CNPJ", "01186305000100")
MINUANO_USER = os.getenv("MINUANO_USER", "01186305")     # não é necessário no login, mas mantido
MINUANO_PASS = os.getenv("MINUANO_PASS", "372688")

MINUANO_SERIE = os.getenv("MINUANO_SERIE", "1")

VERIFY_SSL = True   # em prod: True. Se tiver erro de certificado em dev, troque para False
TIMEOUT    = 30

# Cache simples de token na própria memória do processo
_token_cache = {"value": None, "exp": datetime.min}

def _session():
    s = requests.Session()
    s.mount(
        "https://",
        HTTPAdapter(
            max_retries=Retry(
                total=3,
                backoff_factor=1.5,
                status_forcelist=[429, 500, 502, 503, 504],
                allowed_methods=["GET", "POST"],
            )
        ),
    )
    return s

def _status_curto(texto: str) -> str:
    t = (texto or "").lower()
    if "entrega" in t and ("realizada" in t or "entregue" in t):
        return "Entrega realizada"
    if "embar" in t or "em trânsito" in t or "em transito" in t:
        return "Em trânsito"
    if "coleta" in t:
        return "Coletada"
    if "prevista" in t or "previsão" in t or "previsao" in t:
        return "Prevista/Programada"
    return (texto or "").split(".")[0].strip()

def _get_token():
    """Devolve token válido do cache ou loga novamente."""
    global _token_cache
    now = datetime.utcnow()
    if _token_cache["value"] and _token_cache["exp"] > now:
        return _token_cache["value"]

    s = _session()
    r = s.post(
        MINUANO_LOGIN_URL,
        json={"wbu_cgc": MINUANO_CNPJ, "wbu_pwd": MINUANO_PASS},
        timeout=TIMEOUT,
        verify=VERIFY_SSL,
    )
    if r.status_code != 200:
        return None
    j = r.json()
    if not j.get("success"):
        return None

    tok = j.get("access_token")
    exp_secs = int(j.get("expires_in", 3600))
    # margem de segurança de 60s
    _token_cache = {"value": tok, "exp": now + timedelta(seconds=max(0, exp_secs - 60))}
    return tok

def _fetch_tracking(headers, nf: str, serie: str):
    """Tenta consultar com duas formas de NF (zerada e sem zeros). Retorna dict ou None."""
    s = _session()

    # 1) tentar com zeros (muitas APIs esperam 6 ou 9 dígitos padronizados)
    for nf_try in (str(nf).zfill(9), str(nf).zfill(6), str(int(nf))):
        params = {"nf": nf_try, "serie": str(serie)}
        r = s.get(MINUANO_TRACK_URL, headers=headers, params=params, timeout=TIMEOUT, verify=VERIFY_SSL)
        if r.status_code == 404:
            # registro não encontrado — tenta próximo formato
            continue
        if r.status_code != 200:
            # erro temporário — também tenta próximo formato
            continue
        data = r.json()
        if isinstance(data, dict) and not data.get("error") and data.get("nota"):
            return data
    return None

def consulta(nf: str, serie: str = MINUANO_SERIE):
    """
    Consulta o tracking da Minuano por NF e série.
    Retorna dicionário no padrão do main.py:
      {
        'transportadora', 'nf', 'status', 'descricao',
        'cidade_destino', 'uf_destino', 'previsao'
      }
    ou None se não encontrar.
    """
    token = _get_token()
    if not token:
        return None

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    data = _fetch_tracking(headers, nf, serie)
    if not data:
        return None

    # Campos principais
    nf_resp  = data.get("nota") or str(nf)
    previsao = data.get("previsao_entrega") or ""
    entrega  = data.get("data_entrega") or ""

    dest     = data.get("destinatario") or {}
    dest_cid = (dest.get("cidade") or "").upper()
    dest_uf  = (dest.get("estado") or "").upper()

    # Descrição / status
    descricao = ""
    ocorrs = data.get("ocorrencias") or []
    if isinstance(ocorrs, list) and ocorrs:
        last = ocorrs[-1]
        descricao = (last.get("descricao") or last.get("data") or "").strip()
    else:
        eventos = data.get("eventos") or []
        if isinstance(eventos, list) and eventos:
            descricao = str(eventos[0]).strip()

    status = _status_curto(descricao)

    # NF "bonita"
    try:
        nf_fmt = str(int(nf_resp))
    except Exception:
        nf_fmt = str(nf_resp).lstrip("0") or str(nf_resp)

    # Montar histórico completo
    historico = []
    if isinstance(ocorrs, list):
        for oc in ocorrs:
            historico.append({
                "data_hora": oc.get("data") or "",
                "filial": oc.get("local") or "",
                "cidade": oc.get("cidade") or "",
                "ocorrencia": oc.get("tipo") or "",
                "descricao": oc.get("descricao") or "",
            })

    return {
        "transportadora": "Minuano",
        "nf": nf_fmt,
        "status": status,
        "descricao": descricao,
        "cidade_destino": dest_cid,
        "uf_destino": dest_uf,
        "previsao": previsao or entrega,
        "historico": historico,  # ✨ NOVO: Histórico completo
    }

if __name__ == "__main__":
    # Teste rápido (sem NF real provavelmente retorna None)
    print(consulta("123456"))