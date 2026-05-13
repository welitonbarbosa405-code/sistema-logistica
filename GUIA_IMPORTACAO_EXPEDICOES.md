# 📦 GUIA DE IMPORTAÇÃO E ATUALIZAÇÃO DE EXPEDIÇÕES

## 🎯 Scripts Disponíveis

### 1️⃣ **import_expedicao.py** - Importar Novas Notas
- **O que faz:** Importa APENAS notas novas (não duplica existentes)
- **Quando usar:** Sempre que atualizar os arquivos Excel na pasta `base`
- **Como executar:**
  ```bash
  python import_expedicao.py
  ```

### 2️⃣ **atualizar_nfs.py** - Atualizar Dados Faltantes
- **O que faz:** Atualiza transportadora, data de expedição e outros campos vazios
- **Quando usar:** Após importar novas notas ou quando dados foram adicionados no Excel
- **Como executar:**
  ```bash
  python atualizar_nfs.py
  ```

### 3️⃣ **importar-e-atualizar.bat** ou **importar-e-atualizar.ps1** - Tudo Automático
- **O que faz:** Executa os dois scripts acima em sequência
- **Quando usar:** Para fazer importação e atualização completa de uma vez
- **Como executar:**
  
  **Opção 1 - Arquivo BAT (mais simples):**
  - Duplo clique em `importar-e-atualizar.bat`
  
  **Opção 2 - PowerShell (mais robusto):**
  - Clique direito em `importar-e-atualizar.ps1`
  - Selecione "Executar com PowerShell"

---

## 📋 FLUXO DE TRABALHO RECOMENDADO

### **Situação 1: Diariamente ou após atualizar Excel**
```
1. Atualize os arquivos Excel na pasta 'base'
2. Execute: importar-e-atualizar.bat (faz tudo automático)
```

### **Situação 2: Apenas importar novas notas**
```
1. Execute: python import_expedicao.py
```

### **Situação 3: Apenas atualizar campos vazios**
```
1. Execute: python atualizar_nfs.py
```

---

## ⚠️ IMPORTANTE

### **Arquivos Excel Necessários na pasta `base`:**
- `KMB.xlsx` - Filial Mirassol
- `KTO.xlsx` - Filial Toledo  
- `KBR.xlsx` - Filial Brasnorte
- `KMT.xlsx` - Filial Mato Grosso

### **O que o sistema faz automaticamente:**
✅ **Evita duplicação** - Notas já importadas NÃO são reimportadas  
✅ **Atualiza campos vazios** - Preenche transportadora e data quando disponível  
✅ **Mantém dados existentes** - Não sobrescreve dados já preenchidos  
✅ **Log detalhado** - Mostra exatamente o que foi importado/atualizado

---

## 🔧 SOLUÇÃO DE PROBLEMAS

### **Problema: "Todas as NFs já existiam no banco"**
**Solução:** Normal! Significa que não há novas notas para importar.

### **Problema: "0 NFs incompletas encontradas"**
**Solução:** Ótimo! Todas as notas já têm dados completos.

### **Problema: Erro ao executar PowerShell**
**Solução:** Use o arquivo `.bat` ao invés do `.ps1`

### **Problema: Dados não aparecem no sistema web**
**Solução:** 
1. Verifique se o servidor Flask está rodando
2. Atualize a página (F5)
3. Limpe o cache do navegador (Ctrl+F5)

---

## 📊 VERIFICAÇÃO DOS DADOS

Para verificar se os dados foram importados corretamente:

1. **No Sistema Web:**
   - Acesse a aba "Expedições"
   - Use os filtros para encontrar suas notas
   - Verifique se transportadora e data aparecem

2. **Direto no Banco:**
   ```python
   # Criar arquivo teste.py com:
   import sqlite3
   conn = sqlite3.connect('instance/app.db')
   cursor = conn.cursor()
   cursor.execute("SELECT COUNT(*) FROM expedicao")
   print(f"Total de registros: {cursor.fetchone()[0]}")
   conn.close()
   ```

---

## 💡 DICAS

- **Execute diariamente:** Use `importar-e-atualizar.bat` uma vez por dia
- **Após grandes atualizações:** Execute duas vezes para garantir
- **Backup:** O sistema não altera os arquivos Excel originais
- **Performance:** A importação pode demorar alguns minutos para muitas notas

---

*Última atualização: 28/10/2025*
