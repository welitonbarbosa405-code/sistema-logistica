from flask import render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from datetime import datetime
import re

from . import feiras_bp
from ..models import Feira, ModeloMaquina, Transportadora, MaquinaFeira, db


def parse_valor_brasileiro(valor_str):
    """
    Converte valores no formato brasileiro para float.
    Exemplos:
      - "R$ 73.500,00" → 73500.00
      - "73500,50" → 73500.50
      - "R$1.234.567,89" → 1234567.89
      - "1234.56" → 1234.56 (já em formato americano)
      - "" ou None → 0.0
    """
    if not valor_str:
        return 0.0
    
    # Converter para string se necessário
    valor_str = str(valor_str).strip()
    
    if not valor_str:
        return 0.0
    
    # Remover símbolos de moeda e espaços
    # Primeiro remove "R$" como uma unidade, depois espaços restantes
    valor_str = re.sub(r'R\$', '', valor_str)
    valor_str = valor_str.strip()
    
    if not valor_str:
        return 0.0
    
    # Verificar se está no formato brasileiro (usa vírgula como decimal)
    # Formato brasileiro: 1.234,56 ou 1234,56
    # Formato americano: 1,234.56 ou 1234.56
    
    if ',' in valor_str:
        # Provavelmente formato brasileiro
        # Remover pontos de milhar e trocar vírgula por ponto
        valor_str = valor_str.replace('.', '')  # Remove separador de milhar
        valor_str = valor_str.replace(',', '.')  # Troca vírgula decimal por ponto
    
    try:
        return float(valor_str)
    except ValueError:
        return 0.0


# ==================== ROTAS PRINCIPAIS ====================

@feiras_bp.route('/')
@login_required
def index():
    """Dashboard principal - Listagem de Feiras"""
    try:
        feiras = Feira.query.order_by(Feira.criado_em.desc()).all()
        return render_template('feiras/index.html', feiras=feiras)
    except Exception as e:
        flash(f'Erro ao carregar feiras: {str(e)}', 'error')
        return render_template('feiras/index.html', feiras=[])


