from datetime import datetime
from flask_login import UserMixin
from .extensions import db, bcrypt, login_manager

class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user")  # 'admin'|'user'
    is_active_flag = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    failed_attempts = db.Column(db.Integer, default=0, nullable=False)
    lock_until = db.Column(db.DateTime, nullable=True)

    def set_password(self, pwd: str):
        self.password_hash = bcrypt.generate_password_hash(pwd).decode("utf-8")

    def check_password(self, pwd: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, pwd)

    @property
    def is_active(self):
        return self.is_active_flag

    def __repr__(self):
        return f"<User {self.email}>"

class CidadeAtendida(db.Model):
    __tablename__ = "cidades_atendidas"
    id = db.Column(db.Integer, primary_key=True)
    transportadora = db.Column(db.String(100), nullable=False)
    cidade_origem = db.Column(db.String(100), nullable=False)
    cidade_destino = db.Column(db.String(100), nullable=False)
    estado_atendido = db.Column(db.String(2), nullable=False)
    prazo_entrega = db.Column(db.Integer, nullable=True)
    pais = db.Column(db.String(50), default="Brasil")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<CidadeAtendida {self.cidade_destino}-{self.estado_atendido}>"

class Consumivel(db.Model):
    """Modelo para controle de consumíveis por filial"""
    __tablename__ = 'controle_consumiveis'
    
    id = db.Column(db.Integer, primary_key=True)
    filial = db.Column(db.String(100), nullable=False)
    codigo = db.Column(db.String(50), nullable=False)
    descricao = db.Column(db.String(200), nullable=False)
    saldo_estoque = db.Column(db.Integer, nullable=False, default=0)
    estoque_minimo = db.Column(db.Integer, nullable=False, default=0)
    nivel_estoque = db.Column(db.String(20), nullable=False, default='Normal')
    unidade_medida = db.Column(db.String(20), nullable=False, default='UN')
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Constraint única: mesmo consumível não pode ser cadastrado duas vezes na mesma filial
    __table_args__ = (
        db.UniqueConstraint('filial', 'codigo', name='unique_consumivel_filial'),
    )
    
    # Relacionamento com movimentações
    movimentacoes = db.relationship('MovimentacaoEstoque', backref='consumivel', lazy='dynamic', order_by='MovimentacaoEstoque.data_movimentacao.desc()')
    
    def calcular_nivel_estoque(self):
        """Calcula o nível de estoque baseado no saldo e estoque mínimo"""
        if self.saldo_estoque <= 0:
            return 'Esgotado'
        elif self.saldo_estoque <= self.estoque_minimo:
            return 'Crítico'
        elif self.saldo_estoque <= (self.estoque_minimo * 1.5):
            return 'Baixo'
        else:
            return 'Normal'
    
    def atualizar_nivel_estoque(self):
        """Atualiza o nível de estoque automaticamente"""
        self.nivel_estoque = self.calcular_nivel_estoque()
        self.data_atualizacao = datetime.utcnow()
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'filial': self.filial,
            'codigo': self.codigo,
            'descricao': self.descricao,
            'saldo_estoque': self.saldo_estoque,
            'estoque_minimo': self.estoque_minimo,
            'nivel_estoque': self.nivel_estoque,
            'unidade_medida': self.unidade_medida,
            'data_cadastro': self.data_cadastro.isoformat() if self.data_cadastro else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None
        }
    
    def __repr__(self):
        return f'<Consumivel {self.codigo} - {self.filial}>'

