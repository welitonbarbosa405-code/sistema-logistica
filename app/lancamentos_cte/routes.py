# Rotas para lançamentos fiscais de CTe
import os
import sqlite3
from flask import render_template, request, jsonify, send_file, flash, redirect, url_for
from flask_login import login_required
from . import lancamentos_cte_bp
from app.models import LancamentoFiscalCTE
from app.extensions import db

# Caminho do banco de dados
DB_INSTANCE = os.path.join(os.path.dirname(__file__), '../../instance/app.db')


def obter_conexao_banco():
    """Conecta ao banco de dados instance/app.db"""
    if not os.path.exists(DB_INSTANCE):
        raise Exception(f'Banco de dados não encontrado: {DB_INSTANCE}')
    
    conn = sqlite3.connect(DB_INSTANCE)
    conn.row_factory = sqlite3.Row
    return conn


def sincronizar_lancamentos_cte():
    """Sincroniza os lançamentos fiscais do banco SQLite para o modelo SQLAlchemy"""
    try:
        conn = obter_conexao_banco()
        cursor = conn.cursor()
        
        # Buscar todos os registros da tabela lancamento_fiscal
        cursor.execute('SELECT * FROM lancamento_fiscal')
        registros = cursor.fetchall()
        
        sincronizados = 0
        duplicados = 0
        
        for reg in registros:
            # Verificar se já existe
            existe = LancamentoFiscalCTE.query.filter_by(numero_cte=reg['numero_cte']).first()
            
            if not existe:
                novo = LancamentoFiscalCTE(
                    transportadora=reg.get('transportadora'),
                    numero_cte=reg.get('numero_cte'),
                    chave_cte=reg.get('chave_cte', ''),
                    data_emissao=reg.get('data_emissao'),
                    municipio_envio=reg.get('municipio_envio'),
                    uf_envio=reg.get('uf_envio'),
                    municipio_destino=reg.get('municipio_destino'),
                    uf_destino=reg.get('uf_destino'),
                    valor_frete=reg.get('valor_frete'),
                    valor_nota_fiscal=reg.get('valor_nota_fiscal'),
                    numero_fatura=reg.get('numero_fatura'),
                    venc_fatura=reg.get('venc_fatura'),
                    nota_fiscal=reg.get('nota_fiscal'),
                    centro_custo=reg.get('centro_custo'),
                    pdf_cte=reg.get('pdf_cte'),
                    pdf_fatura=reg.get('pdf_fatura'),
                    status_cte=reg.get('status_cte'),
                    data_lancamento=reg.get('data_lancamento')
                )
                db.session.add(novo)
                sincronizados += 1
            else:
                duplicados += 1
        
        db.session.commit()
        conn.close()
        
        return {
            'sucesso': True,
            'mensagem': f'Sincronização concluída: {sincronizados} novos registros, {duplicados} duplicados',
            'sincronizados': sincronizados,
            'duplicados': duplicados
        }
    
    except Exception as e:
        db.session.rollback()
        return {
            'sucesso': False,
            'mensagem': f'Erro na sincronização: {str(e)}'
        }


