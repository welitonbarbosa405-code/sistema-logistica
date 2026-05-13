@echo off
echo ============================================================
echo   SISTEMA DE IMPORTACAO E ATUALIZACAO DE EXPEDICOES
echo ============================================================
echo.

echo [1/2] Importando novas notas fiscais...
echo ----------------------------------------
python import_expedicao.py
echo.
echo.

echo [2/2] Atualizando dados de expedicao faltantes...
echo ----------------------------------------
python atualizar_nfs.py
echo.
echo.

echo ============================================================
echo   PROCESSO CONCLUIDO COM SUCESSO!
echo ============================================================
echo.
pause