class MovimentacaoEstoque(db.Model):
    """Modelo para histórico de movimentações de estoque"""
    __tablename__ = 'movimentacoes_estoque'
    
    id = db.Column(db.Integer, primary_key=True)
    consumivel_id = db.Column(db.Integer, db.ForeignKey('controle_consumiveis.id'), nullable=False, index=True)
    
    # Tipo de movimentação
    tipo = db.Column(db.String(20), nullable=False)  # 'ENTRADA' ou 'SAIDA'
    
    # Quantidades
    quantidade = db.Column(db.Integer, nullable=False)
    saldo_anterior = db.Column(db.Integer, nullable=False)
    saldo_atual = db.Column(db.Integer, nullable=False)
    
    # Informações adicionais
    motivo = db.Column(db.String(100), nullable=False)  # Compra, Uso, Ajuste, Devolução, etc.
    observacao = db.Column(db.Text, nullable=True)
    
    # Rastreabilidade
    usuario_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    usuario = db.relationship('User', backref=db.backref('movimentacoes_estoque', lazy='dynamic'))
    
    # Timestamps
    data_movimentacao = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'consumivel_id': self.consumivel_id,
            'consumivel_codigo': self.consumivel.codigo if self.consumivel else None,
            'consumivel_descricao': self.consumivel.descricao if self.consumivel else None,
            'filial': self.consumivel.filial if self.consumivel else None,
            'tipo': self.tipo,
            'quantidade': self.quantidade,
            'saldo_anterior': self.saldo_anterior,
            'saldo_atual': self.saldo_atual,
            'motivo': self.motivo,
            'observacao': self.observacao,
            'usuario_email': self.usuario.email if self.usuario else 'Sistema',
            'data_movimentacao': self.data_movimentacao.strftime('%d/%m/%Y %H:%M') if self.data_movimentacao else None
        }
    
    def __repr__(self):
        return f'<MovimentacaoEstoque {self.tipo} {self.quantidade} - Consumivel {self.consumivel_id}>'

class HistoricoRastreamento(db.Model):
    __tablename__ = "historico_rastreamento"
    id = db.Column(db.Integer, primary_key=True)
    nota_fiscal = db.Column(db.String(50), nullable=False, index=True)
    transportadora = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(200), nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    cidade_destino = db.Column(db.String(100), nullable=True)
    uf_destino = db.Column(db.String(2), nullable=True)
    previsao = db.Column(db.String(100), nullable=True)
    consultado_em = db.Column(db.DateTime, default=datetime.utcnow)
    ultima_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<HistoricoRastreamento {self.nota_fiscal}-{self.transportadora}>"

class Expedicao(db.Model):
    """Modelo para controle de expedições"""
    __tablename__ = "expedicao"
    
    id = db.Column(db.Integer, primary_key=True)
    nf_key = db.Column(db.String(200), nullable=False)  # FILIAL|SERIE|NF
    item_seq = db.Column(db.Integer, nullable=False)    # 1,2,3...
    
    filial = db.Column(db.String(100))
    fonte_arquivo = db.Column(db.String(500))
    dt_importacao = db.Column(db.DateTime)
    
    emissao = db.Column(db.String(50))
    serie = db.Column(db.String(50))
    nf = db.Column(db.String(50))
    
    produto = db.Column(db.String(200))
    descricao = db.Column(db.Text)
    quantidade = db.Column(db.Float)
    valor_unitario = db.Column(db.Float)
    valor_item = db.Column(db.Float)
    valor_total = db.Column(db.Float)
    
    cliente = db.Column(db.String(100))
    nome_cliente = db.Column(db.String(200))
    municipio = db.Column(db.String(100))
    uf = db.Column(db.String(2))
    pais = db.Column(db.String(50))
    
    datahora_exped = db.Column(db.DateTime)
    datahora_saida = db.Column(db.DateTime)
    motorista = db.Column(db.String(100))
    cpf_motorista = db.Column(db.String(20))
    transportadora = db.Column(db.String(100))
    placa_uf = db.Column(db.String(20))
    
    pedido = db.Column(db.String(100))
    t_frete = db.Column(db.String(50))
    refaturamento = db.Column(db.String(50))
    
    # Constraint única
    __table_args__ = (
        db.UniqueConstraint('nf_key', 'item_seq', name='unique_expedicao_nf_item'),
    )
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'nf_key': self.nf_key,
            'item_seq': self.item_seq,
            'filial': self.filial,
            'emissao': self.emissao,
            'serie': self.serie,
            'nf': self.nf,
            'produto': self.produto,
            'descricao': self.descricao,
            'quantidade': self.quantidade,
            'valor_unitario': self.valor_unitario,
            'valor_item': self.valor_item,
            'valor_total': self.valor_total,
            'cliente': self.cliente,
            'nome_cliente': self.nome_cliente,
            'municipio': self.municipio,
            'uf': self.uf,
            'pais': self.pais,
            'datahora_exped': self.datahora_exped.strftime('%Y-%m-%d %H:%M:%S') if self.datahora_exped else None,
            'datahora_saida': self.datahora_saida.strftime('%Y-%m-%d %H:%M:%S') if self.datahora_saida else None,
            'motorista': self.motorista,
            'cpf_motorista': self.cpf_motorista,
            'transportadora': self.transportadora,
            'placa_uf': self.placa_uf,
            'pedido': self.pedido,
            't_frete': self.t_frete,
            'refaturamento': self.refaturamento
        }
    
    def __repr__(self):
        return f'<Expedicao {self.nf_key}-{self.item_seq}>'

