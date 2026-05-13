import os
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime
import pdfplumber
import re

PASTA_XML = os.path.join('EXPRESSO SÃO MIGUEL', 'CTE')
PASTA_FATURAS = os.path.join('EXPRESSO SÃO MIGUEL', 'FATURAS')
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
    valor_nota_fiscal = formatar_valor_brasileiro(valor_nota_fiscal)# PDF CT-e - Procura por qualquer PDF na pasta que contenha a chave do CTe
    pdf_cte = ''
    for arquivo in os.listdir(PASTA_XML):
        if arquivo.lower().endswith('.pdf') and chave_cte in arquivo:
            pdf_cte = os.path.join(PASTA_XML, arquivo)
            break    # Campos em branco
    numero_fatura = ''
    venc_fatura = ''
    nota_fiscal = ''
    centro_custo = ''
    pdf_fatura = ''
    status_cte = ''
    data_lancamento = formatar_data_brasileira()  # Data de lançamento em formato brasileiro
    return (
        transportadora, numero_cte, chave_cte, data_emissao, municipio_envio, uf_envio,
        municipio_destino, uf_destino, valor_frete, valor_nota_fiscal, numero_fatura,
        venc_fatura, nota_fiscal, centro_custo, pdf_cte, pdf_fatura, status_cte, data_lancamento
    )

def extrair_dados_fatura(pdf_path):
    """Extrai número da fatura e data de vencimento do PDF"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            texto_completo = ""
            for page in pdf.pages:
                texto_completo += page.extract_text() or ""
            
            # Debug: mostrar o texto extraído
            # print(f"DEBUG - Texto extraído de {pdf_path}:")
            # print(texto_completo[:500])  # Primeiros 500 caracteres
            
            numero_fatura = ''
            venc_fatura = ''
            
            # Procura por padrões de número de fatura (variações)
            # Tenta encontrar "Fatura" ou "NF" seguido de números
            padrao_fatura = r'(?:Fatura|NF|Nº|número|N°|nf)\s*[:\-]?\s*(\d{6,10})'
            match = re.search(padrao_fatura, texto_completo, re.IGNORECASE)
            if match:
                numero_fatura = match.group(1)
            
            # Se não encontrou, tenta padrões simples de 8 dígitos
            if not numero_fatura:
                numeros = re.findall(r'\b\d{8}\b', texto_completo)
                for num in numeros:
                    if not num.startswith('41'):
                        numero_fatura = num
                        break
            
            # Se ainda não encontrou, tenta com 7 dígitos
            if not numero_fatura:
                numeros = re.findall(r'\b\d{7}\b', texto_completo)
                for num in numeros:
                    if not num.startswith('41'):
                        numero_fatura = num
                        break            # Procura por datas no padrão DD/MM/YYYY
            datas = re.findall(r'\d{2}/\d{2}/\d{4}', texto_completo)
            
            # Filtra datas válidas e pega a que parece ser vencimento
            datas_validas = []
            for data in datas:
                try:
                    dia, mes, ano = data.split('/')
                    if 1 <= int(mes) <= 12 and 1 <= int(dia) <= 31:
                        datas_validas.append(data)
                except:
                    pass
            
            # Pega a data mais futura (que é geralmente o vencimento)
            if datas_validas:
                # Converte para datetime para comparar
                datas_convertidas = []
                for data_str in datas_validas:
                    try:
                        dia, mes, ano = data_str.split('/')
                        data_obj = datetime(int(ano), int(mes), int(dia))
                        datas_convertidas.append((data_str, data_obj))
                    except:
                        pass
                
                if datas_convertidas:
                    # Ordena e pega a maior data (mais futura)
                    venc_fatura = max(datas_convertidas, key=lambda x: x[1])[0]
            
            return numero_fatura, venc_fatura
    except Exception as e:
        print(f"Erro ao ler PDF {pdf_path}: {e}")
        return '', ''

def encontrar_fatura(numero_cte):
    """Procura a fatura correspondente ao número do CTe"""
    if not os.path.exists(PASTA_FATURAS):
        return '', '', ''
    
    for arquivo in os.listdir(PASTA_FATURAS):
        if arquivo.lower().endswith('.pdf'):
            caminho_pdf = os.path.join(PASTA_FATURAS, arquivo)
            try:
                with pdfplumber.open(caminho_pdf) as pdf:
                    texto_completo = ""
                    for page in pdf.pages:
                        texto_completo += page.extract_text() or ""
                    
                    # Verifica se o número do CTe está no PDF
                    if numero_cte in texto_completo:
                        numero_fatura, venc_fatura = extrair_dados_fatura(caminho_pdf)
                        return numero_fatura, venc_fatura, caminho_pdf
            except Exception as e:
                print(f"Erro ao processar {arquivo}: {e}")
    
    return '', '', ''

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
    except sqlite3.IntegrityError:
        print(f'Chave CTE já cadastrada: {dado[2]}')
    finally:
        conn.close()

def atualizar_banco_com_faturas():
    """Atualiza o banco com dados das faturas"""
    conn = sqlite3.connect(BANCO)
    c = conn.cursor()
    
    # Pega todos os registros que não têm número de fatura
    c.execute('SELECT id, numero_cte FROM lancamento_fiscal WHERE numero_fatura IS NULL OR numero_fatura = ""')
    registros = c.fetchall()
    
    for id_reg, numero_cte in registros:
        numero_fatura, venc_fatura, pdf_fatura = encontrar_fatura(numero_cte)
        
        if numero_fatura or venc_fatura:
            c.execute('''
                UPDATE lancamento_fiscal 
                SET numero_fatura = ?, venc_fatura = ?, pdf_fatura = ?
                WHERE id = ?
            ''', (numero_fatura, venc_fatura, pdf_fatura, id_reg))
            print(f"Atualizado CTe {numero_cte}: Fatura {numero_fatura}, Vencimento {venc_fatura}")
        else:
            print(f"Fatura não encontrada para CTe {numero_cte}")
    
    conn.commit()
    conn.close()

def processar_xmls():
    arquivos = os.listdir(PASTA_XML)
    for arquivo in arquivos:
        if arquivo.lower().endswith('.xml'):
            caminho = os.path.join(PASTA_XML, arquivo)
            dado = extrair_dados(caminho)
            if dado:
                inserir_dado(dado)

if __name__ == '__main__':
    processar_xmls()
    atualizar_banco_com_faturas()
    print('Processamento finalizado.')
