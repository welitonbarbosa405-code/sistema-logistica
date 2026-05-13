@echo off
chcp 65001 >nul
echo Criando atalho na área de trabalho...

set SCRIPT_DIR=%~dp0
set DESKTOP=%USERPROFILE%\Desktop
set BAT_FILE=%SCRIPT_DIR%INICIAR_SERVIDOR.bat

REM Cria um atalho VBScript temporário
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\criar_atalho.vbs"
echo sLinkFile = "%DESKTOP%\Kuhn Parts - Iniciar Servidor.lnk" >> "%TEMP%\criar_atalho.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\criar_atalho.vbs"
echo oLink.TargetPath = "%BAT_FILE%" >> "%TEMP%\criar_atalho.vbs"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%TEMP%\criar_atalho.vbs"
echo oLink.Description = "Inicia o servidor Flask do Kuhn Parts" >> "%TEMP%\criar_atalho.vbs"
echo oLink.IconLocation = "shell32.dll,13" >> "%TEMP%\criar_atalho.vbs"
echo oLink.Save >> "%TEMP%\criar_atalho.vbs"

cscript //nologo "%TEMP%\criar_atalho.vbs"
del "%TEMP%\criar_atalho.vbs"

echo.
echo ✅ Atalho criado na área de trabalho!
echo    Nome: "Kuhn Parts - Iniciar Servidor"
echo.
pause

