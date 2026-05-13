import os
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime

PASTA_XML = os.path.join('AZUL', 'CTE')
PASTA_FATURAS = os.path.join('AZUL', 'FATURAS')
BANCO = os.path.join('..', 'instance', 'app.db')

def formatar_valor_brasileiro(valor):
    """Converte um valor para float (formato numérico para banco de dados)"""
    try:
        if not valor or valor == '':
            return None
        # Converte para float
        valor_float = float(str(valor).replace(',', '.'))
        return valor_float
    except:
        return None

def formatar_data_brasileira():
    """Retorna a data atual no formato brasileiro DD/MM/YYYY"""
    return datetime.now().strftime('%d/%m/%Y')

def encontrar_pdf_cte(numero_cte):
    """Procura o PDF do CTE pela pasta CTE usando o número do CTE"""
    if not numero_cte or not os.path.exists(PASTA_XML):
        return ''
    
    for arquivo in os.listdir(PASTA_XML):
        if arquivo.lower().endswith('.pdf'):
            # Procura pelo número do CTE no nome do arquivo
            if numero_cte in arquivo:
                return os.path.join(PASTA_XML, arquivo)
    
    return ''

def encontrar_pdf_fatura(numero_cte):
    """Procura o PDF da fatura pela pasta FATURAS usando o número do CTE"""
    if not numero_cte or not os.path.exists(PASTA_FATURAS):
        return ''
    
    for arquivo in os.listdir(PASTA_FATURAS):
        if arquivo.lower().endswith('.pdf'):
            # Procura pelo número do CTE no nome do arquivo da fatura
            if numero_cte in arquivo:
                return os.path.join(PASTA_FATURAS, arquivo)
    
    return ''

def extrair_dados(xml_path):
    ns = {'ns': 'http://www.portalfiscal.inf.br/cte'}
    tree = ET.parse(xml_path)
    root = tree.getroot()
    infCte = root.find('.//ns:infCte', ns)
    if infCte is None:
        return None
    # Transportadora
    emit = infCte.find('ns:emit', ns)
    transportadora = emit.findtext('ns:xNome', default='', namespaces=ns) if emit is not None else ''
    # Número do CTE
    ide = infCte.find('ns:ide', ns)
    numero_cte = ide.findtext('ns:nCT', default='', namespaces=ns) if ide is not None else ''
    # Chave do CTE
    chave_cte = infCte.attrib.get('Id', '').replace('CTe', '')    # Data de Emissão
    data_emissao = ide.findtext('ns:dhEmi', default='', namespaces=ns) if ide is not None else ''
    if data_emissao:
        data_emissao = data_emissao[:10]  # Pega apenas a data (YYYY-MM-DD)
        # Converte para formato brasileiro DD/MM/YYYY
        try:
            ano, mes, dia = data_emissao.split('-')
            data_emissao = f"{dia}/{mes}/{ano}"
        except:
            pass
    # Município e UF de Envio
    municipio_envio = ide.findtext('ns:xMunEnv', default='', namespaces=ns) if ide is not None else ''
    uf_envio = ide.findtext('ns:UFEnv', default='', namespaces=ns) if ide is not None else ''
    # Município e UF de Destino
    municipio_destino = ide.findtext('ns:xMunFim', default='', namespaces=ns) if ide is not None else ''
    uf_destino = ide.findtext('ns:UFFim', default='', namespaces=ns) if ide is not None else ''    # Valor Frete
    vPrest = infCte.find('ns:vPrest', ns)
    valor_frete = vPrest.findtext('ns:vTPrest', default='', namespaces=ns) if vPrest is not None else ''
    valor_frete = formatar_valor_brasileiro(valor_frete)
    
    # Valor Nota Fiscal
    vCarga = infCte.find('.//ns:infCarga/ns:vCarga', ns)
    valor_nota_fiscal = vCarga.text if vCarga is not None else ''
    valor_nota_fiscal = formatar_valor_brasileiro(valor_nota_fiscal)
      # PDF CT-e - Procura usando o número do CTE
    pdf_cte = encontrar_pdf_cte(numero_cte)
    
    # Campos em branco ou a extrair depois
    numero_fatura = ''
    venc_fatura = ''
    nota_fiscal = ''
    centro_custo = ''
    pdf_fatura = encontrar_pdf_fatura(numero_cte)  # Procura fatura usando número do CTE
    status_cte = ''
    data_lancamento = formatar_data_brasileira()  # Data de lançamento em formato brasileiro
    return (
        transportadora, numero_cte, chave_cte, data_emissao, municipio_envio, uf_envio,
        municipio_destino, uf_destino, valor_frete, valor_nota_fiscal, numero_fatura,
        venc_fatura, nota_fiscal, centro_custo, pdf_cte, pdf_fatura, status_cte, data_lancamento
    )

def inserir_dado(dado):
    """Insere os dados extraídos na tabela lancamento_fiscal do banco instance/app.db"""
    conn = sqlite3.connect(BANCO)
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO lancamento_fiscal (
                transportadora, numero_cte, chave_cte, data_emissao, municipio_envio, uf_envio,
                municipio_destino, uf_destino, valor_frete, valor_nota_fiscal, numero_fatura,
                venc_fatura, nota_fiscal, centro_custo, pdf_cte, pdf_fatura, status_cte, data_lancamento
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', dado)
        conn.commit()
        print(f'✓ Registrado: CTE {dado[1]} - {dado[0]}')
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            print(f'⚠ Chave CTE já cadastrada: {dado[2]}')
        else:
            print(f'✗ Erro de integridade: {e}')
    except Exception as e:
        print(f'✗ Erro ao inserir dados: {e}')
    finally:
        conn.close()

def processar_xmls():
    if not os.path.exists(PASTA_XML):
        print(f"❌ Pasta não encontrada: {PASTA_XML}")
        return
    
    arquivos = os.listdir(PASTA_XML)
    xml_count = 0
    
    for arquivo in arquivos:
        if arquivo.lower().endswith('.xml'):
            caminho = os.path.join(PASTA_XML, arquivo)
            try:
                dado = extrair_dados(caminho)
                if dado:
                    inserir_dado(dado)
                    xml_count += 1
            except Exception as e:
                print(f"❌ Erro ao processar {arquivo}: {e}")
    
    print(f"\n✅ Processados {xml_count} arquivos XML")

if __name__ == '__main__':
    processar_xmls()
    print('🎉 Processamento finalizado.')
