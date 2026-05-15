from flask import render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from . import divergencias_bp
from app.extensions import db
from app.models import DivergenciaNotaFiscal
from datetime import datetime
import urllib.parse

@divergencias_bp.route("/")
@login_required
def index():
    """Página principal de divergências de notas fiscais"""
    from collections import Counter

    visualizacao      = request.args.get('view', 'tabela')
    busca             = request.args.get('busca', '').strip()
    filtro_fornecedor = request.args.get('fornecedor', '').strip()
    filtro_comprador  = request.args.get('comprador', '').strip()
    filtro_data_inicio = request.args.get('data_inicio', '').strip()
    filtro_data_fim    = request.args.get('data_fim', '').strip()

    try:
        todas = DivergenciaNotaFiscal.query.order_by(DivergenciaNotaFiscal.created_at.desc()).all()

        # Listas para dropdowns (sempre do total)
        lista_fornecedores = sorted(set(d.fornecedor for d in todas if d.fornecedor))
        lista_compradores  = sorted(set(d.comprador  for d in todas if d.comprador))

        # Aplicar filtros
        divergencias = todas
        if busca:
            b = busca.lower()
            divergencias = [d for d in divergencias if
                            b in (d.nota_fiscal or '').lower() or
                            b in (d.fornecedor  or '').lower() or
                            b in (d.divergencia or '').lower() or
                            b in (d.comprador   or '').lower()]
        if filtro_fornecedor:
            divergencias = [d for d in divergencias if d.fornecedor == filtro_fornecedor]
        if filtro_comprador:
            divergencias = [d for d in divergencias if d.comprador == filtro_comprador]
        if filtro_data_inicio:
            divergencias = [d for d in divergencias if d.data and d.data >= filtro_data_inicio]
        if filtro_data_fim:
            divergencias = [d for d in divergencias if d.data and d.data <= filtro_data_fim]

        total              = len(divergencias)
        total_fornecedores = len(set(d.fornecedor for d in divergencias if d.fornecedor))
        total_compradores  = len(set(d.comprador  for d in divergencias if d.comprador))

        fornecedores_count       = Counter(d.fornecedor for d in divergencias if d.fornecedor)
        top_fornecedores_labels  = [k for k, v in fornecedores_count.most_common(5)]
        top_fornecedores_dados   = [v for k, v in fornecedores_count.most_common(5)]

        compradores_count        = Counter(d.comprador for d in divergencias if d.comprador)
        top_compradores_labels   = [k for k, v in compradores_count.most_common(5)]
        top_compradores_dados    = [v for k, v in compradores_count.most_common(5)]

        hoje = datetime.now()
        meses_labels, meses_dados = [], []
        for i in range(5, -1, -1):
            year, month = hoje.year, hoje.month - i
            while month <= 0:
                month += 12
                year  -= 1
            label   = datetime(year, month, 1).strftime('%b/%y')
            mes_key = f"{year:04d}-{month:02d}"
            meses_labels.append(label)
            meses_dados.append(sum(1 for d in divergencias if d.data and d.data[:7] == mes_key))

        filtros_ativos = bool(busca or filtro_fornecedor or filtro_comprador or filtro_data_inicio or filtro_data_fim)
        qtd_filtros    = sum([bool(busca), bool(filtro_fornecedor), bool(filtro_comprador),
                              bool(filtro_data_inicio), bool(filtro_data_fim)])

        divergencias_tipo_count  = Counter(d.divergencia.strip().upper() for d in divergencias if d.divergencia)
        top_divergencias_labels  = [k for k, v in divergencias_tipo_count.most_common(15)]
        top_divergencias_dados   = [v for k, v in divergencias_tipo_count.most_common(15)]

        dashboard_data = {
            'total': total,
            'total_fornecedores': total_fornecedores,
            'total_compradores':  total_compradores,
            'top_fornecedores_labels': top_fornecedores_labels,
            'top_fornecedores_dados':  top_fornecedores_dados,
            'top_compradores_labels':  top_compradores_labels,
            'top_compradores_dados':   top_compradores_dados,
            'meses_labels': meses_labels,
            'meses_dados':  meses_dados,
            'divergencias_tipo_labels': top_divergencias_labels,
            'divergencias_tipo_dados':  top_divergencias_dados,
        }

        return render_template('divergencias_index.html',
                               divergencias=divergencias,
                               visualizacao=visualizacao,
                               dashboard_data=dashboard_data,
                               lista_fornecedores=lista_fornecedores,
                               lista_compradores=lista_compradores,
                               busca=busca,
                               filtro_fornecedor=filtro_fornecedor,
                               filtro_comprador=filtro_comprador,
                               filtro_data_inicio=filtro_data_inicio,
                               filtro_data_fim=filtro_data_fim,
                               filtros_ativos=filtros_ativos,
                               qtd_filtros=qtd_filtros)
    except Exception as e:
        import traceback
        print(f"Erro ao carregar divergências: {str(e)}")
        print(traceback.format_exc())
        flash(f'Erro ao carregar divergências: {str(e)}', 'error')
        return render_template('divergencias_index.html', divergencias=[], visualizacao='tabela',
                               dashboard_data={}, lista_fornecedores=[], lista_compradores=[],
                               busca='', filtro_fornecedor='', filtro_comprador='',
                               filtro_data_inicio='', filtro_data_fim='',
                               filtros_ativos=False, qtd_filtros=0)

