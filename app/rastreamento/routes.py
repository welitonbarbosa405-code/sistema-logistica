from flask import render_template, request, jsonify, flash
from flask_login import login_required
from . import rastreamento_bp
from app.models import HistoricoRastreamento
from app.extensions import db

def get_transportadoras():
    """Função para obter transportadoras com tratamento de erro"""
    try:
        from app.integrations.transportadoras import listar_transportadoras
        return listar_transportadoras()
    except ImportError:
        # Fallback se não conseguir importar
        return ['Carvalima', 'Rodonaves', 'Minuano', 'Expresso São Miguel', 'Transjoi', 'Brix Cargo', 'Atual']

def consultar_transportadora_safe(transportadora, codigo):
    """Função para consultar transportadora com tratamento de erro"""
    try:
        from app.integrations.transportadoras import consultar_transportadora
        resultado = consultar_transportadora(transportadora, codigo)
        
        # Retorna o resultado real da transportadora
        return resultado
        
    except ImportError:
        print(f"Erro: Não foi possível importar módulo de {transportadora}")
        return None
    except Exception as e:
        print(f"Erro ao consultar {transportadora}: {e}")
        return None

@rastreamento_bp.route("/")
@login_required
def index():
    """Página principal de rastreamento"""
    transportadoras = get_transportadoras()
    return render_template('rastreamento_index.html', transportadoras=transportadoras)

@rastreamento_bp.route("/api/track", methods=["POST"])
@login_required
def track():
    """API para rastrear encomendas consultando todas as transportadoras"""
    data = request.get_json()
    codigo_rastreamento = data.get('codigo', '').strip()
    
    if not codigo_rastreamento:
        return jsonify({'error': 'Código de rastreamento é obrigatório'}), 400
    
    try:
        # Obter lista de transportadoras
        transportadoras = get_transportadoras()
        resultados = []
        
        # Consultar transportadoras mais rápidas primeiro (com timeout)
        import concurrent.futures
        import time
        
        def consultar_com_timeout(transportadora, codigo, timeout=5):
            """Consulta uma transportadora com timeout"""
            try:
                resultado = consultar_transportadora_safe(transportadora, codigo)
                if resultado:
                    # Salvar no histórico
                    try:
                        historico = HistoricoRastreamento(
                            nota_fiscal=codigo,
                            transportadora=resultado.get('transportadora', transportadora),
                            status=resultado.get('status', 'Status não disponível'),
                            descricao=resultado.get('descricao', ''),
                            cidade_destino=resultado.get('cidade_destino', ''),
                            uf_destino=resultado.get('uf_destino', ''),
                            previsao=resultado.get('previsao', '')
                        )
                        db.session.merge(historico)  # Usa merge para atualizar se já existir
                        db.session.commit()
                    except Exception as e:
                        print(f"Erro ao salvar histórico: {e}")
                        db.session.rollback()
                    
                    return {
                        'codigo': resultado.get('nf', codigo),
                        'nf': resultado.get('nf', codigo),  # Campo específico para nota fiscal
                        'transportadora': resultado.get('transportadora', transportadora),
                        'status': resultado.get('status', 'Status não disponível'),
                        'descricao': resultado.get('descricao', ''),
                        'cidade_destino': resultado.get('cidade_destino', ''),
                        'uf_destino': resultado.get('uf_destino', ''),
                        'previsao': resultado.get('previsao', ''),
                        'historico': [
                            {
                                'data': '2025-01-15 10:30',
                                'status': resultado.get('status', 'Consulta realizada'),
                                'local': f"{resultado.get('cidade_destino', '')} - {resultado.get('uf_destino', '')}".strip(' -')
                            }
                        ]
                    }
            except Exception as e:
                print(f"Erro ao consultar {transportadora}: {e}")
            return None
        
        # Consultar São Miguel primeiro (mais simples)
        print(f"Consultando São Miguel para código: {codigo_rastreamento}")
        resultado_sao_miguel = consultar_transportadora_safe('Expresso São Miguel', codigo_rastreamento)
        
        if resultado_sao_miguel:
            print(f"São Miguel encontrou: {resultado_sao_miguel}")
            resultados.append(resultado_sao_miguel)
        else:
            print("São Miguel não encontrou")
            
            # Se São Miguel não encontrou, tentar outras transportadoras (agora incluindo Princesa dos Campos)
            outras_transportadoras = ['Rodonaves', 'Carvalima', 'Minuano', 'Transjoi', 'Brix Cargo', 'Atual', 'Princesa dos Campos']
            
            for transportadora in outras_transportadoras:
                print(f"Consultando {transportadora}")
                resultado = consultar_transportadora_safe(transportadora, codigo_rastreamento)
                if resultado:
                    print(f"{transportadora} encontrou: {resultado}")
                    resultados.append(resultado)
                    break  # Para na primeira que encontrar
        
        if not resultados:
            return jsonify({'error': 'Código não encontrado em nenhuma transportadora consultada'}), 404
        
        # Se encontrou resultado em apenas uma transportadora, retorna direto
        if len(resultados) == 1:
            return jsonify(resultados[0])
        
        # Se encontrou em múltiplas, retorna todas
        return jsonify({
            'codigo': codigo_rastreamento,
            'encontrado_em_multiplas': True,
            'resultados': resultados
        })
        
    except Exception as e:
        print(f"Erro geral no rastreamento: {e}")
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@rastreamento_bp.route("/api/transportadoras")
@login_required
def api_transportadoras():
    """API para listar transportadoras disponíveis"""
    try:
        transportadoras = get_transportadoras()
        return jsonify(transportadoras)
    except Exception as e:
        return jsonify({'error': f'Erro ao listar transportadoras: {str(e)}'}), 500

