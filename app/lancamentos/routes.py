# Rotas para lançamentos fiscais
import os
import io
from flask import render_template, request, redirect, url_for, flash, send_from_directory, jsonify, Response
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from datetime import datetime
from sqlalchemy import func
from ..extensions import db
from ..models import LancamentoFiscal
from . import lancamentos_bp

UPLOAD_FOLDER = 'app/static/fiscais'
ALLOWED_EXTENSIONS = {'pdf'}

# Garante que a pasta existe
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@lancamentos_bp.route('/lancamentos/upload', methods=['GET', 'POST'])
@login_required
def upload_lancamento():
    if request.method == 'POST':
        try:
            file = request.files.get('arquivo')
            transportadora = request.form.get('transportadora')
            numero_fatura = request.form.get('numero_fatura')
            valor_fatura_str = request.form.get('valor_fatura')
            data_vencimento_str = request.form.get('data_vencimento')
            
            # Converter valor_fatura para float
            valor_fatura = None
            if valor_fatura_str:
                try:
                    valor_fatura = float(valor_fatura_str)
                except ValueError:
                    valor_fatura = None
            
            # Converter data_vencimento para date
            data_vencimento = None
            if data_vencimento_str:
                try:
                    data_vencimento = datetime.strptime(data_vencimento_str, '%Y-%m-%d').date()
                except ValueError:
                    data_vencimento = None
            
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Adiciona timestamp para evitar sobrescrever arquivos com mesmo nome
                nome_base, extensao = os.path.splitext(filename)
                filename = f"{nome_base}_{datetime.now().strftime('%Y%m%d%H%M%S')}{extensao}"
                caminho = os.path.join(UPLOAD_FOLDER, filename)
                file.save(caminho)
                lanc = LancamentoFiscal(
                    nome_arquivo=filename,
                    caminho_arquivo=caminho,
                    usuario_id=current_user.id,
                    data_upload=datetime.utcnow(),
                    transportadora=transportadora,
                    numero_fatura=numero_fatura,
                    valor_fatura=valor_fatura,
                    data_vencimento=data_vencimento
                )
                db.session.add(lanc)
                db.session.commit()
                flash('Fatura enviada com sucesso!', 'success')
                return redirect(url_for('lancamentos.lista_lancamentos'))
            else:
                flash('Arquivo inválido ou ausente. Envie um PDF.', 'danger')
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao enviar fatura: {str(e)}', 'danger')
    
    # Buscar lista de transportadoras existentes para autocomplete
    transportadoras = db.session.query(LancamentoFiscal.transportadora).distinct().order_by(LancamentoFiscal.transportadora).all()
    transportadoras = [t[0] for t in transportadoras if t[0]]
    
    # Data de hoje para limitar o campo de data
    hoje = datetime.now().strftime('%Y-%m-%d')
    
    return render_template('lancamentos_upload.html', transportadoras=transportadoras, hoje=hoje)

