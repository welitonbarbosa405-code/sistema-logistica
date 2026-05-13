import os
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime
import re
import pdfplumber

PASTA_XML = os.path.join('CARVALIMA', 'CTE')
PASTA_FATURAS = os.path.join('CARVALIMA', 'FATURAS')
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
    """Procura o PDF do CTE pela pasta CTE usando o número do CTE
    Busca primeiro pelo número no nome do arquivo, depois dentro do conteúdo do PDF"""
    if not numero_cte or not os.path.exists(PASTA_XML):
        return ''
    
    # Tenta primeiro procurar pelo número no nome do arquivo (mais rápido)
    for arquivo in os.listdir(PASTA_XML):
        if arquivo.lower().endswith('.pdf'):
            if numero_cte in arquivo:
                return os.path.join(PASTA_XML, arquivo)
    
    # Se não encontrou pelo nome, procura dentro do conteúdo do PDF
    # Prepara variações do número para procurar
    numero_com_zeros = str(numero_cte).zfill(9)  # ex: "2233962" vira "002233962"
    
    for arquivo in os.listdir(PASTA_XML):
        if arquivo.lower().endswith('.pdf'):
            caminho_pdf = os.path.join(PASTA_XML, arquivo)
            try:
                with pdfplumber.open(caminho_pdf) as pdf:
                    texto_completo = ""
                    for page in pdf.pages:
                        texto_completo += page.extract_text() or ""
                    
                    # Procura pelo número do CT-e (variações)
                    if numero_cte in texto_completo:
                        return caminho_pdf
                    # Também procura com zeros à esquerda (002233962)
                    if numero_com_zeros in texto_completo:
                        return caminho_pdf
            except Exception as e:
                pass  # Ignora erros ao ler PDFs individuais
    
    return ''

def encontrar_pdf_fatura(numero_cte):
    """Procura o PDF da fatura pela pasta FATURAS usando o número do CT-e"""
    if not numero_cte or not os.path.exists(PASTA_FATURAS):
        return ''
    
    numero_com_zeros = str(numero_cte).zfill(9)  # ex: "2220522" vira "002220522"
    
    for arquivo in os.listdir(PASTA_FATURAS):
        if arquivo.lower().endswith('.pdf'):
            caminho_pdf = os.path.join(PASTA_FATURAS, arquivo)
            try:
                with pdfplumber.open(caminho_pdf) as pdf:
                    texto_completo = ""
                    for page in pdf.pages:
                        texto_completo += page.extract_text() or ""
                    
                    # Procura pelo número do CT-e no PDF
                    if numero_cte in texto_completo or numero_com_zeros in texto_completo:
                        return caminho_pdf
            except Exception as e:
                pass  # Ignora erros ao ler PDFs individuais
    
    return ''

def extrair_dados_pdf_fatura(caminho_pdf, numero_cte):
    """Extrai dados da fatura do PDF: número da fatura e vencimento
    Procura pelos campos: N° do Documento, Vencimento"""
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            texto_completo = ""
            for page in pdf.pages:
                texto_completo += page.extract_text() or ""
            
            numero_fatura = ''
            venc_fatura = ''
            
            # Extrai número da fatura do campo "N° do Documento"
            # Procura por padrões como "N° do Documento: 12345" ou "Nº Documento: 12345"
            padrao_doc = r'(?:N°|Nº|N°\.)\s*(?:do\s+)?Documento[:\s]+(\d+(?:[-.]?\d+)*)'
            match_doc = re.search(padrao_doc, texto_completo, re.IGNORECASE)
            if match_doc:
                numero_fatura = match_doc.group(1).strip()
            
            # Padrão para Vencimento - busca "Vencimento" seguido de data
            # [^\d]* permite espaços, quebras de linha, etc entre "Vencimento" e a data
            padrao_venc = r'Vencimento[^\d]*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})'
            match_venc = re.search(padrao_venc, texto_completo, re.IGNORECASE)
            if match_venc:
                venc_fatura = f"{match_venc.group(1)}/{match_venc.group(2)}/{match_venc.group(3)}"
            
            return numero_fatura, venc_fatura
    except Exception as e:
        print(f"❌ Erro ao extrair dados do PDF: {e}")
        return '', ''

def extrair_dados(xml_path, dados_excel):
    """Extrai dados do XML do CTE e busca informações do Excel"""
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
    # Remove zeros à esquerda para compatibilidade com nomes de arquivo
    if numero_cte:
        numero_cte = str(int(numero_cte))
    
    # Chave do CTE
    chave_cte = infCte.attrib.get('Id', '').replace('CTe', '')
    
    # Data de Emissão
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
    uf_destino = ide.findtext('ns:UFFim', default='', namespaces=ns) if ide is not None else ''
    
    # Valor Frete
    vPrest = infCte.find('ns:vPrest', ns)
    valor_frete = vPrest.findtext('ns:vTPrest', default='', namespaces=ns) if vPrest is not None else ''
    valor_frete = formatar_valor_brasileiro(valor_frete)
    
    # Valor Nota Fiscal
    vCarga = infCte.find('.//ns:infCarga/ns:vCarga', ns)
    valor_nota_fiscal = vCarga.text if vCarga is not None else ''
    valor_nota_fiscal = formatar_valor_brasileiro(valor_nota_fiscal)
    
    # PDF CT-e - Procura pelo número do CTE no arquivo
    pdf_cte = encontrar_pdf_cte(numero_cte)
    
    # Busca PDF da fatura usando o número do CT-e
    numero_fatura = ''
    venc_fatura = ''
    pdf_fatura = encontrar_pdf_fatura(numero_cte)
    
    # Se encontrou o PDF da fatura, extrai os dados
    if pdf_fatura:
        numero_fatura, venc_fatura = extrair_dados_pdf_fatura(pdf_fatura, numero_cte)
    
    # Campos vazios
    nota_fiscal = ''
    centro_custo = ''
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
        print(f"✅ Inserido CTe {dado[1]} da {dado[0]}")
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            print(f'⚠️  Chave CTE já cadastrada: {dado[2]}')
        else:
            print(f'✗ Erro de integridade: {e}')
    except Exception as e:
        print(f'✗ Erro ao inserir dados: {e}')
    finally:
        conn.close()

def processar_xmls():
    """Processa todos os XMLs da pasta CTE"""
    if not os.path.exists(PASTA_XML):
        print(f"❌ Pasta não encontrada: {PASTA_XML}")
        return
    
    arquivos = os.listdir(PASTA_XML)
    xml_count = 0
    
    for arquivo in arquivos:
        if arquivo.lower().endswith('.xml'):
            caminho = os.path.join(PASTA_XML, arquivo)
            try:
                dado = extrair_dados(caminho, {})  # Passando dicionário vazio já que não usamos mais Excel
                if dado:
                    inserir_dado(dado)
                    xml_count += 1
            except Exception as e:
                print(f"❌ Erro ao processar {arquivo}: {e}")
    
    print(f"\n✅ Processados {xml_count} arquivos XML")

if __name__ == '__main__':
    processar_xmls()
    print('🎉 Processamento finalizado!')
