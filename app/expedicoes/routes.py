from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from app.models import Expedicao
from app.extensions import db

expedicoes_bp = Blueprint('expedicoes', __name__, url_prefix='/expedicoes')

@expedicoes_bp.route('/')
@login_required
def index():
    """Página principal de expedições"""
    return render_template('expedicoes_index.html')

@expedicoes_bp.route('/api/dados')
@login_required
def api_dados():
    """API para buscar dados de expedições com filtros"""
    try:
        # Parâmetros de filtro
        nf = request.args.get('nf', '').strip()
        transportadora = request.args.get('transportadora', '').strip()
        filial = request.args.get('filial', '').strip()
        cliente = request.args.get('cliente', '').strip()
        data_inicio = request.args.get('data_inicio', '').strip()
        data_fim = request.args.get('data_fim', '').strip()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        
        # Query base
        query = Expedicao.query
        
        # Aplicar filtros
        if nf:
            query = query.filter(Expedicao.nf == nf)
        
        if transportadora:
            query = query.filter(Expedicao.transportadora.contains(transportadora))
        
        if filial:
            query = query.filter(Expedicao.filial.contains(filial))
        
        if cliente:
            query = query.filter(Expedicao.nome_cliente.contains(cliente))
        
        if data_inicio:
            try:
                data_inicio_dt = datetime.strptime(data_inicio, '%Y-%m-%d')
                query = query.filter(Expedicao.datahora_exped >= data_inicio_dt)
            except ValueError:
                pass
        
        if data_fim:
            try:
                data_fim_dt = datetime.strptime(data_fim, '%Y-%m-%d')
                query = query.filter(Expedicao.datahora_exped <= data_fim_dt)
            except ValueError:
                pass
        
        # Paginação
        total = query.count()
        expedicoes = query.order_by(Expedicao.datahora_exped.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [exp.to_dict() for exp in expedicoes.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': expedicoes.pages,
                'has_next': expedicoes.has_next,
                'has_prev': expedicoes.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@expedicoes_bp.route('/api/estatisticas')
@login_required
def api_estatisticas():
    """API para estatísticas gerais de expedições com filtros"""
    try:
        # Parâmetros de filtro
        nf = request.args.get('nf', '').strip()
        transportadora = request.args.get('transportadora', '').strip()
        filial = request.args.get('filial', '').strip()
        cliente = request.args.get('cliente', '').strip()
        data_inicio = request.args.get('data_inicio', '').strip()
        data_fim = request.args.get('data_fim', '').strip()
        
        # Query base
        query = Expedicao.query
        
        # Aplicar filtros
        if nf:
            query = query.filter(Expedicao.nf == nf)
        
        if transportadora:
            query = query.filter(Expedicao.transportadora.contains(transportadora))
        
        if filial:
            query = query.filter(Expedicao.filial.contains(filial))
        
        if cliente:
            query = query.filter(Expedicao.nome_cliente.contains(cliente))
        
        if data_inicio:
            try:
                data_inicio_dt = datetime.strptime(data_inicio, '%Y-%m-%d')
                query = query.filter(Expedicao.datahora_exped >= data_inicio_dt)
            except ValueError:
                pass
        
        if data_fim:
            try:
                data_fim_dt = datetime.strptime(data_fim, '%Y-%m-%d')
                query = query.filter(Expedicao.datahora_exped <= data_fim_dt)
            except ValueError:
                pass
        # Valor total (com filtros aplicados)
        valor_total = query.filter(
            Expedicao.valor_total.isnot(None)
        ).with_entities(func.sum(Expedicao.valor_total)).scalar() or 0
        
        # Total quantidade (com filtros aplicados)
        total_quantidade = query.filter(
            Expedicao.quantidade.isnot(None)
        ).with_entities(func.sum(Expedicao.quantidade)).scalar() or 0
        
        # Quantidade de NFs distintas (com filtros aplicados)
        qtd_nf = query.filter(
            Expedicao.nf.isnot(None)
        ).with_entities(Expedicao.nf).distinct().count()
        
        # Estados atendidos (com filtros aplicados)
        estados_atendidos = query.filter(
            Expedicao.uf.isnot(None)
        ).with_entities(Expedicao.uf).distinct().count()
        
        # Distribuição por transportadora (com filtros aplicados)
        distrib_transportadoras = query.filter(
            Expedicao.transportadora.isnot(None)
        ).with_entities(
            Expedicao.transportadora,
            func.count(Expedicao.id).label('total')
        ).group_by(Expedicao.transportadora).order_by(
            func.count(Expedicao.id).desc()
        ).limit(10).all()
        
        # Prazos por região (baseado em estados) (com filtros aplicados)
        # Quantidade NF Expedidas por Região (com filtros aplicados)
        prazos_regiao = query.filter(
            Expedicao.uf.isnot(None)
        ).with_entities(
            Expedicao.uf,
            func.count(func.distinct(Expedicao.nf)).label('total')
        ).group_by(Expedicao.uf).order_by(
            func.count(func.distinct(Expedicao.nf)).desc()
        ).all()
        
        # Expedições por mês
        expedicoes_mes = []
        
        # Verificar se há filtros aplicados
        tem_filtros = any([nf, transportadora, filial, cliente, data_inicio, data_fim])
        
        if tem_filtros:
            # Com filtros: últimos 12 meses
            data_limite = datetime.now() - timedelta(days=365)
            expedicoes_mes_raw = query.filter(
                Expedicao.datahora_exped.isnot(None),
                Expedicao.datahora_exped >= data_limite
            ).with_entities(
                func.strftime('%Y-%m', Expedicao.datahora_exped).label('mes'),
                func.count(func.distinct(Expedicao.nf)).label('total')
            ).group_by(
                func.strftime('%Y-%m', Expedicao.datahora_exped)
            ).order_by('mes').all()
            
            # Se não há dados de datahora_exped, usar emissao (com filtros aplicados)
            if not expedicoes_mes_raw:
                expedicoes_mes_raw = query.filter(
                    Expedicao.emissao.isnot(None),
                    Expedicao.emissao >= data_limite
                ).with_entities(
                    func.strftime('%Y-%m', Expedicao.emissao).label('mes'),
                    func.count(func.distinct(Expedicao.nf)).label('total')
                ).group_by(
                    func.strftime('%Y-%m', Expedicao.emissao)
                ).order_by('mes').all()
            
            # Converter formato de YYYY-MM para MM/YYYY
            expedicoes_mes = []
            for item in expedicoes_mes_raw:
                mes_ano = item.mes.split('-')
                formato_brasileiro = f"{mes_ano[1]}/{mes_ano[0]}"
                expedicoes_mes.append((formato_brasileiro, item.total))
        else:
            # Sem filtros: apenas meses com dados (01/2025 até 10/2025)
            for mes in range(1, 11):  # Janeiro a Outubro
                data_inicio_mes = datetime(2025, mes, 1)
                data_fim_mes = datetime(2025, mes + 1, 1) - timedelta(days=1)
                
                # Tentar primeiro com datahora_exped
                total_mes = Expedicao.query.filter(
                    Expedicao.datahora_exped.isnot(None),
                    Expedicao.datahora_exped >= data_inicio_mes,
                    Expedicao.datahora_exped <= data_fim_mes
                ).with_entities(
                    func.count(func.distinct(Expedicao.nf))
                ).scalar() or 0
                
                # Se não há dados com datahora_exped, usar emissao
                if total_mes == 0:
                    total_mes = Expedicao.query.filter(
                        Expedicao.emissao.isnot(None),
                        Expedicao.emissao >= data_inicio_mes,
                        Expedicao.emissao <= data_fim_mes
                    ).with_entities(
                        func.count(func.distinct(Expedicao.nf))
                    ).scalar() or 0
                
                # Formato MM/YYYY
                formato_brasileiro = f"{mes:02d}/2025"
                expedicoes_mes.append((formato_brasileiro, total_mes))
        
        # Top 10 municípios de destino (com filtros aplicados)
        top_municipios = query.filter(
            Expedicao.municipio.isnot(None),
            Expedicao.uf.isnot(None)
        ).with_entities(
            Expedicao.municipio,
            Expedicao.uf,
            func.count(Expedicao.id).label('total')
        ).group_by(
            Expedicao.municipio, Expedicao.uf
        ).order_by(
            func.count(Expedicao.id).desc()
        ).limit(10).all()
        
        # Top 10 clientes por valor (com filtros aplicados)
        top_clientes = query.filter(
            Expedicao.nome_cliente.isnot(None),
            Expedicao.valor_total.isnot(None)
        ).with_entities(
            Expedicao.nome_cliente,
            func.sum(Expedicao.valor_total).label('valor_total')
        ).group_by(
            Expedicao.nome_cliente
        ).order_by(
            func.sum(Expedicao.valor_total).desc()
        ).limit(10).all()
        
        # Comparativo mensal (mês atual vs anterior)
        hoje = datetime.now()
        mes_atual = hoje.replace(day=1)
        mes_anterior = (mes_atual - timedelta(days=1)).replace(day=1)
        
        expedicoes_mes_atual = query.filter(
            Expedicao.datahora_exped >= mes_atual,
            Expedicao.datahora_exped < hoje
        ).count()
        
        expedicoes_mes_anterior = query.filter(
            Expedicao.datahora_exped >= mes_anterior,
            Expedicao.datahora_exped < mes_atual
        ).count()
        
        # Métricas de performance (simuladas)
        tempo_medio_entrega = 3.5  # dias
        taxa_entrega_no_prazo = 95.2  # %
        satisfacao_cliente = 4.8  # de 5
        eficiencia_logistica = 87.5  # %
        
        # Evolução de vendas
        evolucao_vendas = []
        
        # Verificar se há filtros aplicados
        tem_filtros = any([nf, transportadora, filial, cliente, data_inicio, data_fim])
        
        if tem_filtros:
            # Com filtros: últimos 6 meses
            for i in range(6):
                data_inicio_mes = (hoje - timedelta(days=30*i)).replace(day=1)
                data_fim_mes = (data_inicio_mes + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                valor_mes = query.filter(
                    Expedicao.datahora_exped >= data_inicio_mes,
                    Expedicao.datahora_exped <= data_fim_mes,
                    Expedicao.valor_total.isnot(None)
                ).with_entities(
                    func.sum(Expedicao.valor_total)
                ).scalar() or 0
                
                evolucao_vendas.append({
                    'periodo': data_inicio_mes.strftime('%m/%Y'),
                    'valor': valor_mes
                })
            
            evolucao_vendas.reverse()  # Do mais antigo para o mais recente
        else:
            # Sem filtros: apenas meses com dados (01/2025 até 10/2025)
            for mes in range(1, 11):  # Janeiro a Outubro
                data_inicio_mes = datetime(2025, mes, 1)
                data_fim_mes = datetime(2025, mes + 1, 1) - timedelta(days=1)
                
                valor_mes = Expedicao.query.filter(
                    Expedicao.datahora_exped >= data_inicio_mes,
                    Expedicao.datahora_exped <= data_fim_mes,
                    Expedicao.valor_total.isnot(None)
                ).with_entities(
                    func.sum(Expedicao.valor_total)
                ).scalar() or 0
                
                evolucao_vendas.append({
                    'periodo': data_inicio_mes.strftime('%m/%Y'),
                    'valor': valor_mes
                })
        
        return jsonify({
            'success': True,
            'data': {
                'valor_total': valor_total,
                'total_quantidade': total_quantidade,
                'qtd_nf': qtd_nf,
                'estados_atendidos': estados_atendidos,
                'distribuicao_transportadoras': [
                    {'transportadora': t[0], 'total': t[1]} 
                    for t in distrib_transportadoras
                ],
                'prazos_regiao': [
                    {'uf': p[0], 'total': p[1]} 
                    for p in prazos_regiao
                ],
                'expedicoes_mes': [
                    {'mes': e[0], 'total': e[1]} 
                    for e in expedicoes_mes
                ],
                'top_municipios': [
                    {'municipio': m[0], 'uf': m[1], 'total': m[2]} 
                    for m in top_municipios
                ],
                'top_clientes': [
                    {
                        'cliente': item.nome_cliente,
                        'valor_total': float(item.valor_total)
                    }
                    for item in top_clientes
                ],
                'comparativo_mensal': {
                    'atual': expedicoes_mes_atual,
                    'anterior': expedicoes_mes_anterior
                },
                'metricas_performance': [
                    {'metrica': 'Tempo Médio Entrega', 'valor': tempo_medio_entrega},
                    {'metrica': 'Taxa Entrega no Prazo', 'valor': taxa_entrega_no_prazo},
                    {'metrica': 'Satisfação Cliente', 'valor': satisfacao_cliente},
                    {'metrica': 'Eficiência Logística', 'valor': eficiencia_logistica}
                ],
                'evolucao_vendas': evolucao_vendas
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@expedicoes_bp.route('/api/filtros')
@login_required
def api_filtros():
    """API para obter opções de filtros"""
    try:
        campo = request.args.get('campo', '').strip()
        
        if campo == 'transportadora':
            # Transportadoras únicas
            transportadoras = db.session.query(Expedicao.transportadora).filter(
                Expedicao.transportadora.isnot(None)
            ).distinct().order_by(Expedicao.transportadora).all()
            
            return jsonify({
                'success': True,
                'transportadoras': [t[0] for t in transportadoras if t[0]]
            })
            
        elif campo == 'filial':
            # Filiais únicas
            filiais = db.session.query(Expedicao.filial).filter(
                Expedicao.filial.isnot(None)
            ).distinct().order_by(Expedicao.filial).all()
            
            return jsonify({
                'success': True,
                'filiais': [f[0] for f in filiais if f[0]]
            })
            
        elif campo == 'cliente':
            # Clientes únicos
            clientes = db.session.query(Expedicao.nome_cliente).filter(
                Expedicao.nome_cliente.isnot(None)
            ).distinct().order_by(Expedicao.nome_cliente).all()
            
            return jsonify({
                'success': True,
                'clientes': [c[0] for c in clientes if c[0]]
            })
        
        else:
            # Retornar todos os filtros
            transportadoras = db.session.query(Expedicao.transportadora).filter(
                Expedicao.transportadora.isnot(None)
            ).distinct().order_by(Expedicao.transportadora).all()
            
            filiais = db.session.query(Expedicao.filial).filter(
                Expedicao.filial.isnot(None)
            ).distinct().order_by(Expedicao.filial).all()
            
            # Clientes únicos
            clientes = db.session.query(Expedicao.nome_cliente).filter(
                Expedicao.nome_cliente.isnot(None)
            ).distinct().order_by(Expedicao.nome_cliente).all()
            
            # Estados únicos
            estados = db.session.query(Expedicao.uf).filter(
                Expedicao.uf.isnot(None)
            ).distinct().order_by(Expedicao.uf).all()
            
            return jsonify({
                'success': True,
                'data': {
                    'transportadoras': [t[0] for t in transportadoras if t[0]],
                    'filiais': [f[0] for f in filiais if f[0]],
                    'clientes': [c[0] for c in clientes if c[0]],
                    'estados': [e[0] for e in estados if e[0]]
                }
            })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@expedicoes_bp.route('/api/mapa')
@login_required
def api_mapa():
    """API para dados do mapa de expedições com filtros"""
    try:
        # Parâmetros de filtro
        nf = request.args.get('nf', '').strip()
        transportadora = request.args.get('transportadora', '').strip()
        filial = request.args.get('filial', '').strip()
        cliente = request.args.get('cliente', '').strip()
        data_inicio = request.args.get('data_inicio', '').strip()
        data_fim = request.args.get('data_fim', '').strip()
        
        # Query base
        query = Expedicao.query
        
        # Aplicar filtros
        if nf:
            query = query.filter(Expedicao.nf == nf)
        
        if transportadora:
            query = query.filter(Expedicao.transportadora.contains(transportadora))
        
        if filial:
            query = query.filter(Expedicao.filial.contains(filial))
        
        if cliente:
            query = query.filter(Expedicao.nome_cliente.contains(cliente))
        
        if data_inicio:
            try:
                data_inicio_dt = datetime.strptime(data_inicio, '%Y-%m-%d')
                query = query.filter(Expedicao.datahora_exped >= data_inicio_dt)
            except ValueError:
                pass
        
        if data_fim:
            try:
                data_fim_dt = datetime.strptime(data_fim, '%Y-%m-%d')
                query = query.filter(Expedicao.datahora_exped <= data_fim_dt)
            except ValueError:
                pass
        # Dados geográficos das expedições agrupados por estado (com filtros aplicados)
        dados_estados = query.filter(
            Expedicao.uf.isnot(None),
            Expedicao.uf != ''
        ).with_entities(
            Expedicao.uf,
            func.count(Expedicao.id).label('total_expedicoes'),
            func.sum(Expedicao.quantidade).label('total_quantidade'),
            func.sum(Expedicao.valor_total).label('total_valor')
        ).group_by(
            Expedicao.uf
        ).order_by(
            func.count(Expedicao.id).desc()
        ).all()
        
        # Dados detalhados por município (top 5 por estado) (com filtros aplicados)
        dados_municipios = query.filter(
            Expedicao.uf.isnot(None),
            Expedicao.municipio.isnot(None),
            Expedicao.uf != '',
            Expedicao.municipio != ''
        ).with_entities(
            Expedicao.uf,
            Expedicao.municipio,
            func.count(Expedicao.id).label('total_expedicoes'),
            func.sum(Expedicao.quantidade).label('total_quantidade'),
            func.sum(Expedicao.valor_total).label('total_valor')
        ).group_by(
            Expedicao.uf, Expedicao.municipio
        ).order_by(
            Expedicao.uf, func.count(Expedicao.id).desc()
        ).all()
        
        # Agrupar dados por estado
        estados_data = {}
        
        # Primeiro, adicionar dados dos estados
        for item in dados_estados:
            uf = item[0].strip() if item[0] else 'XX'
            estados_data[uf] = {
                'total_expedicoes': item[1] or 0,
                'total_quantidade': item[2] or 0,
                'total_valor': item[3] or 0,
                'municipios': []
            }
        
        # Depois, adicionar dados dos municípios (top 5 por estado)
        municipios_por_estado = {}
        for item in dados_municipios:
            uf = item[0].strip() if item[0] else 'XX'
            if uf not in municipios_por_estado:
                municipios_por_estado[uf] = []
            municipios_por_estado[uf].append({
                'municipio': item[1].strip() if item[1] else 'N/A',
                'expedicoes': item[2] or 0,
                'quantidade': item[3] or 0,
                'valor': item[4] or 0
            })
        
        # Limitar a 5 municípios por estado
        for uf in municipios_por_estado:
            if uf in estados_data:
                estados_data[uf]['municipios'] = municipios_por_estado[uf][:5]
        
        return jsonify({
            'success': True,
            'data': estados_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
