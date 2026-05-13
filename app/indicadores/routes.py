from flask import render_template, request, jsonify
from flask_login import login_required
from app import db
from . import indicadores_bp
from datetime import datetime, timedelta
import sqlite3
import os

@indicadores_bp.route('/acuracia-estoque')
@login_required
def acuracia_estoque():
    """Página de Acurácia de Estoque com gráficos e tabelas"""
    
    # Parâmetros de filtro
    data_inicio = request.args.get('data_inicio', '')
    data_fim = request.args.get('data_fim', '')
    filial_filtro = request.args.get('filial', '')
    
    # Conectar ao banco
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'instance', 'app.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Query base
        query = "SELECT * FROM inventario WHERE 1=1"
        params = []
        
        if data_inicio:
            query += " AND data >= ?"
            params.append(data_inicio)
        
        if data_fim:
            query += " AND data <= ?"
            params.append(data_fim)
        
        if filial_filtro:
            query += " AND filial = ?"
            params.append(filial_filtro)
        
        query += " ORDER BY data DESC, codigo ASC"
        cursor.execute(query, params)
        registros = cursor.fetchall()

        # Buscar filiais disponíveis
        cursor.execute("SELECT DISTINCT filial FROM inventario ORDER BY filial")
        filiais = [row[0] for row in cursor.fetchall()]

        # Calcular estatísticas
        total_registros = len(registros)
        discrepancias = 0
        acuracia_total = 0.0
        total_sistema = 0
        total_fisico = 0
        diferenca_total = 0
        
        if registros:
            for registro in registros:
                qtd_sistema = registro['quantidade_sistema'] or 0
                qtd_fisico = registro['quantidade_inventariada'] or 0
                total_sistema += qtd_sistema
                total_fisico += qtd_fisico
                diff = abs(qtd_sistema - qtd_fisico)
                if diff > 0:
                    discrepancias += 1
              # Calcular diferença total entre os saldos globais
            diferenca_total = abs(total_sistema - total_fisico)
            # Acurácia de quantidade (precisão nas quantidades totais)
            acuracia_total = ((total_sistema - diferenca_total) / total_sistema * 100) if total_sistema > 0 else 0
        
        conn.close()
        
        return render_template(
            'indicadores/acuracia_estoque.html',
            registros=registros,
            filiais=filiais,
            data_inicio=data_inicio,
            data_fim=data_fim,
            filial_filtro=filial_filtro,
            total_registros=total_registros,
            discrepancias=discrepancias,
            acuracia_total=acuracia_total,
            total_sistema=total_sistema,
            total_fisico=total_fisico,
            diferenca_total=diferenca_total,
            top_itens=registros[:10] if registros else []  # Top 10 por divergência
        )
    
    except Exception as e:
        print(f"Erro ao buscar dados de inventário: {e}")
        conn.close()
        return render_template('indicadores/acuracia_estoque.html', error=str(e))