class LancamentoFiscal(db.Model):
    __tablename__ = 'lancamentos_fiscais'
    id = db.Column(db.Integer, primary_key=True)
    nome_arquivo = db.Column(db.String(255), nullable=False)
    caminho_arquivo = db.Column(db.String(255), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    data_upload = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    transportadora = db.Column(db.String(100), nullable=False)
    numero_fatura = db.Column(db.String(100), nullable=False)
    valor_fatura = db.Column(db.Float, nullable=True)
    data_vencimento = db.Column(db.Date, nullable=True)
    
    # Novos campos para controle de status
    status = db.Column(db.String(20), nullable=False, default='pendente')  # pendente, paga, vencida, cancelada
    data_pagamento = db.Column(db.Date, nullable=True)
    observacao = db.Column(db.Text, nullable=True)

    usuario = db.relationship('User', backref=db.backref('lancamentos_fiscais', lazy=True))

    # Status possíveis
    STATUS_PENDENTE = 'pendente'
    STATUS_PAGA = 'paga'
    STATUS_VENCIDA = 'vencida'
    STATUS_CANCELADA = 'cancelada'
    
    @property
    def status_calculado(self):
        """Calcula o status baseado na data de vencimento e pagamento"""
        from datetime import date
        
        # Se está marcada como paga ou cancelada, mantém
        if self.status in [self.STATUS_PAGA, self.STATUS_CANCELADA]:
            return self.status
        
        # Se não tem data de vencimento, mantém pendente
        if not self.data_vencimento:
            return self.STATUS_PENDENTE
        
        # Verifica se está vencida
        if self.data_vencimento < date.today():
            return self.STATUS_VENCIDA
        
        return self.STATUS_PENDENTE
    
    @property
    def status_display(self):
        """Retorna o status para exibição"""
        status_map = {
            'pendente': 'Pendente',
            'paga': 'Paga',
            'vencida': 'Vencida',
            'cancelada': 'Cancelada'
        }
        return status_map.get(self.status_calculado, 'Pendente')
    
    @property
    def status_cor(self):
        """Retorna a cor do badge baseado no status"""
        cores = {
            'pendente': 'yellow',
            'paga': 'green',
            'vencida': 'red',
            'cancelada': 'gray'
        }
        return cores.get(self.status_calculado, 'gray')
    
    @property
    def dias_vencimento(self):
        """Retorna quantos dias faltam/passaram do vencimento"""
        from datetime import date
        if not self.data_vencimento:
            return None
        return (self.data_vencimento - date.today()).days

    def __repr__(self):
        return f"<LancamentoFiscal {self.numero_fatura} - {self.transportadora}>"

class LancamentoFiscalCTE(db.Model):
    """Modelo para sincronizar dados da tabela lancamento_fiscal (CTe)"""
    __tablename__ = 'lancamento_fiscal_cte'
    
    id = db.Column(db.Integer, primary_key=True)
    transportadora = db.Column(db.String(150), nullable=False)
    numero_cte = db.Column(db.String(50), nullable=False, unique=True, index=True)
    chave_cte = db.Column(db.String(100), nullable=False, unique=True)
    data_emissao = db.Column(db.String(10), nullable=True)  # DD/MM/YYYY
    municipio_envio = db.Column(db.String(100), nullable=True)
    uf_envio = db.Column(db.String(2), nullable=True)
    municipio_destino = db.Column(db.String(100), nullable=True)
    uf_destino = db.Column(db.String(2), nullable=True)
    valor_frete = db.Column(db.Float, nullable=True)
    valor_nota_fiscal = db.Column(db.Float, nullable=True)
    numero_fatura = db.Column(db.String(50), nullable=True)
    venc_fatura = db.Column(db.String(10), nullable=True)  # DD/MM/YYYY
    nota_fiscal = db.Column(db.String(50), nullable=True)
    centro_custo = db.Column(db.String(50), nullable=True)
    pdf_cte = db.Column(db.String(500), nullable=True)
    pdf_fatura = db.Column(db.String(500), nullable=True)
    status_cte = db.Column(db.String(50), nullable=True)
    data_lancamento = db.Column(db.String(10), nullable=True)  # DD/MM/YYYY
    data_sincronizacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'transportadora': self.transportadora,
            'numero_cte': self.numero_cte,
            'chave_cte': self.chave_cte,
            'data_emissao': self.data_emissao,
            'municipio_envio': self.municipio_envio,
            'uf_envio': self.uf_envio,
            'municipio_destino': self.municipio_destino,
            'uf_destino': self.uf_destino,
            'valor_frete': self.valor_frete,
            'valor_nota_fiscal': self.valor_nota_fiscal,
            'numero_fatura': self.numero_fatura,
            'venc_fatura': self.venc_fatura,
            'nota_fiscal': self.nota_fiscal,
            'centro_custo': self.centro_custo,
            'pdf_cte': self.pdf_cte,
            'pdf_fatura': self.pdf_fatura,
            'status_cte': self.status_cte,
            'data_lancamento': self.data_lancamento,
        }
    
    def __repr__(self):
        return f"<LancamentoFiscalCTE {self.numero_cte} - {self.transportadora}>"