@lancamentos_bp.route('/lancamentos')
@login_required
def lista_lancamentos():
    from datetime import date, timedelta
    
    # Filtros
    filtro_transportadora = request.args.get('transportadora', '').strip()
    filtro_numero = request.args.get('numero_fatura', '').strip()
    filtro_data_inicio = request.args.get('data_inicio', '').strip()
    filtro_data_fim = request.args.get('data_fim', '').strip()
    filtro_status = request.args.get('status', '').strip()
    busca_rapida = request.args.get('busca', '').strip()
    
    # Ordenação
    ordenar_por = request.args.get('ordenar', 'data_vencimento')
    direcao = request.args.get('direcao', 'asc')
    
    # Paginação
    pagina = request.args.get('pagina', 1, type=int)
    por_pagina = request.args.get('por_pagina', 15, type=int)
    
    # Visualização
    visualizacao = request.args.get('view', 'tabela')  # tabela ou cards
    
    query = LancamentoFiscal.query
    
    # Busca rápida (pesquisa em vários campos)
    if busca_rapida:
        query = query.filter(
            db.or_(
                LancamentoFiscal.transportadora.ilike(f'%{busca_rapida}%'),
                LancamentoFiscal.numero_fatura.ilike(f'%{busca_rapida}%')
            )
        )
    
    if filtro_transportadora:
        query = query.filter(LancamentoFiscal.transportadora.ilike(f'%{filtro_transportadora}%'))
    if filtro_numero:
        query = query.filter(LancamentoFiscal.numero_fatura.ilike(f'%{filtro_numero}%'))
    if filtro_data_inicio:
        try:
            data_inicio = datetime.strptime(filtro_data_inicio, '%Y-%m-%d').date()
            query = query.filter(LancamentoFiscal.data_vencimento >= data_inicio)
        except ValueError:
            pass
    if filtro_data_fim:
        try:
            data_fim = datetime.strptime(filtro_data_fim, '%Y-%m-%d').date()
            query = query.filter(LancamentoFiscal.data_vencimento <= data_fim)
        except ValueError:
            pass
    
    # Filtro por status
    hoje = date.today()
    if filtro_status:
        if filtro_status == 'vencida':
            query = query.filter(
                LancamentoFiscal.data_vencimento < hoje,
                LancamentoFiscal.status.notin_(['paga', 'cancelada'])
            )
        elif filtro_status == 'pendente':
            query = query.filter(
                db.or_(
                    LancamentoFiscal.data_vencimento >= hoje,
                    LancamentoFiscal.data_vencimento.is_(None)
                ),
                LancamentoFiscal.status.notin_(['paga', 'cancelada'])
            )
        else:
            query = query.filter(LancamentoFiscal.status == filtro_status)
    
    # Aplicar ordenação
    colunas_ordenacao = {
        'transportadora': LancamentoFiscal.transportadora,
        'numero_fatura': LancamentoFiscal.numero_fatura,
        'valor': LancamentoFiscal.valor_fatura,
        'data_vencimento': LancamentoFiscal.data_vencimento,
        'data_upload': LancamentoFiscal.data_upload,
        'status': LancamentoFiscal.status
    }
    
    coluna_ordem = colunas_ordenacao.get(ordenar_por, LancamentoFiscal.data_vencimento)
    if direcao == 'desc':
        query = query.order_by(coluna_ordem.desc().nullslast())
    else:
        query = query.order_by(coluna_ordem.asc().nullsfirst())
    
    # Total de registros (antes da paginação)
    total_registros = query.count()
    
    # Aplicar paginação
    paginacao = query.paginate(page=pagina, per_page=por_pagina, error_out=False)
    lancamentos = paginacao.items
    
    # Lista de transportadoras para o filtro
    transportadoras = db.session.query(LancamentoFiscal.transportadora).distinct().order_by(LancamentoFiscal.transportadora).all()
    transportadoras = [t[0] for t in transportadoras if t[0]]
    
    # Estatísticas gerais (sem filtros)
    total_faturas = LancamentoFiscal.query.count()
    valor_total = db.session.query(func.sum(LancamentoFiscal.valor_fatura)).scalar() or 0
    
    # Estatísticas por status
    faturas_vencidas = LancamentoFiscal.query.filter(
        LancamentoFiscal.data_vencimento < hoje,
        LancamentoFiscal.status.notin_(['paga', 'cancelada'])
    ).count()
    
    faturas_pagas = LancamentoFiscal.query.filter(LancamentoFiscal.status == 'paga').count()
    
    valor_vencido = db.session.query(func.sum(LancamentoFiscal.valor_fatura)).filter(
        LancamentoFiscal.data_vencimento < hoje,
        LancamentoFiscal.status.notin_(['paga', 'cancelada'])
    ).scalar() or 0
    
    # Faturas a vencer nos próximos 7 dias
    proximos_7_dias = hoje + timedelta(days=7)
    faturas_a_vencer = LancamentoFiscal.query.filter(
        LancamentoFiscal.data_vencimento >= hoje,
        LancamentoFiscal.data_vencimento <= proximos_7_dias,
        LancamentoFiscal.status.notin_(['paga', 'cancelada'])
    ).count()
    
    return render_template('lancamentos_lista.html', 
                           lancamentos=lancamentos,
                           paginacao=paginacao,
                           transportadoras=transportadoras,
                           filtro_transportadora=filtro_transportadora,
                           filtro_numero=filtro_numero,
                           filtro_data_inicio=filtro_data_inicio,
                           filtro_data_fim=filtro_data_fim,
                           filtro_status=filtro_status,
                           busca_rapida=busca_rapida,
                           ordenar_por=ordenar_por,
                           direcao=direcao,
                           visualizacao=visualizacao,
                           total_faturas=total_faturas,
                           total_registros=total_registros,
                           valor_total=valor_total,
                           faturas_vencidas=faturas_vencidas,
                           faturas_pagas=faturas_pagas,
                           valor_vencido=valor_vencido,
                           faturas_a_vencer=faturas_a_vencer,
                           today=hoje)

