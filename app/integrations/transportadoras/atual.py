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
# ATUAL CARGA - Credenciais
CNPJ_PAGADOR = os.getenv("CNPJ_PAGADOR", "01186305000100")
CNPJ_REMETENTE = os.getenv("CNPJ_REMETENTE", "01186305000798")
SENHA_PADRAO = os.getenv("SENHA_PADRAO", "01186305")

# URLs dos endpoints (escolher conforme tipo de CNPJ)
URL_TRACKING_REMETENTE = "https://ssw.inf.br/api/tracking"
URL_TRACKING_DESTINATARIO = "https://ssw.inf.br/api/trackingdest"
URL_TRACKING_PAGADOR = "https://ssw.inf.br/api/trackingpag"

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

def _api_call(nf: str, url: str, cnpj: str, senha: str):
    """
    Função genérica para chamar API SSW.
    Tenta JSON e FORM no endpoint fornecido.
    Retorna dicionário normalizado por _parse_ssw_response ou None.
    """
    # NF sem pontos/espacos
    try:
        nro_nf = str(int(str(nf).strip()))
    except Exception:
        nro_nf = str(nf).strip()

    payload = {"cnpj": cnpj, "senha": senha, "nro_nf": nro_nf}
    s = _session()

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

def _processar_resposta(resp, transportadora: str, nf: str):
    """
    Processa resposta da API e monta dicionário padronizado.
    """
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
        "transportadora": transportadora,
        "nf": str(nf),
        "status": status or "Sem status",
        "descricao": descricao,
        "cidade_destino": cid_dest,
        "uf_destino": uf_dest,
        "previsao": prev_ent,
        "historico": historico,
    }

def consulta_api_atual(nf: str, tipo: str = "pagador", cnpj: str = None):
    """
    Consulta a Atual Carga e devolve dicionário padronizado.
    
    Args:
        nf (str): Número da nota fiscal (ou pedido, chave Danfe, coleta)
        tipo (str): 'remetente', 'destinatario' ou 'pagador' (padrão: 'pagador')
        cnpj (str): CNPJ customizado (opcional, usa padrão do tipo se não fornecido)
    
    Returns:
        dict: Dicionário com informações do rastreamento ou None
    """
    # Escolher URL baseado no tipo
    urls_map = {
        "remetente": URL_TRACKING_REMETENTE,
        "destinatario": URL_TRACKING_DESTINATARIO,
        "pagador": URL_TRACKING_PAGADOR,
    }
    
    # Escolher CNPJ baseado no tipo (se não fornecido)
    cnpj_map = {
        "remetente": CNPJ_REMETENTE,
        "destinatario": CNPJ_PAGADOR,  # usar pagador por padrão
        "pagador": CNPJ_PAGADOR,
    }
    
    tipo = tipo.lower().strip()
    url = urls_map.get(tipo, URL_TRACKING_PAGADOR)
    cnpj_final = cnpj or cnpj_map.get(tipo, CNPJ_PAGADOR)
    
    resp = _api_call(nf, url, cnpj_final, SENHA_PADRAO)
    return _processar_resposta(resp, "Atual", nf)

# Compatibilidade com main.py
def consulta(nf: str, tipo: str = None, cnpj: str = None):
    """
    Consulta rastreamento na Atual Carga.
    
    Args:
        nf (str): Número da nota fiscal (ou pedido, chave Danfe, coleta)
        tipo (str): 'remetente', 'destinatario' ou 'pagador' (padrão: tenta remetente primeiro)
        cnpj (str): CNPJ customizado (opcional)
    
    Returns:
        dict: Dicionário com informações do rastreamento ou None
    """
    # Se tipo não foi especificado, tentar remetente primeiro (mais comum)
    if tipo is None:
        resultado = consulta_api_atual(nf, 'remetente', cnpj)
        if resultado:
            return resultado
        # Se não encontrar como remetente, tentar pagador
        return consulta_api_atual(nf, 'pagador', cnpj)
    
    return consulta_api_atual(nf, tipo, cnpj)


if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("RASTREAMENTO ATUAL CARGA")
    print("=" * 60)
    
    # Se foi passado um argumento, usar direto
    if len(sys.argv) > 1:
        nf = sys.argv[1]
        tipo = sys.argv[2].lower() if len(sys.argv) > 2 else "remetente"
    else:
        # Caso contrário, pedir ao usuário
        nf = input("\n📦 Digite o número da Nota Fiscal: ").strip()
        if not nf:
            print("❌ Número da NF não pode estar vazio!")
            sys.exit(1)
        
        tipo = "remetente"  # Define automaticamente como remetente
    
    # Fazer a consulta
    print(f"\n⏳ Consultando NF {nf} ({tipo})...")
    resultado = consulta(nf, tipo)
    
    if resultado is None:
        print("\n❌ Nenhum resultado encontrado!")
        print("   Verifique:")
        print("   • Se o número está correto")
        print("   • As credenciais (CNPJ, Senha)")
        print("   • A conexão com a API")
        sys.exit(1)
    
    # Exibir resultado
    print("\n✅ Rastreamento encontrado!\n")
    print("=" * 60)
    print(json.dumps(resultado, indent=2, ensure_ascii=False))
    print("=" * 60)
    sys.exit(0)
