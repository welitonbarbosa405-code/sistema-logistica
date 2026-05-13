import os
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime
import pdfplumber
import re

PASTA_XML = os.path.join('RODONAVES', 'CTE')
PASTA_FATURAS = os.path.join('RODONAVES', 'FATURAS')
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

def extrair_fatura_do_pdf(pdf_path):
    """Extrai número da fatura e data de vencimento do PDF"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            texto_completo = ""
            for page in pdf.pages:
                texto_completo += page.extract_text() or ""
            
            numero_fatura = ''
            venc_fatura = ''
            
            # Procura pelo padrão de fatura (8 dígitos + hífen + 2 dígitos)
            padrao_fatura = r'(\d{8}[\-]\d{2})'
            match = re.search(padrao_fatura, texto_completo)
            if match:
                numero_fatura = match.group(1).replace('-', '')
              # Procura por todas as datas e pega a segunda (que geralmente é o vencimento)
            datas = re.findall(r'(\d{2}/\d{2}/\d{4})', texto_completo)
            if len(datas) > 1:
                venc_fatura = datas[1]  # Segunda data é geralmente o vencimento - já está em DD/MM/YYYY
            
            return numero_fatura, venc_fatura
    except Exception as e:
        print(f"Erro ao ler PDF {pdf_path}: {e}")
        return '', ''

def encontrar_fatura_por_cte(numero_cte):
    """Procura a fatura que contém o N° Frete (CT-e) correspondente"""
    if not os.path.exists(PASTA_FATURAS):
        return '', '', ''
    
    # Variações do número do CT-e para procurar (com e sem dígito verificador)
    numero_cte_variations = [
        numero_cte,
        f"{numero_cte}-0",
        f"{numero_cte}-1",
        f"{numero_cte}-2",
        f"{numero_cte}-3",
        f"{numero_cte}-4",
        f"{numero_cte}-5",
        f"{numero_cte}-6",
        f"{numero_cte}-7",
        f"{numero_cte}-8",
        f"{numero_cte}-9",
    ]
    
    for arquivo in os.listdir(PASTA_FATURAS):
        if arquivo.lower().endswith('.pdf'):
            caminho_pdf = os.path.join(PASTA_FATURAS, arquivo)
            try:
                with pdfplumber.open(caminho_pdf) as pdf:
                    texto_completo = ""
                    for page in pdf.pages:
                        texto_completo += page.extract_text() or ""
                    
                    # Procura pela coluna "N° Frete" ou "Nº Frete"
                    for variacao in numero_cte_variations:
                        if variacao in texto_completo:
                            numero_fatura, venc_fatura = extrair_fatura_do_pdf(caminho_pdf)
                            return numero_fatura, venc_fatura, caminho_pdf
            except Exception as e:
                pass  # Ignora erros ao ler PDFs individuais
    
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

def atualizar_banco_com_faturas():
    """Atualiza o banco com dados das faturas"""
    conn = sqlite3.connect(BANCO)
    c = conn.cursor()
    
    # Pega todos os registros que não têm número de fatura
    c.execute('SELECT id, numero_cte FROM lancamento_fiscal WHERE numero_fatura IS NULL OR numero_fatura = ""')
    registros = c.fetchall()
    
    print(f"\n🔍 Procurando faturas para {len(registros)} CT-es...")
    
    for id_reg, numero_cte in registros:
        numero_fatura, venc_fatura, pdf_fatura = encontrar_fatura_por_cte(numero_cte)
        
        if numero_fatura or venc_fatura:
            c.execute('''
                UPDATE lancamento_fiscal 
                SET numero_fatura = ?, venc_fatura = ?, pdf_fatura = ?
                WHERE id = ?
            ''', (numero_fatura, venc_fatura, pdf_fatura, id_reg))
            print(f"✅ Atualizado CT-e {numero_cte}: Fatura {numero_fatura}, Vencimento {venc_fatura}")
        else:
            print(f"⚠️  Fatura não encontrada para CT-e {numero_cte}")
    
    conn.commit()
    conn.close()
    print(f"\n✅ Atualização de faturas concluída!")

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
    atualizar_banco_com_faturas()
    print('🎉 Processamento finalizado.')