# @rastreamento_bp.route("/dashboard")
# @login_required
# def dashboard():
#     """Dashboard de rastreamento com tabela completa"""
#     transportadoras = get_transportadoras()
#     return render_template('rastreamento_dashboard.html', transportadoras=transportadoras)

# @rastreamento_bp.route("/api/dashboard/consultar", methods=["POST"])
# @login_required
# def dashboard_consultar():
    """API para consultar múltiplas notas fiscais"""
    data = request.get_json()
    notas_fiscais = data.get('notas', [])
    transportadora_filtro = data.get('transportadora', '').strip()
    
    if not notas_fiscais:
        return jsonify({'error': 'Pelo menos uma nota fiscal é obrigatória'}), 400
    
    try:
        transportadoras = get_transportadoras()
        resultados = []
        
        # Se filtro de transportadora especificado, usar apenas ela
        if transportadora_filtro:
            transportadoras = [t for t in transportadoras if transportadora_filtro.lower() in t.lower()]
        
        for nota_fiscal in notas_fiscais:
            nota_fiscal = nota_fiscal.strip()
            if not nota_fiscal:
                continue
                
            # Consultar todas as transportadoras para esta nota
            for transportadora in transportadoras:
                try:
                    resultado = consultar_transportadora_safe(transportadora, nota_fiscal)
                    if resultado:
                        resultados.append({
                            'nota_fiscal': nota_fiscal,
                            'transportadora': resultado.get('transportadora', transportadora),
                            'status': resultado.get('status', 'Status não disponível'),
                            'descricao': resultado.get('descricao', ''),
                            'cidade_destino': resultado.get('cidade_destino', ''),
                            'uf_destino': resultado.get('uf_destino', ''),
                            'previsao': resultado.get('previsao', ''),
                            'consulta_realizada': True
                        })
                        break  # Se encontrou em uma transportadora, não precisa consultar as outras
                except Exception as e:
                    continue
            
            # Se não encontrou em nenhuma transportadora
            if not any(r['nota_fiscal'] == nota_fiscal for r in resultados):
                resultados.append({
                    'nota_fiscal': nota_fiscal,
                    'transportadora': 'Não encontrado',
                    'status': 'Não localizado',
                    'descricao': 'Nota fiscal não encontrada em nenhuma transportadora',
                    'cidade_destino': '',
                    'uf_destino': '',
                    'previsao': '',
                    'consulta_realizada': False
                })
        
        return jsonify({
            'total_consultadas': len(notas_fiscais),
            'total_encontradas': len([r for r in resultados if r['consulta_realizada']]),
            'resultados': resultados
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro ao consultar notas fiscais: {str(e)}'}), 500

# @rastreamento_bp.route("/api/dashboard/historico")
# @login_required
# def dashboard_historico():
    """API para buscar histórico de rastreamentos por transportadora"""
    transportadora = request.args.get('transportadora', '').strip()
    
    try:
        query = HistoricoRastreamento.query.order_by(HistoricoRastreamento.ultima_atualizacao.desc())
        
        if transportadora:
            query = query.filter(HistoricoRastreamento.transportadora.ilike(f'%{transportadora}%'))
        
        historicos = query.limit(100).all()  # Limita a 100 registros mais recentes
        
        resultados = []
        for h in historicos:
            resultados.append({
                'nota_fiscal': h.nota_fiscal,
                'transportadora': h.transportadora,
                'status': h.status,
                'descricao': h.descricao,
                'cidade_destino': h.cidade_destino,
                'uf_destino': h.uf_destino,
                'previsao': h.previsao,
                'consultado_em': h.consultado_em.strftime('%d/%m/%Y %H:%M'),
                'ultima_atualizacao': h.ultima_atualizacao.strftime('%d/%m/%Y %H:%M')
            })
        
        return jsonify({
            'total': len(resultados),
            'resultados': resultados
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro ao buscar histórico: {str(e)}'}), 500