@lancamentos_bp.route('/lancamentos/download/<int:lanc_id>')
@login_required
def download_lancamento(lanc_id):
    lanc = LancamentoFiscal.query.get_or_404(lanc_id)
    # Converte o caminho relativo para absoluto
    caminho_absoluto = os.path.abspath(lanc.caminho_arquivo)
    pasta, nome = os.path.split(caminho_absoluto)
    return send_from_directory(pasta, nome, as_attachment=True)

@lancamentos_bp.route('/lancamentos/visualizar/<int:lanc_id>')
@login_required
def visualizar_lancamento(lanc_id):
    lanc = LancamentoFiscal.query.get_or_404(lanc_id)
    # Converte o caminho relativo para absoluto
    caminho_absoluto = os.path.abspath(lanc.caminho_arquivo)
    pasta, nome = os.path.split(caminho_absoluto)
    return send_from_directory(pasta, nome, as_attachment=False)

@lancamentos_bp.route('/lancamentos/excluir/<int:lanc_id>', methods=['POST'])
@login_required
def excluir_lancamento(lanc_id):
    lanc = LancamentoFiscal.query.get_or_404(lanc_id)
    try:
        # Remove o arquivo físico
        if os.path.exists(lanc.caminho_arquivo):
            os.remove(lanc.caminho_arquivo)
        # Remove do banco
        db.session.delete(lanc)
        db.session.commit()
        flash('Fatura excluída com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao excluir fatura: {str(e)}', 'danger')
    return redirect(url_for('lancamentos.lista_lancamentos'))