@indicadores_bp.route('/api/acuracia-data')
@login_required
def api_acuracia_data():
    """API para retornar dados para os gráficos"""
    
    filial_filtro = request.args.get('filial', '')
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'instance', 'app.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Dados por filial - com agregação de quantidades
        if filial_filtro:
            # Se filtrada por filial, retorna apenas uma filial
            query = """
                SELECT 
                    filial,
                    COUNT(*) as total,
                    SUM(CASE WHEN quantidade_sistema = quantidade_inventariada THEN 1 ELSE 0 END) as corretos,
                    SUM(CASE WHEN quantidade_sistema != quantidade_inventariada THEN 1 ELSE 0 END) as discrepancias,
                    SUM(COALESCE(quantidade_sistema, 0)) as total_sistema,
                    SUM(COALESCE(quantidade_inventariada, 0)) as total_fisico
                FROM inventario
                WHERE filial = ?
                GROUP BY filial
                ORDER BY filial
            """
            cursor.execute(query, (filial_filtro,))
        else:
            # Se não filtrada, retorna todas as filiais
            query = """
                SELECT 
                    filial,
                    COUNT(*) as total,
                    SUM(CASE WHEN quantidade_sistema = quantidade_inventariada THEN 1 ELSE 0 END) as corretos,
                    SUM(CASE WHEN quantidade_sistema != quantidade_inventariada THEN 1 ELSE 0 END) as discrepancias,
                    SUM(COALESCE(quantidade_sistema, 0)) as total_sistema,
                    SUM(COALESCE(quantidade_inventariada, 0)) as total_fisico
                FROM inventario
                GROUP BY filial
                ORDER BY filial
            """
            cursor.execute(query)
        
        filial_data = cursor.fetchall()
          # Dados por zona - com agregação
        query_zona = """
            SELECT 
                zona,
                COUNT(*) as total,
                SUM(CASE WHEN quantidade_sistema = quantidade_inventariada THEN 1 ELSE 0 END) as corretos,
                SUM(COALESCE(quantidade_sistema, 0)) as total_sistema,
                SUM(COALESCE(quantidade_inventariada, 0)) as total_fisico
            FROM inventario
        """
        
        if filial_filtro:
            query_zona += " WHERE filial = ?"
            cursor.execute(query_zona + " GROUP BY zona ORDER BY zona", (filial_filtro,))
        else:
            cursor.execute(query_zona + " GROUP BY zona ORDER BY zona")
        
        zona_data = cursor.fetchall()
        
        # Top 10 itens com maior divergência
        query_top_itens = """
            SELECT 
                codigo,
                zona,
                filial,
                quantidade_sistema,
                quantidade_inventariada,
                ABS(quantidade_sistema - quantidade_inventariada) as divergencia
            FROM inventario
        """
        
        if filial_filtro:
            query_top_itens += " WHERE filial = ?"
            cursor.execute(query_top_itens + " ORDER BY divergencia DESC LIMIT 10", (filial_filtro,))
        else:
            cursor.execute(query_top_itens + " ORDER BY divergencia DESC LIMIT 10")
        
        top_itens = cursor.fetchall()        # Ranking de zonas com maior divergência
        query_rank_zonas = """
            SELECT 
                zona,
                COUNT(*) as total,
                SUM(CASE WHEN quantidade_sistema = quantidade_inventariada THEN 1 ELSE 0 END) as corretos,
                SUM(COALESCE(quantidade_sistema, 0)) as total_sistema,
                SUM(COALESCE(quantidade_inventariada, 0)) as total_fisico,
                ABS(SUM(COALESCE(quantidade_sistema, 0)) - SUM(COALESCE(quantidade_inventariada, 0))) as divergencia_total,
                ROUND(100.0 * (SUM(COALESCE(quantidade_sistema, 0)) - ABS(SUM(COALESCE(quantidade_sistema, 0)) - SUM(COALESCE(quantidade_inventariada, 0)))) / 
                    NULLIF(SUM(COALESCE(quantidade_sistema, 0)), 0), 2) as acuracia_zona
            FROM inventario
        """
        
        if filial_filtro:
            query_rank_zonas += " WHERE filial = ?"
            cursor.execute(query_rank_zonas + " GROUP BY zona ORDER BY divergencia_total DESC", (filial_filtro,))
        else:
            cursor.execute(query_rank_zonas + " GROUP BY zona ORDER BY divergencia_total DESC")
        
        rank_zonas_data = cursor.fetchall()
        
        conn.close()
        
        # Preparar dados para resposta
        filiais_nomes = []
        filiais_acuracia = []
        filiais_discrepancias = []
        filiais_sistema = []
        filiais_fisico = []
        
        for row in filial_data:
            filiais_nomes.append(row['filial'])
            # Acurácia de quantidade por filial
            diferenca_filial = abs(row['total_sistema'] - row['total_fisico'])
            acuracia = ((row['total_sistema'] - diferenca_filial) / row['total_sistema'] * 100) if row['total_sistema'] > 0 else 0
            filiais_acuracia.append(round(acuracia, 2))
            filiais_discrepancias.append(row['discrepancias'])
            filiais_sistema.append(row['total_sistema'] or 0)
            filiais_fisico.append(row['total_fisico'] or 0)
        
        zonas_nomes = []
        zonas_acuracia = []
        zonas_sistema = []
        zonas_fisico = []
        
        for row in zona_data:
            zonas_nomes.append(row['zona'] or 'Sem Zona')
            # Acurácia de quantidade por zona
            diferenca_zona = abs(row['total_sistema'] - row['total_fisico'])
            acuracia = ((row['total_sistema'] - diferenca_zona) / row['total_sistema'] * 100) if row['total_sistema'] > 0 else 0
            zonas_acuracia.append(round(acuracia, 2))
            zonas_sistema.append(row['total_sistema'] or 0)
            zonas_fisico.append(row['total_fisico'] or 0)
        
        return jsonify({
            'filiais': {
                'labels': filiais_nomes,
                'acuracia': filiais_acuracia,
                'discrepancias': filiais_discrepancias,
                'sistema': filiais_sistema,
                'fisico': filiais_fisico
            },
            'zonas': {
                'labels': zonas_nomes,
                'acuracia': zonas_acuracia,
                'sistema': zonas_sistema,
                'fisico': zonas_fisico
            },
            'top_itens': [dict(row) for row in top_itens],
            'rank_zonas': [dict(row) for row in rank_zonas_data]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