@lancamentos_cte_bp.route('/', methods=['GET'])
@login_required
def lista_lancamentos():
    """Lista todos os lançamentos fiscais de CTe diretamente do banco instance/app.db"""
    
    try:
        conn = obter_conexao_banco()
        cursor = conn.cursor()
        
        # Parâmetros de filtro
        transportadora = request.args.get('transportadora', '')
        uf_destino = request.args.get('uf_destino', '')
        status = request.args.get('status', '')
        data_lancamento = request.args.get('data_lancamento', '')
        pagina = request.args.get('pagina', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)  # Aumentado de 20 para 50
          # Construir query com filtros
        where_clauses = []
        params = []
        
        if transportadora:
            where_clauses.append("transportadora LIKE ?")
            params.append(f'%{transportadora}%')
        
        if uf_destino:
            where_clauses.append("uf_destino = ?")
            params.append(uf_destino.upper())
        
        if status == 'lancado':
            where_clauses.append("status_cte = ?")
            params.append('Lançado')
        elif status == 'sem_lancamento':
            where_clauses.append("status_cte = ?")
            params.append('Falta Lançamento')
        
        if data_lancamento:
            # data_lancamento vem no formato YYYY-MM-DD do input type="date"
            # Tentar comparar com diferentes formatos de data no banco
            where_clauses.append("(DATE(data_lancamento) = ? OR SUBSTR(data_lancamento, 7, 4) || '-' || SUBSTR(data_lancamento, 4, 2) || '-' || SUBSTR(data_lancamento, 1, 2) = ?)")
            params.extend([data_lancamento, data_lancamento])
        
        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        
        # Contar total de registros filtrados
        cursor.execute(f'SELECT COUNT(*) as total FROM lancamento_fiscal {where_sql}', params)
        total = cursor.fetchone()['total']
        
        # Buscar registros com paginação
        offset = (pagina - 1) * per_page
        cursor.execute(f'''
            SELECT * FROM lancamento_fiscal 
            {where_sql}
            ORDER BY data_lancamento DESC
            LIMIT ? OFFSET ?
        ''', params + [per_page, offset])
        
        lancamentos = cursor.fetchall()
        
        # Obter listas para filtros (transportadoras e UFs)
        cursor.execute('SELECT DISTINCT transportadora FROM lancamento_fiscal ORDER BY transportadora')
        transportadoras = [row['transportadora'] for row in cursor.fetchall() if row['transportadora']]
        
        cursor.execute('SELECT DISTINCT uf_destino FROM lancamento_fiscal ORDER BY uf_destino')
        ufs = [row['uf_destino'] for row in cursor.fetchall() if row['uf_destino']]
        
        # Calcular totais de TODOS os registros filtrados
        cursor.execute(f'''
            SELECT 
                SUM(CAST(valor_frete AS FLOAT)) as total_frete,
                SUM(CAST(valor_nota_fiscal AS FLOAT)) as total_nf,
                COUNT(DISTINCT transportadora) as total_transportadoras
            FROM lancamento_fiscal 
            {where_sql}
        ''', params)
        
        totais = cursor.fetchone()
        total_frete = totais['total_frete'] or 0
        total_nf = totais['total_nf'] or 0
        total_transportadoras = totais['total_transportadoras'] or 0
        
        conn.close()
        
        # Calcular páginas
        paginas = (total + per_page - 1) // per_page
        
        return render_template('lancamentos_cte_lista.html',
                              lancamentos=lancamentos,
                              total=total,
                              paginas=paginas,
                              pagina_atual=pagina,
                              total_frete=total_frete,
                              total_nf=total_nf,
                              total_transportadoras=total_transportadoras,
                              transportadoras=transportadoras,
                              ufs=ufs,
                              filtro_transportadora=transportadora,
                              filtro_uf=uf_destino,
                              filtro_status=status,
                              filtro_data=data_lancamento,
                              per_page=per_page)
    except Exception as e:
        flash(f'Erro ao carregar lançamentos: {str(e)}', 'error')
        print(f"ERRO NA LISTAGEM CTe: {str(e)}")
        import traceback
        print(traceback.format_exc())
        # Renderizar template com erro em vez de redirecionar para evitar loop
        return render_template('lancamentos_cte_lista.html',
                              lancamentos=[],
                              total=0,
                              paginas=0,
                              pagina_atual=1,
                              total_frete=0,
                              total_nf=0,
                              total_transportadoras=0,
                              transportadoras=[],
                              ufs=[],
                              filtro_transportadora='',
                              filtro_uf='',
                              filtro_status='',
                              filtro_data='')


@lancamentos_cte_bp.route('/detalhes/<int:id>', methods=['GET'])
@login_required
def detalhes_lancamento(id):
    """Mostra detalhes de um lançamento específico"""
    lancamento = LancamentoFiscalCTE.query.get_or_404(id)
    return render_template('lancamentos_cte_detalhes.html', lancamento=lancamento)


@lancamentos_cte_bp.route('/sincronizar', methods=['POST'])
@login_required
def sincronizar():
    """Sincroniza os dados do banco original"""
    resultado = sincronizar_lancamentos_cte()
    return jsonify(resultado)