class DivergenciaNotaFiscal(db.Model):
    """Modelo para registro de divergências de notas fiscais"""
    __tablename__ = 'divergencias_nota'
    
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(20), nullable=False)
    nota_fiscal = db.Column(db.String(50), nullable=False)
    fornecedor = db.Column(db.String(200), nullable=False)
    divergencia = db.Column(db.Text, nullable=False)
    ordem_compra = db.Column(db.String(50), nullable=True)
    item = db.Column(db.String(100), nullable=True)
    comprador = db.Column(db.String(150), nullable=True)
    provider = db.Column(db.String(200), nullable=True)
    email_provider = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<DivergenciaNotaFiscal {self.nota_fiscal}>"


# ==================== MODELOS PARA GESTÃO DE FEIRAS ====================

class Feira(db.Model):
    """Modelo para feiras"""
    __tablename__ = 'feiras'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    local = db.Column(db.String(200), nullable=False)
    data_inicio = db.Column(db.String(10), nullable=False)  # DD/MM/YYYY
    data_fim = db.Column(db.String(10), nullable=False)     # DD/MM/YYYY
    observacoes = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com as máquinas da feira
    maquinas = db.relationship('MaquinaFeira', backref='feira', lazy='dynamic', cascade='all, delete-orphan')
    
    @property
    def total_maquinas(self):
        """Retorna o número total de máquinas na feira"""
        return self.maquinas.count()
    
    @property 
    def status_feira(self):
        """Retorna o status baseado na data atual"""
        from datetime import datetime
        try:
            data_inicio = datetime.strptime(self.data_inicio, '%d/%m/%Y').date()
            data_fim = datetime.strptime(self.data_fim, '%d/%m/%Y').date()
            hoje = datetime.now().date()
            
            if hoje < data_inicio:
                return 'Planejada'
            elif data_inicio <= hoje <= data_fim:
                return 'Em andamento'
            else:
                return 'Finalizada'
        except:
            return 'Indefinido'
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'nome': self.nome,
            'local': self.local,
            'data_inicio': self.data_inicio,
            'data_fim': self.data_fim,
            'observacoes': self.observacoes,
            'total_maquinas': self.total_maquinas,
            'status': self.status_feira,
            'criado_em': self.criado_em.strftime('%d/%m/%Y %H:%M') if self.criado_em else None
        }
    
    def __repr__(self):
        return f"<Feira {self.nome} - {self.local}>"


class ModeloMaquina(db.Model):
    """Modelo para cadastro de máquinas base"""
    __tablename__ = 'modelos_maquinas'
    
    id = db.Column(db.Integer, primary_key=True)
    nome_modelo = db.Column(db.String(200), nullable=False)
    valor = db.Column(db.Float, nullable=True)
    unidade = db.Column(db.String(10), nullable=True)  # KBR, KMB, etc
    especificacao = db.Column(db.Text, nullable=True)
    transportadora_padrao = db.Column(db.String(150), nullable=True)
    valor_frete_padrao = db.Column(db.Float, nullable=True)
    local_embarque_padrao = db.Column(db.String(200), nullable=True)
    
    # Relacionamento com as máquinas das feiras
    maquinas_feira = db.relationship('MaquinaFeira', backref='modelo', lazy='dynamic')
    
    @property
    def valor_formatado(self):
        """Retorna o valor formatado em moeda brasileira"""
        if self.valor:
            return f"R$ {self.valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        return "R$ 0,00"
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'nome_modelo': self.nome_modelo,
            'valor': self.valor,
            'valor_formatado': self.valor_formatado,
            'unidade': self.unidade,
            'especificacao': self.especificacao,
            'transportadora_padrao': self.transportadora_padrao,
            'valor_frete_padrao': self.valor_frete_padrao,
            'local_embarque_padrao': self.local_embarque_padrao
        }
    
    def __repr__(self):
        return f"<ModeloMaquina {self.nome_modelo}>"


