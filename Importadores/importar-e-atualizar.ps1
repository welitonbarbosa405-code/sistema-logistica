# Script PowerShell para importar e atualizar expedições
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SISTEMA DE IMPORTAÇÃO E ATUALIZAÇÃO DE EXPEDIÇÕES" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na pasta correta
$expectedPath = "C:\Users\kmbwba\Desktop\15- Projeto Web"
if ((Get-Location).Path -ne $expectedPath) {
    Write-Host "Mudando para o diretório do projeto..." -ForegroundColor Gray
    Set-Location $expectedPath
}

# Etapa 1: Importar novas notas
Write-Host "[1/2] Importando novas notas fiscais..." -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    python import_expedicao.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Importação concluída com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "✗ Erro na importação (código: $LASTEXITCODE)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Erro ao executar importação: $_" -ForegroundColor Red
}
Write-Host ""

# Aguardar 2 segundos entre os processos
Start-Sleep -Seconds 2

# Etapa 2: Atualizar dados faltantes
Write-Host "[2/2] Atualizando dados de expedição faltantes..." -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    python atualizar_nfs.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Atualização concluída com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "✗ Erro na atualização (código: $LASTEXITCODE)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Erro ao executar atualização: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   PROCESSO CONCLUÍDO!" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
