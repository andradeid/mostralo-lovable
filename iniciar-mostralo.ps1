# Script para iniciar o servidor Mostralo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO SERVIDOR MOSTRALO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navegar até o diretório do projeto
$projectPath = "C:\Users\PC\Projetos Cursor\.mostralo"
Write-Host "📁 Navegando até: $projectPath" -ForegroundColor Yellow
Set-Location $projectPath

# Verificar se Bun está instalado
Write-Host "🔍 Verificando Bun..." -ForegroundColor Yellow
$bunVersion = bun --version 2>$null
if ($bunVersion) {
    Write-Host "✅ Bun v$bunVersion encontrado!" -ForegroundColor Green
} else {
    Write-Host "❌ Bun não encontrado! Instale em: https://bun.sh" -ForegroundColor Red
    pause
    exit
}

# Verificar se a porta 5173 está livre
Write-Host "🔍 Verificando porta 5173..." -ForegroundColor Yellow
$portInUse = netstat -ano | findstr ":5173" 2>$null
if ($portInUse) {
    Write-Host "⚠️  Porta 5173 em uso. Finalizando processo anterior..." -ForegroundColor Yellow
    $pid = ($portInUse -split '\s+')[-1]
    if ($pid -match '^\d+$') {
        taskkill /F /PID $pid 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        Write-Host "✅ Porta liberada!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Iniciar o servidor
bun run dev

