from flask import render_template, request, jsonify
from flask_login import login_required
from sqlalchemy import func
import unicodedata
from . import cidades_bp
from app.extensions import db
from app.models import CidadeAtendida

@cidades_bp.route("/")
@login_required
def index():
    """Página principal - lista de cidades atendidas (server-render)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    search = (request.args.get('search') or '').strip()
    transportadora = (request.args.get('transportadora') or '').strip()

    q = CidadeAtendida.query

    # Busca case-insensitive (ILike) por cidade destino e estado
    if search:
        like = f"%{search}%"
        q = q.filter(
            (CidadeAtendida.cidade_destino.ilike(like)) |
            (CidadeAtendida.estado_atendido.ilike(like))
        )

    if transportadora:
        q = q.filter(CidadeAtendida.transportadora.ilike(f"%{transportadora}%"))

    # Ordenação padrão (transportadora, cidade_destino)
    q = q.order_by(
        CidadeAtendida.transportadora.asc(),
        CidadeAtendida.cidade_destino.asc()
    )

    cidades = q.paginate(page=page, per_page=per_page, error_out=False)

    # Lista de transportadoras para o select (ordenada)
    transportadoras = [t[0] for t in (
        db.session.query(CidadeAtendida.transportadora)
        .filter(CidadeAtendida.transportadora.isnot(None))
        .distinct()
        .order_by(CidadeAtendida.transportadora.asc())
        .all()
    )]

    return render_template(
        "cidades_atendidas.html",
        cidades=cidades,
        transportadoras=transportadoras,
        search=search,
        transportadora_filtro=transportadora
    )

@cidades_bp.route("/api/suggestions")
@login_required
def api_suggestions():
    """API para sugestões de busca inteligente"""
    query = request.args.get('q', '').strip()
    
    if len(query) < 2:
        return jsonify([])
    
    # Busca case-insensitive com limite de resultados
    like = f"%{query}%"
    suggestions = (
        CidadeAtendida.query
        .filter(CidadeAtendida.cidade_destino.ilike(like))
        .limit(10)
        .all()
    )
    
    return jsonify([
        {
            'cidade_destino': cidade.cidade_destino,
            'estado_atendido': cidade.estado_atendido,
            'transportadora': cidade.transportadora,
            'prazo_entrega': cidade.prazo_entrega
        }
        for cidade in suggestions
    ])

@cidades_bp.route("/api/search")
@login_required
def api_search():
    """API moderna para busca de cidades com paginação, filtros e ordenação"""
    # Parâmetros de filtro
    cidade = request.args.get('cidade', '').strip().upper()
    cidade_origem = request.args.get('cidade_origem', '').strip().upper()
    transportadora = request.args.get('transportadora', '').strip()
    uf = request.args.get('uf', '').strip()
    prazo = request.args.get('prazo', '').strip()
    
    # Parâmetros de paginação
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 10000)  # Máximo 10000 por página para performance
      # Parâmetros de ordenação
    sort = request.args.get('sort', '')
    direction = request.args.get('direction', 'asc')
    
    # Construir query
    q = CidadeAtendida.query
    
    # Aplicar filtros
    if cidade:
        q = q.filter(CidadeAtendida.cidade_destino.ilike(f"%{cidade}%"))
    
    if cidade_origem:
        q = q.filter(CidadeAtendida.cidade_origem.ilike(f"%{cidade_origem}%"))
    
    if transportadora:
        q = q.filter(CidadeAtendida.transportadora.ilike(f'%{transportadora}%'))
    
    if uf:
        # Busca case-insensitive para o estado (normaliza ES, Es, es, etc.)
        q = q.filter(func.upper(CidadeAtendida.estado_atendido) == uf.upper())
    
    if prazo:
        try:
            prazo_max = int(prazo)
            q = q.filter(CidadeAtendida.prazo_entrega <= prazo_max)
        except ValueError:
            pass
    
    # Aplicar ordenação
    if sort and hasattr(CidadeAtendida, sort):
        column = getattr(CidadeAtendida, sort)
        if direction == 'desc':
            q = q.order_by(column.desc())
        else:
            q = q.order_by(column.asc())
    else:
        # Ordenação padrão
        q = q.order_by(
            CidadeAtendida.transportadora.asc(),
            CidadeAtendida.cidade_destino.asc()
        )
    
    # Paginação
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    
    # Dados para filtros (sempre carregar para manter dropdowns atualizados)
    transportadoras = [t[0] for t in (
        db.session.query(CidadeAtendida.transportadora)
        .filter(CidadeAtendida.transportadora.isnot(None))
        .distinct()
        .order_by(CidadeAtendida.transportadora.asc())
        .all()
    )]
    
    estados = [e[0] for e in (
        db.session.query(CidadeAtendida.estado_atendido)
        .filter(CidadeAtendida.estado_atendido.isnot(None))
        .distinct()
        .order_by(CidadeAtendida.estado_atendido.asc())
        .all()
    )]
    
    cidades_origem = [co[0] for co in (
        db.session.query(CidadeAtendida.cidade_origem)
        .filter(CidadeAtendida.cidade_origem.isnot(None))
        .distinct()
        .order_by(CidadeAtendida.cidade_origem.asc())
        .all()
    )]
    
    return jsonify({
        'cidades': [{
            'id': c.id,
            'transportadora': c.transportadora,
            'cidade_origem': c.cidade_origem,
            'cidade_destino': c.cidade_destino,
            'estado_atendido': c.estado_atendido,
            'prazo_entrega': c.prazo_entrega,
            'pais': c.pais
        } for c in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_prev': pagination.has_prev,
        'has_next': pagination.has_next,
        'transportadoras': transportadoras,
        'estados': estados,
        'cidades_origem': cidades_origem
    })

@cidades_bp.route("/api/export")
@login_required
def api_export():
    """API para exportação de dados em diferentes formatos"""
    format_type = request.args.get('format', 'json').lower()
    
    # Aplicar os mesmos filtros da busca
    cidade = request.args.get('cidade', '').strip().upper()
    cidade_origem = request.args.get('cidade_origem', '').strip().upper()
    transportadora = request.args.get('transportadora', '').strip()
    uf = request.args.get('uf', '').strip()
    prazo = request.args.get('prazo', '').strip()
    
    q = CidadeAtendida.query
    
    if cidade:
        q = q.filter(CidadeAtendida.cidade_destino.ilike(f"%{cidade}%"))
    if cidade_origem:
        q = q.filter(CidadeAtendida.cidade_origem.ilike(f"%{cidade_origem}%"))
    if transportadora:
        q = q.filter(CidadeAtendida.transportadora.ilike(f'%{transportadora}%'))
    if uf:
        # Busca case-insensitive para o estado
        q = q.filter(func.upper(CidadeAtendida.estado_atendido) == uf.upper())
    if prazo:
        try:
            prazo_max = int(prazo)
            q = q.filter(CidadeAtendida.prazo_entrega <= prazo_max)
        except ValueError:
            pass
    
    # Ordenação padrão
    q = q.order_by(
        CidadeAtendida.transportadora.asc(),
        CidadeAtendida.cidade_destino.asc()
    )
    
    cidades = q.all()
    
    if format_type == 'csv':
        from flask import Response
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Cabeçalho
        writer.writerow(['Transportadora', 'Cidade Origem', 'Cidade Destino', 'Estado', 'Prazo', 'País'])
        
        # Dados
        for cidade in cidades:
            writer.writerow([
                cidade.transportadora or '',
                cidade.cidade_origem or '',
                cidade.cidade_destino or '',
                cidade.estado_atendido or '',
                cidade.prazo_entrega or '',
                cidade.pais or 'Brasil'
            ])
        
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=cidades_atendidas.csv'}
        )
    
    elif format_type == 'excel':
        from flask import Response
        import io
        import pandas as pd
        
        # Criar DataFrame
        data = []
        for cidade in cidades:
            data.append({
                'Transportadora': cidade.transportadora or '',
                'Cidade Origem': cidade.cidade_origem or '',
                'Cidade Destino': cidade.cidade_destino or '',
                'Estado': cidade.estado_atendido or '',
                'Prazo': cidade.prazo_entrega or '',
                'País': cidade.pais or 'Brasil'
            })
        
        df = pd.DataFrame(data)
        
        # Criar Excel em memória
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Cidades Atendidas', index=False)
        
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': 'attachment; filename=cidades_atendidas.xlsx'}
        )
    
    else:  # JSON (padrão)
        return jsonify([
            {
                'transportadora': cidade.transportadora,
                'cidade_origem': cidade.cidade_origem,
                'cidade_destino': cidade.cidade_destino,
                'estado_atendido': cidade.estado_atendido,
                'prazo_entrega': cidade.prazo_entrega,
                'pais': cidade.pais
            }
            for cidade in cidades
        ])

@cidades_bp.route("/api/kpis")
@login_required
def api_kpis():
    """API específica para KPIs com dados completos ou filtrados"""
    try:        # Parâmetros de filtro (opcionais)
        cidade = request.args.get('cidade', '').strip().upper()
        cidade_origem = request.args.get('cidade_origem', '').strip().upper()
        transportadora = request.args.get('transportadora', '').strip()
        uf = request.args.get('uf', '').strip()
        prazo = request.args.get('prazo', '').strip()
        
        # Construir query baseada nos filtros
        q = CidadeAtendida.query
        
        # Aplicar filtros se fornecidos
        if cidade:
            q = q.filter(CidadeAtendida.cidade_destino.ilike(f"%{cidade}%"))
        if cidade_origem:
            q = q.filter(CidadeAtendida.cidade_origem.ilike(f"%{cidade_origem}%"))
        if transportadora:
            q = q.filter(CidadeAtendida.transportadora.ilike(f'%{transportadora}%'))
        if uf:
            # Busca case-insensitive para o estado
            q = q.filter(func.upper(CidadeAtendida.estado_atendido) == uf.upper())
        if prazo:
            try:
                prazo_max = int(prazo)
                q = q.filter(CidadeAtendida.prazo_entrega <= prazo_max)
            except ValueError:
                pass
        
        # Utilitário: normalizar nome de estado em UF
        def normalizar_uf(valor: str) -> str:
            if not valor:
                return ''
            val = unicodedata.normalize('NFD', valor).encode('ascii', 'ignore').decode('utf-8').upper().strip()
            if len(val) == 2:
                return val
            mapa = {
                'ACRE': 'AC', 'ALAGOAS': 'AL', 'AMAPA': 'AP', 'AMAZONAS': 'AM', 'BAHIA': 'BA', 'CEARA': 'CE',
                'DISTRITO FEDERAL': 'DF', 'ESPIRITO SANTO': 'ES', 'GOIAS': 'GO', 'MARANHAO': 'MA',
                'MATO GROSSO': 'MT', 'MATO GROSSO DO SUL': 'MS', 'MINAS GERAIS': 'MG', 'PARA': 'PA',
                'PARAIBA': 'PB', 'PARANA': 'PR', 'PERNAMBUCO': 'PE', 'PIAUI': 'PI', 'RIO DE JANEIRO': 'RJ',
                'RIO GRANDE DO NORTE': 'RN', 'RIO GRANDE DO SUL': 'RS', 'RONDONIA': 'RO', 'RORAIMA': 'RR',
                'SANTA CATARINA': 'SC', 'SAO PAULO': 'SP', 'SERGIPE': 'SE', 'TOCANTINS': 'TO'
            }
            return mapa.get(val, val)

        # Dados filtrados para KPIs
        # Contar CIDADES DISTINTAS (não total de registros)
        total_cidades = q.with_entities(CidadeAtendida.cidade_destino).filter(
            CidadeAtendida.cidade_destino.isnot(None)
        ).distinct().count()
        
        # Transportadoras únicas (dos dados filtrados)
        transportadoras = [t[0] for t in (
            q.with_entities(CidadeAtendida.transportadora)
            .filter(CidadeAtendida.transportadora.isnot(None))
            .distinct()
            .order_by(CidadeAtendida.transportadora.asc())
            .all()
        )]
        
        # Estados únicos (normalizados para UF)
        estados_raw = [e[0] for e in (
            q.with_entities(CidadeAtendida.estado_atendido)
            .filter(CidadeAtendida.estado_atendido.isnot(None))
            .all()
        )]
        estados = sorted({normalizar_uf(e) for e in estados_raw if e})
        
        # Prazo médio (dos dados filtrados)
        prazos = q.with_entities(CidadeAtendida.prazo_entrega).filter(
            CidadeAtendida.prazo_entrega.isnot(None)
        ).all()
        
        prazo_medio = 0
        if prazos:
            valores_prazo = [p[0] for p in prazos if p[0] is not None]
            if valores_prazo:
                prazo_medio = sum(valores_prazo) / len(valores_prazo)
        
        # Distribuição por transportadora (dados filtrados)
        distrib_transportadoras = (
            q.filter(CidadeAtendida.transportadora.isnot(None))
             .with_entities(
                 CidadeAtendida.transportadora,
                 func.count(CidadeAtendida.id).label('total')
             )
             .group_by(CidadeAtendida.transportadora)
             .order_by(func.count(CidadeAtendida.id).desc())
             .all()
        )

        # Prazos por estado (média por UF) – normalizando UF em Python
        prazos_raw = (
            q.filter(CidadeAtendida.estado_atendido.isnot(None), CidadeAtendida.prazo_entrega.isnot(None))
             .with_entities(CidadeAtendida.estado_atendido, CidadeAtendida.prazo_entrega)
             .all()
        )
        agregados = {}
        for estado_val, prazo_val in prazos_raw:
            uf_norm = normalizar_uf(estado_val)
            if not uf_norm:
                continue
            if prazo_val is None:
                continue
            agregados.setdefault(uf_norm, []).append(prazo_val)
        prazos_por_estado = []
        for uf_norm, valores in agregados.items():
            if valores:
                media = sum(valores) / len(valores)
                prazos_por_estado.append({'uf': uf_norm, 'prazo_medio': round(float(media), 1)})
        prazos_por_estado.sort(key=lambda x: x['prazo_medio'])

        # Dados totais do banco (para comparação) - CIDADES DISTINTAS
        total_cidades_banco = db.session.query(CidadeAtendida.cidade_destino).filter(
            CidadeAtendida.cidade_destino.isnot(None)
        ).distinct().count()
        total_transportadoras_banco = db.session.query(CidadeAtendida.transportadora).distinct().count()
        total_estados_banco = db.session.query(CidadeAtendida.estado_atendido).distinct().count()
        
        return jsonify({
            'total_cidades': total_cidades,
            'total_transportadoras': len(transportadoras),
            'total_estados': len(estados),
            'prazo_medio': round(prazo_medio, 1),
            'transportadoras': transportadoras,
            'estados': estados,
            'distribuicao_transportadoras': [
                {'transportadora': t[0], 'total': int(t[1])} for t in distrib_transportadoras
            ],
            'prazos_regiao': prazos_por_estado,
            'dados_totais': {
                'total_cidades': total_cidades_banco,
                'total_transportadoras': total_transportadoras_banco,
                'total_estados': total_estados_banco
            },
            'filtros_aplicados': {
                'cidade': cidade,
                'cidade_origem': cidade_origem,
                'transportadora': transportadora,
                'uf': uf,
                'prazo': prazo
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Erro ao obter dados dos KPIs'
        }), 500

@cidades_bp.route("/api/debug")
@login_required
def api_debug():
    """API para debug - verificar dados no banco"""
    try:
        # Contar total de registros
        total_registros = CidadeAtendida.query.count()
        
        # Contar transportadoras únicas
        transportadoras_unicas = db.session.query(CidadeAtendida.transportadora).distinct().count()
        
        # Listar todas as transportadoras
        todas_transportadoras = [t[0] for t in 
            db.session.query(CidadeAtendida.transportadora)
            .filter(CidadeAtendida.transportadora.isnot(None))
            .distinct()
            .order_by(CidadeAtendida.transportadora.asc())
            .all()
        ]
        
        # Contar por transportadora
        distribuicao = {}
        for transp in todas_transportadoras:
            count = CidadeAtendida.query.filter_by(transportadora=transp).count()
            distribuicao[transp] = count
        
        # Primeiros 10 registros para debug
        primeiros_registros = CidadeAtendida.query.limit(10).all()
        
        return jsonify({
            'total_registros': total_registros,
            'transportadoras_unicas': transportadoras_unicas,
            'todas_transportadoras': todas_transportadoras,
            'distribuicao': distribuicao,
            'primeiros_registros': [{
                'id': r.id,
                'transportadora': r.transportadora,
                'cidade_destino': r.cidade_destino,
                'estado_atendido': r.estado_atendido
            } for r in primeiros_registros]
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Erro ao obter dados de debug'
        }), 500

@cidades_bp.route("/api/import", methods=["POST"])
@login_required
def api_import():
    """API para importar dados do Excel (apenas admins)"""
    from flask_login import current_user
    
    if current_user.role != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    
    try:
        # Executar importação
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        
        from app.seeds.import_cidades import importar_cidades
        
        # Contar registros antes da importação
        count_before = CidadeAtendida.query.count()
        
        # Executar importação
        importar_cidades()
        
        # Contar registros após importação
        count_after = CidadeAtendida.query.count()
        imported = count_after - count_before
        
        return jsonify({
            'success': True,
            'imported': imported,
            'total': count_after,
            'message': f'{imported} novos registros importados com sucesso!'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Erro ao importar dados'
        }), 500