class Transportadora(db.Model):
    """Modelo para transportadoras"""
    __tablename__ = 'transportadoras'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    cidade = db.Column(db.String(100), nullable=True)
    uf = db.Column(db.String(2), nullable=True)
    contato = db.Column(db.String(100), nullable=True)
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'nome': self.nome,
            'cidade': self.cidade,
            'uf': self.uf,
            'contato': self.contato
        }
    
    def __repr__(self):
        return f"<Transportadora {self.nome}>"


class MaquinaFeira(db.Model):
    """Modelo para máquinas enviadas para feiras"""
    __tablename__ = 'maquinas_feiras'
    
    id = db.Column(db.Integer, primary_key=True)
    feira_id = db.Column(db.Integer, db.ForeignKey('feiras.id'), nullable=False)
    modelo_id = db.Column(db.Integer, db.ForeignKey('modelos_maquinas.id'), nullable=False)
    serie = db.Column(db.String(100), nullable=True)
    valor = db.Column(db.Float, nullable=True)
    unidade = db.Column(db.String(10), nullable=True)
    quantidade = db.Column(db.Integer, default=1)
    especificacao = db.Column(db.Text, nullable=True)
    data_limite = db.Column(db.String(10), nullable=True)  # DD/MM/YYYY
    transportadora = db.Column(db.String(150), nullable=True)
    valor_frete = db.Column(db.Float, nullable=True)
    local_embarque = db.Column(db.String(200), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='Aguardando Logística')  # Aguardando Logística, Pendente, Em transporte, Na feira, Retornada
    
    # Campos de rastreamento de responsáveis
    cadastrado_por = db.Column(db.String(100), nullable=True)  # Email do usuário Marketing
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    logistica_por = db.Column(db.String(100), nullable=True)  # Email do usuário Suprimentos
    data_logistica = db.Column(db.DateTime, nullable=True)
    
    @property
    def valor_formatado(self):
        """Retorna o valor formatado em moeda brasileira"""
        if self.valor:
            return f"R$ {self.valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        return "R$ 0,00"
    
    @property
    def valor_frete_formatado(self):
        """Retorna o valor do frete formatado"""
        if self.valor_frete:
            return f"R$ {self.valor_frete:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        return "R$ 0,00"
    
    @property
    def status_cor(self):
        """Retorna a cor do status para exibição"""
        cores = {
            'Aguardando Logística': 'orange',
            'Pendente': 'yellow',
            'Em transporte': 'blue',
            'Na feira': 'green',
            'Retornada': 'gray'
        }
        return cores.get(self.status, 'gray')
    
    @property
    def logistica_preenchida(self):
        """Verifica se os dados de logística foram preenchidos"""
        return bool(self.transportadora and self.valor_frete)
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'feira_id': self.feira_id,
            'modelo_id': self.modelo_id,
            'modelo_nome': self.modelo.nome_modelo if self.modelo else None,
            'serie': self.serie,
            'valor': self.valor,
            'valor_formatado': self.valor_formatado,
            'unidade': self.unidade,
            'quantidade': self.quantidade,
            'especificacao': self.especificacao,
            'data_limite': self.data_limite,
            'transportadora': self.transportadora,
            'valor_frete': self.valor_frete,
            'valor_frete_formatado': self.valor_frete_formatado,
            'local_embarque': self.local_embarque,
            'observacoes': self.observacoes,
            'status': self.status,
            'status_cor': self.status_cor,
            'cadastrado_por': self.cadastrado_por,
            'data_cadastro': self.data_cadastro.strftime('%d/%m/%Y %H:%M') if self.data_cadastro else None,
            'logistica_por': self.logistica_por,
            'data_logistica': self.data_logistica.strftime('%d/%m/%Y %H:%M') if self.data_logistica else None,
            'logistica_preenchida': self.logistica_preenchida
        }
    
    def __repr__(self):
        return f"<MaquinaFeira {self.modelo.nome_modelo if self.modelo else 'N/A'} - {self.feira.nome if self.feira else 'N/A'}>"


@login_manager.user_loader
def load_user(user_id):
    try:
        return User.query.get(int(user_id))
    except Exception:
        return None