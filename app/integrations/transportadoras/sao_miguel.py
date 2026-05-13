# scripts/api_clients/sao_miguel.py
import requests
import urllib3
from urllib3.exceptions import InsecureRequestWarning
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ========= CONFIG =========
SM_URL = "https://wsintegcli02.expressosaomiguel.com.br:40504/wsservernet/api/tracking"
SM_SERIE_FIXA = "1"
SM_CREDENCIAIS = {
    "01186305000100": {"customer": "01186305000100", "access_key": "FFADBFFA95FA491AB4E2BA88C8BDD577"},
    "01186305000526": {"customer": "01186305000526", "access_key": "5691CB6B295746FD88BEE4B3EA2872B1"},
    "01186305000607": {"customer": "01186305000607", "access_key": "EC94820E90514DBEBC50D12D030A1113"},
}

TIMEOUT = 25
VERIFY_SSL = False
# Suprime aviso apenas se a verificação estiver desativada explicitamente
if not VERIFY_SSL:
    urllib3.disable_warnings(InsecureRequestWarning)
VERIFY_SSL = False


# ========= HELPERS =========
def _session():
    s = requests.Session()
    s.mount("https://", HTTPAdapter(
        max_retries=Retry(
            total=3,
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST"]
        )
    ))
    return s


def _fmt_data(data_str: str) -> str:
    if not data_str:
        return ""
    try:
        return datetime.strptime(data_str[:10], "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        return data_str


# ========= FUNÇÃO PRINCIPAL =========
def consulta_api_sao_miguel(nf: str):
    """
    Consulta a API da São Miguel e retorna dicionário padronizado.
    """
    s = _session()

    for cnpj, cred in SM_CREDENCIAIS.items():
        headers = {
            "Content-Type": "application/json",
            "Access_Key": cred["access_key"],
            "Customer": cred["customer"],
            "Modelo_Consulta": "TRACKING_COMPLETO_POR_NOTA_FISCAL_E_COMPROVANTE"
        }
        body = {"valoresParametros": [cnpj, str(nf), SM_SERIE_FIXA]}

        try:
            r = s.post(SM_URL, headers=headers, json=body, timeout=TIMEOUT, verify=VERIFY_SSL)
            if r.status_code != 200:
                continue

            data = r.json()
            if not isinstance(data, list) or not data:
                continue

            doc = data[0]
            ocorr = doc.get("ocorrencias") or []
            ultima_desc = (ocorr[-1].get("descricaoOcorrencia") if ocorr else "") or ""

            cidade_dest = (doc.get("unidadeDestino", {}) or {}).get("cidade", {}).get("nome", "")
            uf_dest = (doc.get("unidadeDestino", {}) or {}).get("cidade", {}).get("uf", "")

            # Montar histórico completo com TODAS as ocorrências
            historico = []
            for oc in ocorr:
                historico.append({
                    "data_hora": oc.get("dataHoraOcorrencia") or "",
                    "filial": oc.get("unidade", {}).get("nome", "") if isinstance(oc.get("unidade"), dict) else "",
                    "cidade": oc.get("unidade", {}).get("cidade", {}).get("nome", "") if isinstance(oc.get("unidade"), dict) else "",
                    "ocorrencia": oc.get("tipoOcorrencia", {}).get("nome", "") if isinstance(oc.get("tipoOcorrencia"), dict) else "",
                    "descricao": oc.get("descricaoOcorrencia") or "",
                })

            return {
                "transportadora": "Expresso São Miguel",
                "nf": str(nf),
                "status": ultima_desc.strip(),
                "descricao": ultima_desc.strip(),
                "cidade_destino": (cidade_dest or "").upper(),
                "uf_destino": (uf_dest or "").upper(),
                "previsao": _fmt_data(doc.get("prevEntrega")),
                "historico": historico,  # ✨ NOVO: Histórico completo
            }

        except Exception as e:
            print(f"⚠️ Erro consulta São Miguel ({cnpj}): {e}")
            continue

    return None


# Compatibilidade com main.py: expõe a função com o nome esperado
def consulta(nf: str):
    return consulta_api_sao_miguel(nf)