@divergencias_bp.route("/cadastrar", methods=["GET", "POST"])
@login_required
def cadastrar():
    """Página para cadastrar nova divergência"""
    if request.method == "POST":
        try:
            divergencia = DivergenciaNotaFiscal(
                data=request.form.get('data'),
                nota_fiscal=request.form.get('nota_fiscal'),
                fornecedor=request.form.get('fornecedor'),
                divergencia=request.form.get('divergencia'),
                ordem_compra=request.form.get('ordem_compra'),
                item=request.form.get('item'),
                comprador=request.form.get('comprador'),
                provider=request.form.get('provider'),
                email_provider=request.form.get('email_provider')
            )
            db.session.add(divergencia)
            db.session.commit()
            flash('Divergência cadastrada com sucesso!', 'success')
            return redirect(url_for('divergencias.index'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao cadastrar divergência: {str(e)}', 'error')
            return render_template('divergencias_cadastrar.html')
    
    return render_template('divergencias_cadastrar.html')

@divergencias_bp.route("/editar/<int:id>", methods=["GET", "POST"])
@login_required
def editar(id):
    """Página para editar uma divergência"""
    divergencia = DivergenciaNotaFiscal.query.get_or_404(id)
    
    if request.method == "POST":
        try:
            divergencia.data = request.form.get('data')
            divergencia.nota_fiscal = request.form.get('nota_fiscal')
            divergencia.fornecedor = request.form.get('fornecedor')
            divergencia.divergencia = request.form.get('divergencia')
            divergencia.ordem_compra = request.form.get('ordem_compra')
            divergencia.item = request.form.get('item')
            divergencia.comprador = request.form.get('comprador')
            divergencia.provider = request.form.get('provider')
            divergencia.email_provider = request.form.get('email_provider')
            
            db.session.commit()
            flash('Divergência atualizada com sucesso!', 'success')
            return redirect(url_for('divergencias.index'))
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao atualizar divergência: {str(e)}', 'error')
    
    return render_template('divergencias_editar.html', divergencia=divergencia)

@divergencias_bp.route("/deletar/<int:id>", methods=["POST"])
@login_required
def deletar(id):
    """Deleta uma divergência"""
    try:
        divergencia = DivergenciaNotaFiscal.query.get_or_404(id)
        db.session.delete(divergencia)
        db.session.commit()
        flash('Divergência deletada com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao deletar divergência: {str(e)}', 'error')
    
    return redirect(url_for('divergencias.index'))

@divergencias_bp.route("/api/listar", methods=["GET"])
@login_required
def api_listar():
    """API para listar divergências em JSON"""
    divergencias = DivergenciaNotaFiscal.query.all()
    return jsonify([{
        'id': d.id,
        'data': d.data,
        'nota_fiscal': d.nota_fiscal,
        'fornecedor': d.fornecedor,
        'divergencia': d.divergencia,
        'ordem_compra': d.ordem_compra,
        'item': d.item,
        'comprador': d.comprador,
        'provider': d.provider,
        'email_provider': d.email_provider
    } for d in divergencias])

@divergencias_bp.route("/enviar-email", methods=["POST"])
@login_required
def enviar_email():
    """Processa envio de email para provider e retorna dados para abrir Outlook"""
    try:
        email_provider = request.form.get('email_provider', '').strip()
        divergencia = request.form.get('divergencia', '').strip()
        nota_fiscal = request.form.get('nota_fiscal', '').strip()
        fornecedor = request.form.get('fornecedor', '').strip()
        provider = request.form.get('provider', '').strip()
        
        # Validar dados obrigatórios
        if not email_provider or not divergencia:
            return jsonify({
                'success': False, 
                'message': 'Email do provider e descrição da divergência são obrigatórios!'
            }), 400
        
        # Criar assunto do email
        assunto = f"DIVERGÊNCIA - Nota Fiscal {nota_fiscal} - {fornecedor}"
        
        # Criar corpo do email
        corpo_email = f"""Prezado(a) {provider or 'Provider'},

Identificamos uma divergência relacionada à Nota Fiscal {nota_fiscal} do fornecedor {fornecedor}.

📋 DETALHES DA DIVERGÊNCIA:
────────────────────────────────────────────
{divergencia}

📞 SOLICITAÇÃO:
Por favor, nos auxilie com a resolução desta divergência o mais breve possível.

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
{current_user.email.split('@')[0].title()}
KUHN Parts Brasil
──────────────────────────────────────────────────
Este é um email automático do sistema KUHN.
        """.strip()
        
        # Retornar dados para JavaScript abrir Outlook
        return jsonify({
            'success': True,
            'email_data': {
                'to': email_provider,
                'subject': assunto,
                'body': corpo_email
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erro ao processar email: {str(e)}'
        }), 500
