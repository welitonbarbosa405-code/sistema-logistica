# app/api/data_routes.py
from flask import jsonify, request
from flask_login import login_required
from sqlalchemy import func
from . import api_bp
from app.models import CidadeAtendida
from app.extensions import db

@api_bp.route("/cidades-ufs")
@login_required
def cidades_ufs():
    ufs = (
        db.session.query(CidadeAtendida.estado_atendido)
        .filter(CidadeAtendida.estado_atendido.isnot(None))
        .distinct()
        .order_by(CidadeAtendida.estado_atendido.asc())
        .all()
    )
    return jsonify([u[0] for u in ufs])

@api_bp.route("/cidades-transportadoras")
@login_required
def cidades_transportadoras():
    """Retorna transportadoras, opcionalmente filtradas por cidade origem"""
    cidade_origem = (request.args.get("cidade_origem") or "").strip()
    
    q = db.session.query(CidadeAtendida.transportadora).filter(
        CidadeAtendida.transportadora.isnot(None)
    )
    
    # Se cidade origem foi informada, filtrar apenas transportadoras dessa origem
    if cidade_origem:
        q = q.filter(func.upper(CidadeAtendida.cidade_origem) == cidade_origem.upper())
    
    trs = q.distinct().order_by(CidadeAtendida.transportadora.asc()).all()
    return jsonify([t[0] for t in trs])

@api_bp.route("/cidades-atendidas")
@login_required
def cidades_atendidas():
    """
    Retorna lista de cidades no formato esperado pelo front:
    {
      "transportadora": ..., "cidade_origem": ..., "cidade": ...,
      "estado": ..., "prazo": ..., "pais": ...
    }    Aceita query params: uf, transportadora
    """
    uf = (request.args.get("uf") or "").strip()
    tr = (request.args.get("transportadora") or "").strip()

    q = CidadeAtendida.query
    if uf:
        # Busca case-insensitive para o estado
        q = q.filter(func.upper(CidadeAtendida.estado_atendido) == uf.upper())
    if tr:
        q = q.filter(CidadeAtendida.transportadora == tr)

    rows = q.order_by(
        CidadeAtendida.transportadora.asc(),
        CidadeAtendida.cidade_destino.asc()
    ).all()

    payload = [{
        "transportadora": r.transportadora,
        "cidade_origem": r.cidade_origem,
        "cidade": r.cidade_destino,         # o front usa "cidade"
        "estado": r.estado_atendido,        # o front usa "estado"
        "prazo": r.prazo_entrega,           # o front usa "prazo"
        "pais": r.pais
    } for r in rows]

    return jsonify(payload)