@feiras_bp.route('/dashboard')
@login_required
def dashboard():
    """Dashboard analítico de feiras - KPIs, gráficos e métricas"""
    from sqlalchemy import func
    
    try:
        # ===== TOTAIS GERAIS =====
        total_feiras = Feira.query.count()
        total_maquinas = MaquinaFeira.query.count()
        total_modelos = ModeloMaquina.query.count()
        total_transportadoras = Transportadora.query.count()
        
        # ===== VALORES FINANCEIROS =====
        # Custo total de fretes
        custo_total_frete = db.session.query(func.sum(MaquinaFeira.valor_frete)).scalar() or 0
        
        # Valor total de máquinas em feiras
        valor_total_maquinas = db.session.query(func.sum(MaquinaFeira.valor)).scalar() or 0
        
        # ===== FEIRAS POR STATUS =====
        feiras_todas = Feira.query.all()
        feiras_planejadas = sum(1 for f in feiras_todas if f.status_feira == 'Planejada')
        feiras_andamento = sum(1 for f in feiras_todas if f.status_feira == 'Em andamento')
        feiras_finalizadas = sum(1 for f in feiras_todas if f.status_feira == 'Finalizada')
        
        # ===== MÁQUINAS POR STATUS =====
        status_maquinas = db.session.query(
            MaquinaFeira.status,
            func.count(MaquinaFeira.id).label('total')
        ).group_by(MaquinaFeira.status).all()
        
        maquinas_por_status = {status: total for status, total in status_maquinas}
        
        # ===== TOP TRANSPORTADORAS (por uso e custo) =====
        top_transportadoras = db.session.query(
            MaquinaFeira.transportadora,
            func.count(MaquinaFeira.id).label('total_usos'),
            func.sum(MaquinaFeira.valor_frete).label('custo_total')
        ).filter(
            MaquinaFeira.transportadora.isnot(None),
            MaquinaFeira.transportadora != ''
        ).group_by(MaquinaFeira.transportadora).order_by(
            func.count(MaquinaFeira.id).desc()
        ).limit(5).all()
        
        # ===== TOP MODELOS MAIS ENVIADOS =====
        top_modelos = db.session.query(
            ModeloMaquina.nome_modelo,
            func.count(MaquinaFeira.id).label('total_envios'),
            func.sum(MaquinaFeira.valor).label('valor_total')
        ).join(MaquinaFeira, ModeloMaquina.id == MaquinaFeira.modelo_id
        ).group_by(ModeloMaquina.nome_modelo).order_by(
            func.count(MaquinaFeira.id).desc()
        ).limit(5).all()
        
        # ===== CUSTO FRETE POR FEIRA =====
        custo_por_feira = db.session.query(
            Feira.nome,
            func.sum(MaquinaFeira.valor_frete).label('custo_frete'),
            func.count(MaquinaFeira.id).label('qtd_maquinas')
        ).join(MaquinaFeira, Feira.id == MaquinaFeira.feira_id
        ).group_by(Feira.nome).order_by(
            func.sum(MaquinaFeira.valor_frete).desc()
        ).limit(10).all()
        
        # ===== PRÓXIMAS FEIRAS =====
        from datetime import date
        hoje = date.today().isoformat()
        proximas_feiras = Feira.query.filter(
            Feira.data_inicio >= hoje
        ).order_by(Feira.data_inicio).limit(5).all()
        
        # ===== MÁQUINAS AGUARDANDO LOGÍSTICA =====
        maquinas_pendentes = MaquinaFeira.query.filter(
            MaquinaFeira.status == 'Aguardando Logística'
        ).order_by(MaquinaFeira.data_cadastro.desc()).limit(10).all()
        
        # ===== ÚLTIMAS MOVIMENTAÇÕES =====
        ultimas_maquinas = MaquinaFeira.query.order_by(
            MaquinaFeira.data_cadastro.desc()
        ).limit(10).all()
        
        return render_template('feiras/dashboard.html',
            # Totais
            total_feiras=total_feiras,
            total_maquinas=total_maquinas,
            total_modelos=total_modelos,
            total_transportadoras=total_transportadoras,
            
            # Valores
            custo_total_frete=custo_total_frete,
            valor_total_maquinas=valor_total_maquinas,
            
            # Feiras por status
            feiras_planejadas=feiras_planejadas,
            feiras_andamento=feiras_andamento,
            feiras_finalizadas=feiras_finalizadas,
            
            # Máquinas por status
            maquinas_por_status=maquinas_por_status,
            
            # Rankings
            top_transportadoras=top_transportadoras,
            top_modelos=top_modelos,
            custo_por_feira=custo_por_feira,
            
            # Listas
            proximas_feiras=proximas_feiras,
            maquinas_pendentes=maquinas_pendentes,
            ultimas_maquinas=ultimas_maquinas
        )
        
    except Exception as e:
        flash(f'Erro ao carregar dashboard: {str(e)}', 'error')
        return redirect(url_for('feiras.index'))
    except Exception as e:
        flash(f'Erro ao carregar feiras: {str(e)}', 'error')
        return render_template('feiras/index.html', feiras=[])

