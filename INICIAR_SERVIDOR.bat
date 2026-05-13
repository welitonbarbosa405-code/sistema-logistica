@echo off
chcp 65001 >nul
title Kuhn Parts - Servidor Flask
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║        🚀 KUHN PARTS BRASIL - Iniciando Servidor            ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/3] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado! Instale o Python primeiro.
    pause
    exit /b 1
)
python --version
echo ✅ Python OK!
echo.

echo [2/3] Verificando dependências...
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Flask não encontrado. Instalando dependências...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
)
echo ✅ Dependências OK!
echo.

echo [3/3] Preparando servidor...
echo.
echo ═══════════════════════════════════════════════════════════════
echo   🌐 Servidor: http://localhost:5000
echo   🌐 Login:    http://localhost:5000/auth/login
echo   📧 Email:    admin@kuhn.com.br
echo   🔑 Senha:    admin123
echo ═══════════════════════════════════════════════════════════════
echo.
echo ⏳ Iniciando servidor... O navegador abrirá automaticamente!
echo ⏹️  Para parar o servidor, pressione Ctrl+C
echo.

REM Abre o navegador após 7 segundos em uma janela separada
start "" cmd /c "timeout /t 7 /nobreak >nul && start http://localhost:5000 && exit"

REM Inicia o servidor Flask
python run.py

if errorlevel 1 (
    echo.
    echo ❌ Erro ao iniciar o servidor!
    echo Verifique se a porta 5000 está disponível.
    echo.
    echo 💡 Dica: Feche outros programas que possam estar usando a porta 5000
    pause
)
