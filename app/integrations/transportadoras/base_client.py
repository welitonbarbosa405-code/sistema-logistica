from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import requests
from datetime import datetime

class BaseTransportadora(ABC):
    """Classe base para integração com transportadoras"""
    
    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'KUHN-Logistica/1.0'
        })
    
    @abstractmethod
    def rastrear(self, codigo: str) -> Dict:
        """
        Rastreia uma encomenda
        
        Args:
            codigo: Código de rastreamento
            
        Returns:
            Dict com informações da encomenda:
            {
                'codigo': str,
                'status': str,
                'transportadora': str,
                'historico': List[Dict]
            }
        """
        pass
    
    def _parsear_data(self, data_str: str, formato: str = "%Y-%m-%d %H:%M") -> str:
        """Converte string de data para formato padrão"""
        try:
            if data_str:
                # Tenta diferentes formatos de data
                formatos = [
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%d %H:%M",
                    "%d/%m/%Y %H:%M",
                    "%d/%m/%Y",
                ]
                
                for fmt in formatos:
                    try:
                        dt = datetime.strptime(data_str.strip(), fmt)
                        return dt.strftime("%Y-%m-%d %H:%M")
                    except ValueError:
                        continue
                        
                return data_str
        except:
            pass
        return data_str
    
    def _normalizar_status(self, status: str) -> str:
        """Normaliza status das transportadoras para formato padrão"""
        status = status.upper().strip()
        
        # Mapeamento de status comuns
        mapeamento = {
            'COLETADO': 'Coletado',
            'COLETA': 'Coletado',
            'EM TRÂNSITO': 'Em trânsito',
            'EM TRANSITO': 'Em trânsito',
            'TRANSITO': 'Em trânsito',
            'ENTREGUE': 'Entregue',
            'ENTREGA': 'Entregue',
            'PENDENTE': 'Pendente',
            'PROBLEMA': 'Problema',
            'DEVOLVIDO': 'Devolvido'
        }
        
        return mapeamento.get(status, status.title())