@feiras_bp.route('/nova', methods=['GET', 'POST'])
@login_required  
def nova_feira():
    """Cadastrar nova feira"""
    if request.method == 'POST':
        try:
            feira = Feira(
                nome=request.form.get('nome'),
                local=request.form.get('local'),
                data_inicio=request.form.get('data_inicio'),
                data_fim=request.form.get('data_fim'),
                observacoes=request.form.get('observacoes', '').strip()
            )
            
            db.session.add(feira)
            db.session.commit()
            flash('Feira cadastrada com sucesso!', 'success')
            return redirect(url_for('feiras.index'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao cadastrar feira: {str(e)}', 'error')
    
    return render_template('feiras/nova_feira.html')

@feiras_bp.route('/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def editar_feira(id):
    """Editar feira"""
    feira = Feira.query.get_or_404(id)
    
    if request.method == 'POST':
        try:
            feira.nome = request.form.get('nome')
            feira.local = request.form.get('local')
            feira.data_inicio = request.form.get('data_inicio')
            feira.data_fim = request.form.get('data_fim')
            feira.observacoes = request.form.get('observacoes', '').strip()
            
            db.session.commit()
            flash('Feira atualizada com sucesso!', 'success')
            return redirect(url_for('feiras.index'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao atualizar feira: {str(e)}', 'error')
    
    return render_template('feiras/editar_feira.html', feira=feira)

@feiras_bp.route('/deletar/<int:id>', methods=['POST'])
@login_required
def deletar_feira(id):
    """Deletar feira"""
    try:
        feira = Feira.query.get_or_404(id)
        nome_feira = feira.nome
        
        db.session.delete(feira)
        db.session.commit()
        flash(f'Feira "{nome_feira}" deletada com sucesso!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao deletar feira: {str(e)}', 'error')
    
    return redirect(url_for('feiras.index'))

# ==================== MÁQUINAS DA FEIRA ====================

@feiras_bp.route('/maquinas/<int:feira_id>')
@login_required
def maquinas_feira(feira_id):
    """Lista máquinas de uma feira específica"""
    feira = Feira.query.get_or_404(feira_id)
    maquinas = MaquinaFeira.query.filter_by(feira_id=feira_id).all()
    
    return render_template('feiras/maquinas_feira.html', feira=feira, maquinas=maquinas)

@feiras_bp.route('/maquinas/<int:feira_id>/nova', methods=['GET', 'POST'])
@login_required
def nova_maquina_feira(feira_id):
    """Adicionar máquina à feira (Marketing)"""
    feira = Feira.query.get_or_404(feira_id)
    
    if request.method == 'POST':
        try:            # Buscar modelo para autopreenchimento
            modelo_id = request.form.get('modelo_id')
            modelo = ModeloMaquina.query.get(modelo_id)
            
            maquina_feira = MaquinaFeira(
                feira_id=feira_id,
                modelo_id=modelo_id,
                serie=request.form.get('serie', '').strip(),
                valor=parse_valor_brasileiro(request.form.get('valor')) if request.form.get('valor') else (modelo.valor if modelo else 0),
                unidade=request.form.get('unidade', '').strip() or (modelo.unidade if modelo else ''),
                quantidade=int(request.form.get('quantidade', 1)),
                especificacao=request.form.get('especificacao', '').strip() or (modelo.especificacao if modelo else ''),
                data_limite=request.form.get('data_limite'),
                local_embarque=request.form.get('local_embarque', '').strip() or (modelo.local_embarque_padrao if modelo else ''),
                observacoes=request.form.get('observacoes', '').strip(),
                status='Aguardando Logística',  # Status inicial quando Marketing cadastra
                cadastrado_por=current_user.email  # Registra quem cadastrou
            )
            
            db.session.add(maquina_feira)
            db.session.commit()
            flash('Máquina adicionada à feira! Aguardando preenchimento dos dados de logística pelo Suprimentos.', 'success')
            return redirect(url_for('feiras.maquinas_feira', feira_id=feira_id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao adicionar máquina: {str(e)}', 'error')
    
    # Buscar modelos e transportadoras para dropdowns
    modelos = ModeloMaquina.query.all()
    transportadoras = Transportadora.query.all()
    
    return render_template('feiras/nova_maquina_feira.html', 
                         feira=feira, 
                         modelos=modelos, 
                         transportadoras=transportadoras)

@feiras_bp.route('/maquinas/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def editar_maquina_feira(id):
    """Editar máquina da feira"""
    maquina = MaquinaFeira.query.get_or_404(id)
    
    if request.method == 'POST':
        try:
            # Campos Marketing
            maquina.serie = request.form.get('serie', '').strip()
            maquina.valor = parse_valor_brasileiro(request.form.get('valor')) if request.form.get('valor') else 0
            maquina.unidade = request.form.get('unidade', '').strip()
            maquina.quantidade = int(request.form.get('quantidade', 1))
            maquina.especificacao = request.form.get('especificacao', '').strip()
            maquina.data_limite = request.form.get('data_limite')
            maquina.local_embarque = request.form.get('local_embarque', '').strip()
            maquina.observacoes = request.form.get('observacoes', '').strip()
            
            # Campos Logística/Suprimentos
            nova_transportadora = request.form.get('transportadora', '').strip()
            novo_valor_frete = parse_valor_brasileiro(request.form.get('valor_frete')) if request.form.get('valor_frete') else 0
            
            # Se preencheu dados de logística pela primeira vez, registra responsável
            if nova_transportadora and novo_valor_frete and not maquina.logistica_preenchida:
                maquina.logistica_por = current_user.email
                maquina.data_logistica = datetime.utcnow()
            
            maquina.transportadora = nova_transportadora
            maquina.valor_frete = novo_valor_frete
            maquina.status = request.form.get('status', 'Aguardando Logística')
            
            db.session.commit()
            flash('Máquina atualizada com sucesso!', 'success')
            return redirect(url_for('feiras.maquinas_feira', feira_id=maquina.feira_id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao atualizar máquina: {str(e)}', 'error')
    
    modelos = ModeloMaquina.query.all()
    transportadoras = Transportadora.query.all()
    
    return render_template('feiras/editar_maquina_feira.html', 
                         maquina=maquina, 
                         modelos=modelos, 
                         transportadoras=transportadoras)

@feiras_bp.route('/maquinas/deletar/<int:id>', methods=['POST'])
@login_required
def deletar_maquina_feira(id):
    """Deletar máquina da feira"""
    try:
        maquina = MaquinaFeira.query.get_or_404(id)
        feira_id = maquina.feira_id
        
        db.session.delete(maquina)
        db.session.commit()
        flash('Máquina removida da feira com sucesso!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao remover máquina: {str(e)}', 'error')
        feira_id = request.form.get('feira_id', 1)
    
    return redirect(url_for('feiras.maquinas_feira', feira_id=feira_id))

# ==================== GESTÃO DE MODELOS ====================

@feiras_bp.route('/modelos')
@login_required
def gestao_modelos():
    """Gestão de modelos de máquinas"""
    modelos = ModeloMaquina.query.all()
    return render_template('feiras/gestao_modelos.html', modelos=modelos)

@feiras_bp.route('/modelos/novo', methods=['GET', 'POST'])
@login_required
def novo_modelo():
    """Cadastrar novo modelo de máquina"""
    if request.method == 'POST':
        try:
            modelo = ModeloMaquina(
                nome_modelo=request.form.get('nome_modelo'),
                valor=parse_valor_brasileiro(request.form.get('valor')) if request.form.get('valor') else None,
                unidade=request.form.get('unidade', '').strip(),
                especificacao=request.form.get('especificacao', '').strip(),
                transportadora_padrao=request.form.get('transportadora_padrao', '').strip(),
                valor_frete_padrao=parse_valor_brasileiro(request.form.get('valor_frete_padrao')) if request.form.get('valor_frete_padrao') else None,
                local_embarque_padrao=request.form.get('local_embarque_padrao', '').strip()
            )
            
            db.session.add(modelo)
            db.session.commit()
            flash('Modelo cadastrado com sucesso!', 'success')
            return redirect(url_for('feiras.gestao_modelos'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao cadastrar modelo: {str(e)}', 'error')
    
    transportadoras = Transportadora.query.all()
    return render_template('feiras/novo_modelo.html', transportadoras=transportadoras)

@feiras_bp.route('/modelos/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def editar_modelo(id):
    """Editar modelo de máquina"""
    modelo = ModeloMaquina.query.get_or_404(id)
    
    if request.method == 'POST':
        try:
            modelo.nome_modelo = request.form.get('nome_modelo')
            modelo.valor = parse_valor_brasileiro(request.form.get('valor')) if request.form.get('valor') else None
            modelo.unidade = request.form.get('unidade', '').strip()
            modelo.especificacao = request.form.get('especificacao', '').strip()
            modelo.transportadora_padrao = request.form.get('transportadora_padrao', '').strip()
            modelo.valor_frete_padrao = parse_valor_brasileiro(request.form.get('valor_frete_padrao')) if request.form.get('valor_frete_padrao') else None
            modelo.local_embarque_padrao = request.form.get('local_embarque_padrao', '').strip()
            
            db.session.commit()
            flash('Modelo atualizado com sucesso!', 'success')
            return redirect(url_for('feiras.gestao_modelos'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao atualizar modelo: {str(e)}', 'error')
    
    transportadoras = Transportadora.query.all()
    return render_template('feiras/editar_modelo.html', modelo=modelo, transportadoras=transportadoras)

@feiras_bp.route('/modelos/deletar/<int:id>', methods=['POST'])
@login_required
def deletar_modelo(id):
    """Deletar modelo de máquina"""
    try:
        modelo = ModeloMaquina.query.get_or_404(id)
        nome_modelo = modelo.nome_modelo
        
        db.session.delete(modelo)
        db.session.commit()
        flash(f'Modelo "{nome_modelo}" deletado com sucesso!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao deletar modelo: {str(e)}', 'error')
    
    return redirect(url_for('feiras.gestao_modelos'))

# ==================== GESTÃO DE TRANSPORTADORAS ====================

@feiras_bp.route('/transportadoras')
@login_required
def gestao_transportadoras():
    """Gestão de transportadoras"""
    transportadoras = Transportadora.query.all()
    return render_template('feiras/gestao_transportadoras.html', transportadoras=transportadoras)

@feiras_bp.route('/transportadoras/nova', methods=['GET', 'POST'])
@login_required
def nova_transportadora():
    """Cadastrar nova transportadora"""
    if request.method == 'POST':
        try:
            transportadora = Transportadora(
                nome=request.form.get('nome'),
                cidade=request.form.get('cidade', '').strip(),
                uf=request.form.get('uf', '').strip(),
                contato=request.form.get('contato', '').strip()
            )
            
            db.session.add(transportadora)
            db.session.commit()
            flash('Transportadora cadastrada com sucesso!', 'success')
            return redirect(url_for('feiras.gestao_transportadoras'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao cadastrar transportadora: {str(e)}', 'error')
    
    return render_template('feiras/nova_transportadora.html')

@feiras_bp.route('/transportadoras/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def editar_transportadora(id):
    """Editar transportadora"""
    transportadora = Transportadora.query.get_or_404(id)
    
    if request.method == 'POST':
        try:
            transportadora.nome = request.form.get('nome')
            transportadora.cidade = request.form.get('cidade', '').strip()
            transportadora.uf = request.form.get('uf', '').strip()
            transportadora.contato = request.form.get('contato', '').strip()
            
            db.session.commit()
            flash('Transportadora atualizada com sucesso!', 'success')
            return redirect(url_for('feiras.gestao_transportadoras'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao atualizar transportadora: {str(e)}', 'error')
    
    return render_template('feiras/editar_transportadora.html', transportadora=transportadora)

@feiras_bp.route('/transportadoras/deletar/<int:id>', methods=['POST'])
@login_required
def deletar_transportadora(id):
    """Deletar transportadora"""
    try:
        transportadora = Transportadora.query.get_or_404(id)
        nome = transportadora.nome
        
        db.session.delete(transportadora)
        db.session.commit()
        flash(f'Transportadora "{nome}" deletada com sucesso!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao deletar transportadora: {str(e)}', 'error')
    
    return redirect(url_for('feiras.gestao_transportadoras'))

# ==================== APIs PARA JAVASCRIPT ====================

@feiras_bp.route('/api/modelo/<int:modelo_id>')
@login_required
def api_modelo_detalhes(modelo_id):
    """API para obter detalhes do modelo (para autopreenchimento)"""
    try:
        modelo = ModeloMaquina.query.get_or_404(modelo_id)
        return jsonify({
            'success': True,
            'data': modelo.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@feiras_bp.route('/api/feiras/estatisticas')
@login_required
def api_estatisticas():
    """API para estatísticas do dashboard"""
    try:
        total_feiras = Feira.query.count()
        total_maquinas = MaquinaFeira.query.count()
        total_modelos = ModeloMaquina.query.count()
        total_transportadoras = Transportadora.query.count()
        
        # Feiras por status
        feiras_planejadas = 0
        feiras_andamento = 0
        feiras_finalizadas = 0
        
        for feira in Feira.query.all():
            status = feira.status_feira
            if status == 'Planejada':
                feiras_planejadas += 1
            elif status == 'Em andamento':
                feiras_andamento += 1
            elif status == 'Finalizada':
                feiras_finalizadas += 1
        
        # Máquinas por status
        from sqlalchemy import func
        status_maquinas = db.session.query(
            MaquinaFeira.status,
            func.count(MaquinaFeira.id).label('total')
        ).group_by(MaquinaFeira.status).all()
        
        return jsonify({
            'success': True,
            'data': {
                'totais': {
                    'feiras': total_feiras,
                    'maquinas': total_maquinas,
                    'modelos': total_modelos,
                    'transportadoras': total_transportadoras
                },
                'feiras_status': {
                    'planejadas': feiras_planejadas,
                    'andamento': feiras_andamento,
                    'finalizadas': feiras_finalizadas
                },
                'maquinas_status': [
                    {'status': status, 'total': total} 
                    for status, total in status_maquinas
                ]
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@feiras_bp.route('/api/maquinas/atualizar-status/<int:id>', methods=['POST'])
@login_required
def api_atualizar_status_maquina(id):
    """API para atualizar status da máquina"""
    try:
        maquina = MaquinaFeira.query.get_or_404(id)
        novo_status = request.json.get('status')
        
        if novo_status in ['Pendente', 'Em transporte', 'Na feira', 'Retornada']:
            maquina.status = novo_status
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Status atualizado para: {novo_status}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Status inválido'
            }), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
