# Script para iniciar o servidor Flask
Write-Host "🚀 Iniciando servidor Flask..." -ForegroundColor Green
Write-Host ""

# Navegar para o diretório do projeto
cd "C:\Users\kmbwba\Desktop\15- Projeto Web"

# Verificar se o ambiente virtual existe
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "📦 Ativando ambiente virtual..." -ForegroundColor Yellow
    .\venv\Scripts\Activate.ps1
}

# Verificar se Flask está instalado
Write-Host "🔍 Verificando dependências..." -ForegroundColor Yellow
python -c "import flask" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Flask não encontrado. Instalando dependências..." -ForegroundColor Red
    pip install -r requirements.txt
}

Write-Host ""
Write-Host "✅ Iniciando servidor na porta 5000..." -ForegroundColor Green
Write-Host "🌐 Acesse: http://localhost:5000" -ForegroundColor Cyan
Write-Host "⏹️  Para parar: Pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar o servidor
python run.py