@lancamentos_cte_bp.route('/api/dados', methods=['GET'])
@login_required
def api_dados():
    """API para retornar dados em JSON (útil para gráficos/relatórios)"""
    
    # Filtros
    transportadora = request.args.get('transportadora', '')
    uf_destino = request.args.get('uf_destino', '')
    
    query = LancamentoFiscalCTE.query
    
    if transportadora:
        query = query.filter(LancamentoFiscalCTE.transportadora.ilike(f'%{transportadora}%'))
    
    if uf_destino:
        query = query.filter(LancamentoFiscalCTE.uf_destino == uf_destino.upper())
    
    lancamentos = query.all()
    
    # Calcular totais
    total_frete = sum(l.valor_frete or 0 for l in lancamentos)
    total_nf = sum(l.valor_nota_fiscal or 0 for l in lancamentos)
    
    # Agrupar por transportadora
    por_transportadora = {}
    for l in lancamentos:
        if l.transportadora not in por_transportadora:
            por_transportadora[l.transportadora] = 0
        por_transportadora[l.transportadora] += l.valor_frete or 0
    
    return jsonify({
        'total_lancamentos': len(lancamentos),
        'total_frete': total_frete,
        'total_nota_fiscal': total_nf,
        'por_transportadora': por_transportadora,
        'lancamentos': [l.to_dict() for l in lancamentos]
    })


@lancamentos_cte_bp.route('/pdf/<tipo>/<path:caminho>', methods=['GET'])
@login_required
def download_pdf(tipo, caminho):
    """Faz download do PDF (CTE ou Fatura)"""
    try:
        # Segurança: validar caminho
        caminho_seguro = os.path.normpath(caminho)
        # Converter barras invertidas para forward slash após normalizar
        caminho_seguro = caminho_seguro.replace('\\', '/')
        if '..' in caminho_seguro:
            return "Acesso negado", 403
        
        # Construir caminho completo
        pasta_base = os.path.join(os.path.dirname(__file__), '../../Automação CTe')
        # Converter para windows path novamente para o join
        caminho_completo = os.path.join(pasta_base, caminho_seguro.replace('/', '\\'))
        
        if not os.path.exists(caminho_completo):
            return f"Arquivo não encontrado: {caminho_completo}", 404
        
        return send_file(caminho_completo, as_attachment=True)
    
    except Exception as e:
        return f"Erro ao download: {str(e)}", 500


@lancamentos_cte_bp.route('/view-pdf/<path:caminho>', methods=['GET'])
@login_required
def view_pdf(caminho):
    """Visualiza o PDF em inline (não faz download)"""
    try:
        # Segurança: validar caminho
        caminho_seguro = os.path.normpath(caminho)
        # Converter barras invertidas para forward slash
        caminho_seguro = caminho_seguro.replace('\\', '/')
        if '..' in caminho_seguro:
            return "Acesso negado", 403
        
        # Construir caminho completo
        pasta_base = os.path.join(os.path.dirname(__file__), '../../Automação CTe')
        # Converter para windows path novamente para o join
        caminho_completo = os.path.join(pasta_base, caminho_seguro.replace('/', '\\'))
        
        if not os.path.exists(caminho_completo):
            return "Arquivo não encontrado", 404
        
        return send_file(caminho_completo, mimetype='application/pdf')
    
    except Exception as e:
        return f"Erro ao visualizar PDF: {str(e)}", 500


@lancamentos_cte_bp.route('/debug-pdf/<path:caminho>', methods=['GET'])
@login_required
def debug_pdf(caminho):
    """Debug: mostrar o caminho recebido"""
    print(f"\n=== DEBUG PDF ===")
    print(f"Caminho recebido: {repr(caminho)}")
    print(f"Caminho normalizado: {repr(os.path.normpath(caminho))}")
    print(f"Caminho com / : {repr(caminho.replace(chr(92), '/'))}")
    
    pasta_base = os.path.join(os.path.dirname(__file__), '../../Automação CTe')
    caminho_teste = os.path.join(pasta_base, caminho)
    print(f"Caminho teste: {repr(caminho_teste)}")
    print(f"Existe? {os.path.exists(caminho_teste)}")
    print(f"=================\n")
    
    return "Debug OK", 200
