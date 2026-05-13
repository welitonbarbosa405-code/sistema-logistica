"""
Script para consultar rastreamento de NF-e na API Princesa dos Campos
Consulta por CNPJ + Número da NF
"""

import requests
import urllib3
import json
from typing import Dict, Any

# Suprimir avisos de SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# CNPJ padrão da empresa (pode ser alterado)
CNPJ_PADRAO = "01186305000100"

class PrincesaDosArmazensAPI:
    def __init__(self, token: str):
        self.token = token
        self.base_url = "https://princesadoscampos.brudam.com.br/api/v1/tracking/ocorrencias/cnpj/nf"
        self.session = requests.Session()
        self.session.verify = False
        self.session.headers.update({"accept": "application/json"})
    
    def rastrear(self, cnpj: str, numero_nf: str) -> Dict[str, Any]:
        """
        Consulta rastreamento por CNPJ + número de NF
        
        Args:
            cnpj: CNPJ da empresa (apenas números)
            numero_nf: Número da NF (apenas números)
            
        Returns:
            Dict com a resposta da API
        """
        params = {
            "documento": cnpj,
            "numero": numero_nf,
            "token": self.token
        }
        
        print(f"🔍 Consultando rastreio para CNPJ {cnpj} e NF {numero_nf}...")
        
        try:
            response = self.session.get(
                self.base_url,
                params=params,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "status": 0,
                "message": f"Erro na requisição: {str(e)}",
                "error": str(e)
            }


def consulta(codigo: str) -> dict:
    """
    Consulta rastreamento na Princesa dos Campos usando o CNPJ padrão e o número da NF (codigo).
    """
    token = "7fa84e138c7cf5f8d1acc3a9ae5659673ea4f6bb64dddbf1af"  # Ideal: colocar em variável de ambiente/config
    api = PrincesaDosArmazensAPI(token)
    resultado = api.rastrear(CNPJ_PADRAO, codigo)
    # Padroniza o retorno para o sistema
    return {
        'nf': codigo,
        'transportadora': 'Princesa dos Campos',
        'status': 'Sucesso' if resultado.get('status') == 1 else 'Erro',
        'descricao': resultado.get('message', ''),
        'cidade_destino': '',  # Ajuste se a API retornar cidade
        'uf_destino': '',      # Ajuste se a API retornar UF
        'previsao': '',        # Ajuste se a API retornar previsão
        'dados': resultado.get('data')
    }


def main():
    token = "7fa84e138c7cf5f8d1acc3a9ae5659673ea4f6bb64dddbf1af"
    api = PrincesaDosArmazensAPI(token)
    
    print("=" * 70)
    print("RASTREAMENTO DE NF - PRINCESA DOS CAMPOS")
    print("=" * 70)
    
    # Usa o CNPJ padrão ou pede para digitar
    usar_padrao = input(f"Usar CNPJ padrão ({CNPJ_PADRAO})? [S/n]: ").strip().lower()
    
    if usar_padrao == "n":
        cnpj = input("Digite o CNPJ (apenas números): ").strip()
    else:
        cnpj = CNPJ_PADRAO
    
    numero_nf = input("Digite o número da NF (apenas números): ").strip()
    
    if not cnpj.isdigit() or not numero_nf.isdigit():
        print("❌ CNPJ e número da NF devem conter apenas dígitos.")
        return
    
    resultado = api.rastrear(cnpj, numero_nf)
    
    print("\n" + "=" * 70)
    print(f"Status: {'✓ Sucesso' if resultado.get('status') == 1 else '✗ Erro'}")
    print(f"Mensagem: {resultado.get('message')}")
    
    if resultado.get('data'):
        print("\n📦 DADOS DO RASTREAMENTO:")
        print(json.dumps(resultado.get('data'), indent=2, ensure_ascii=False))
    
    print("=" * 70)


if __name__ == "__main__":
    main()