@lancamentos_bp.route('/lancamentos/editar/<int:lanc_id>', methods=['GET', 'POST'])
@login_required
def editar_lancamento(lanc_id):
    lanc = LancamentoFiscal.query.get_or_404(lanc_id)
    
    if request.method == 'POST':
        try:
            lanc.transportadora = request.form.get('transportadora')
            lanc.numero_fatura = request.form.get('numero_fatura')
            
            valor_fatura_str = request.form.get('valor_fatura')
            if valor_fatura_str:
                try:
                    lanc.valor_fatura = float(valor_fatura_str)
                except ValueError:
                    lanc.valor_fatura = None
            else:
                lanc.valor_fatura = None
            
            data_vencimento_str = request.form.get('data_vencimento')
            if data_vencimento_str:
                try:
                    lanc.data_vencimento = datetime.strptime(data_vencimento_str, '%Y-%m-%d').date()
                except ValueError:
                    lanc.data_vencimento = None
            else:
                lanc.data_vencimento = None
            
            # Se enviou novo arquivo
            file = request.files.get('arquivo')
            if file and file.filename and allowed_file(file.filename):                # Remove arquivo antigo
                if os.path.exists(lanc.caminho_arquivo):
                    os.remove(lanc.caminho_arquivo)
                # Salva novo arquivo
                filename = secure_filename(file.filename)
                nome_base, extensao = os.path.splitext(filename)
                filename = f"{nome_base}_{datetime.now().strftime('%Y%m%d%H%M%S')}{extensao}"
                caminho = os.path.join(UPLOAD_FOLDER, filename)
                file.save(caminho)
                lanc.nome_arquivo = filename
                lanc.caminho_arquivo = caminho
            
            db.session.commit()
            flash('Fatura atualizada com sucesso!', 'success')
            return redirect(url_for('lancamentos.lista_lancamentos'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao atualizar fatura: {str(e)}', 'danger')
    return render_template('lancamentos_editar.html', lancamento=lanc)


# ===== ROTAS PARA GERENCIAR STATUS =====

@lancamentos_bp.route('/lancamentos/marcar-paga/<int:lanc_id>', methods=['POST'])
@login_required
def marcar_paga(lanc_id):
    """Marca uma fatura como paga"""
    from datetime import date
    lanc = LancamentoFiscal.query.get_or_404(lanc_id)
    try:
        lanc.status = 'paga'
        lanc.data_pagamento = date.today()
        db.session.commit()
        flash(f'Fatura {lanc.numero_fatura} marcada como PAGA!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao marcar fatura como paga: {str(e)}', 'danger')
    return redirect(url_for('lancamentos.lista_lancamentos'))


@lancamentos_bp.route('/lancamentos/cancelar/<int:lanc_id>', methods=['POST'])
@login_required
def cancelar_fatura(lanc_id):
    """Cancela uma fatura"""
    lanc = LancamentoFiscal.query.get_or_404(lanc_id)
    try:
        lanc.status = 'cancelada'
        db.session.commit()
        flash(f'Fatura {lanc.numero_fatura} foi CANCELADA!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao cancelar fatura: {str(e)}', 'danger')
    return redirect(url_for('lancamentos.lista_lancamentos'))


@lancamentos_bp.route('/lancamentos/reabrir/<int:lanc_id>', methods=['POST'])
@login_required
def reabrir_fatura(lanc_id):
    """Reabre uma fatura (volta para pendente)"""
    lanc = LancamentoFiscal.query.get_or_404(lanc_id)
    try:
        lanc.status = 'pendente'
        lanc.data_pagamento = None
        db.session.commit()
        flash(f'Fatura {lanc.numero_fatura} foi REABERTA!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao reabrir fatura: {str(e)}', 'danger')
    return redirect(url_for('lancamentos.lista_lancamentos'))


@lancamentos_bp.route('/lancamentos/api/atualizar-status/<int:lanc_id>', methods=['POST'])
@login_required
def api_atualizar_status(lanc_id):
    """API para atualizar status via AJAX"""
    from datetime import date
    lanc = LancamentoFiscal.query.get_or_404(lanc_id)
    data = request.get_json()
    novo_status = data.get('status')
    
    if novo_status not in ['pendente', 'paga', 'cancelada']:
        return jsonify({'error': 'Status inválido'}), 400
    
    try:
        lanc.status = novo_status
        if novo_status == 'paga':
            lanc.data_pagamento = date.today()
        elif novo_status == 'pendente':
            lanc.data_pagamento = None
        
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Status atualizado para {novo_status}',
            'status': lanc.status_calculado,
            'status_display': lanc.status_display,
            'status_cor': lanc.status_cor
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lancamentos_bp.route('/lancamentos/exportar')
@login_required
def exportar_excel():
    """Exporta os lançamentos filtrados para Excel/CSV"""
    # Aplica os mesmos filtros da listagem
    filtro_transportadora = request.args.get('transportadora', '').strip()
    filtro_numero = request.args.get('numero_fatura', '').strip()
    filtro_data_inicio = request.args.get('data_inicio', '').strip()
    filtro_data_fim = request.args.get('data_fim', '').strip()
    
    query = LancamentoFiscal.query
    
    if filtro_transportadora:
        query = query.filter(LancamentoFiscal.transportadora.ilike(f'%{filtro_transportadora}%'))
    if filtro_numero:
        query = query.filter(LancamentoFiscal.numero_fatura.ilike(f'%{filtro_numero}%'))
    if filtro_data_inicio:
        try:
            data_inicio = datetime.strptime(filtro_data_inicio, '%Y-%m-%d').date()
            query = query.filter(LancamentoFiscal.data_vencimento >= data_inicio)
        except ValueError:
            pass
    if filtro_data_fim:
        try:
            data_fim = datetime.strptime(filtro_data_fim, '%Y-%m-%d').date()
            query = query.filter(LancamentoFiscal.data_vencimento <= data_fim)
        except ValueError:
            pass
    
    lancamentos = query.order_by(LancamentoFiscal.data_upload.desc()).all()
    
    # Cria o CSV
    output = io.StringIO()
    output.write('\ufeff')  # BOM para Excel reconhecer UTF-8
    output.write('Transportadora;Número Fatura;Valor (R$);Data Vencimento;Usuário;Data Upload\n')
    
    for lanc in lancamentos:
        valor = f"{lanc.valor_fatura:.2f}".replace('.', ',') if lanc.valor_fatura else ''
        data_vencimento = lanc.data_vencimento.strftime('%d/%m/%Y') if lanc.data_vencimento else ''
        data_upload = lanc.data_upload.strftime('%d/%m/%Y %H:%M') if lanc.data_upload else ''
        usuario = lanc.usuario.email if lanc.usuario else ''
        
        output.write(f'{lanc.transportadora};{lanc.numero_fatura};{valor};{data_vencimento};{usuario};{data_upload}\n')
    
    output.seek(0)
    
    # Nome do arquivo com data atual
    filename = f"lancamentos_fiscais_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )


@lancamentos_bp.route('/lancamentos/api/dashboard')
@login_required
def api_dashboard():
    """API para dados do dashboard de gráficos com filtros"""
    from datetime import date, timedelta
    from calendar import monthrange
    import calendar
    
    hoje = date.today()
    
    # Receber filtros da query string
    transportadora = request.args.get('transportadora', '').strip()
    numero_fatura = request.args.get('numero_fatura', '').strip()
    data_inicio = request.args.get('data_inicio', '').strip()
    data_fim = request.args.get('data_fim', '').strip()
    status_filtro = request.args.get('status', '').strip()
    
    print(f'[DEBUG API] Filtros recebidos: transportadora={transportadora}, numero_fatura={numero_fatura}, data_inicio={data_inicio}, data_fim={data_fim}, status={status_filtro}')
    
    # Construir query base com filtros
    query_base = LancamentoFiscal.query
    
    if transportadora:
        print(f'[DEBUG] Filtrando por transportadora: {transportadora}')
        query_base = query_base.filter(LancamentoFiscal.transportadora == transportadora)
    
    if numero_fatura:
        print(f'[DEBUG] Filtrando por numero_fatura: {numero_fatura}')
        query_base = query_base.filter(LancamentoFiscal.numero_fatura.ilike(f'%{numero_fatura}%'))
    
    if data_inicio:
        try:
            dt_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
            print(f'[DEBUG] Filtrando por data_inicio: {dt_inicio}')
            query_base = query_base.filter(LancamentoFiscal.data_vencimento >= dt_inicio)
        except Exception as e:
            print(f'[DEBUG ERROR] Erro ao parsear data_inicio: {e}')
    
    if data_fim:
        try:
            dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
            print(f'[DEBUG] Filtrando por data_fim: {dt_fim}')
            query_base = query_base.filter(LancamentoFiscal.data_vencimento <= dt_fim)
        except Exception as e:
            print(f'[DEBUG ERROR] Erro ao parsear data_fim: {e}')
    
    if status_filtro:
        print(f'[DEBUG] Filtrando por status: {status_filtro}')
        if status_filtro == 'pendente':
            query_base = query_base.filter(
                db.or_(
                    LancamentoFiscal.data_vencimento >= hoje,
                    LancamentoFiscal.data_vencimento.is_(None)
                ),
                LancamentoFiscal.status.notin_(['paga', 'cancelada'])
            )
        elif status_filtro == 'vencida':
            query_base = query_base.filter(
                LancamentoFiscal.data_vencimento < hoje,
                LancamentoFiscal.status.notin_(['paga', 'cancelada'])
            )
        elif status_filtro == 'paga':
            query_base = query_base.filter(LancamentoFiscal.status == 'paga')
        elif status_filtro == 'cancelada':
            query_base = query_base.filter(LancamentoFiscal.status == 'cancelada')
    
    # Contar registros após filtros
    total_com_filtros = query_base.count()
    print(f'[DEBUG] Total de registros após filtros: {total_com_filtros}')
    
    # Faturas por mês (últimos 6 meses) - COM FILTROS
    faturas_por_mes = []
    valores_por_mes = []
    meses_labels = []
    
    for i in range(5, -1, -1):
        # Calcula o mês
        mes_data = hoje.replace(day=1) - timedelta(days=i*30)
        ano = mes_data.year
        mes = mes_data.month
        
        # Primeiro e último dia do mês
        _, ultimo_dia = monthrange(ano, mes)
        inicio_mes = date(ano, mes, 1)
        fim_mes = date(ano, mes, ultimo_dia)
        
        # Conta faturas do mês (pelo vencimento) com filtros
        count = query_base.filter(
            LancamentoFiscal.data_vencimento >= inicio_mes,
            LancamentoFiscal.data_vencimento <= fim_mes
        ).count()
        
        # Soma valores do mês com filtros
        valor = query_base.filter(
            LancamentoFiscal.data_vencimento >= inicio_mes,
            LancamentoFiscal.data_vencimento <= fim_mes
        ).with_entities(func.sum(LancamentoFiscal.valor_fatura)).scalar() or 0
        
        faturas_por_mes.append(count)
        valores_por_mes.append(float(valor))
        
        # Nome do mês em português
        nomes_meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        meses_labels.append(f"{nomes_meses[mes-1]}/{str(ano)[2:]}")
    
    # Faturas por transportadora (top 5) - COM FILTROS
    transportadoras_query = query_base.with_entities(
        LancamentoFiscal.transportadora,
        func.count(LancamentoFiscal.id).label('total'),
        func.sum(LancamentoFiscal.valor_fatura).label('valor')
    ).group_by(LancamentoFiscal.transportadora).order_by(func.sum(LancamentoFiscal.valor_fatura).desc()).limit(5).all()
    
    transportadoras_labels = [t[0] or 'Sem nome' for t in transportadoras_query]
    transportadoras_count = [t[1] for t in transportadoras_query]
    transportadoras_valores = [float(t[2] or 0) for t in transportadoras_query]
    
    # Status das faturas - COM FILTROS
    status_pendente = query_base.filter(
        db.or_(
            LancamentoFiscal.data_vencimento >= hoje,
            LancamentoFiscal.data_vencimento.is_(None)
        ),
        LancamentoFiscal.status.notin_(['paga', 'cancelada'])
    ).count()
    
    status_vencida = query_base.filter(
        LancamentoFiscal.data_vencimento < hoje,
        LancamentoFiscal.status.notin_(['paga', 'cancelada'])
    ).count()
    
    status_paga = query_base.filter(LancamentoFiscal.status == 'paga').count()
    status_cancelada = query_base.filter(LancamentoFiscal.status == 'cancelada').count()
    
    return jsonify({
        'faturas_por_mes': {
            'labels': meses_labels,
            'quantidades': faturas_por_mes,
            'valores': valores_por_mes
        },
        'transportadoras': {
            'labels': transportadoras_labels,
            'quantidades': transportadoras_count,
            'valores': transportadoras_valores
        },
        'status': {
            'labels': ['Pendente', 'Vencida', 'Paga', 'Cancelada'],
            'valores': [status_pendente, status_vencida, status_paga, status_cancelada],
            'cores': ['#eab308', '#ef4444', '#22c55e', '#6b7280']
        }
    })


@lancamentos_bp.route('/lancamentos/api/busca')
@login_required
def api_busca_rapida():
    """API para busca rápida em tempo real"""
    from datetime import date
    
    termo = request.args.get('q', '').strip()
    if len(termo) < 2:
        return jsonify([])
    
    hoje = date.today()
    
    lancamentos = LancamentoFiscal.query.filter(
        db.or_(
            LancamentoFiscal.transportadora.ilike(f'%{termo}%'),
            LancamentoFiscal.numero_fatura.ilike(f'%{termo}%')
        )
    ).order_by(LancamentoFiscal.data_vencimento.desc()).limit(10).all()
    
    resultados = []
    for lanc in lancamentos:
        resultados.append({
            'id': lanc.id,
            'transportadora': lanc.transportadora,
            'numero_fatura': lanc.numero_fatura,
            'valor': float(lanc.valor_fatura) if lanc.valor_fatura else None,
            'valor_formatado': f"R$ {lanc.valor_fatura:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.') if lanc.valor_fatura else '-',
            'data_vencimento': lanc.data_vencimento.strftime('%d/%m/%Y') if lanc.data_vencimento else '-',
            'status': lanc.status_calculado,
            'url_visualizar': url_for('lancamentos.visualizar_lancamento', lanc_id=lanc.id)
        })
    
    return jsonify(resultados)
