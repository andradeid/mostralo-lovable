# Script de Build e Teste - Mostralo
# Executa build completo e testa localmente antes de fazer deploy

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BUILD E TESTE - MOSTRALO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
$currentDir = Get-Location
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERRO: Não encontrei package.json" -ForegroundColor Red
    Write-Host "Execute este script dentro da pasta .mostralo" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemplo:" -ForegroundColor Cyan
    Write-Host "  cd C:\Users\PC\Projetos Cursor\.mostralo" -ForegroundColor White
    Write-Host "  .\build-e-testar.ps1" -ForegroundColor White
    exit 1
}

Write-Host "✅ Diretório correto!" -ForegroundColor Green
Write-Host ""

# Passo 1: Instalar dependências
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   PASSO 1: Instalando dependências" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

bun install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERRO ao instalar dependências!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
Write-Host ""

# Passo 2: Limpar build anterior
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   PASSO 2: Limpando build anterior" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
    Write-Host "✅ Build anterior removido" -ForegroundColor Green
} else {
    Write-Host "✅ Nenhum build anterior encontrado" -ForegroundColor Green
}
Write-Host ""

# Passo 3: Build
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   PASSO 3: Fazendo build" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏳ Isso pode levar 30-60 segundos..." -ForegroundColor Cyan
Write-Host ""

$buildStart = Get-Date
bun run build
$buildEnd = Get-Date
$buildTime = ($buildEnd - $buildStart).TotalSeconds

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERRO no build!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "  1. Verifique erros de TypeScript" -ForegroundColor White
    Write-Host "  2. Rode: bun run lint" -ForegroundColor White
    Write-Host "  3. Verifique se todas as dependências estão instaladas" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "✅ Build concluído em $([math]::Round($buildTime, 2)) segundos!" -ForegroundColor Green
Write-Host ""

# Passo 4: Verificar build
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   PASSO 4: Verificando build" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "dist/index.html")) {
    Write-Host "❌ ERRO: index.html não foi gerado!" -ForegroundColor Red
    exit 1
}

# Calcular tamanho do build
$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$distSize = [math]::Round($distSize, 2)

Write-Host "📊 Informações do Build:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Pasta: dist/" -ForegroundColor White
Write-Host "  Tamanho: $distSize MB" -ForegroundColor White
Write-Host "  Arquivos:" -ForegroundColor White
Write-Host "    - index.html: $(Test-Path 'dist/index.html' | ForEach-Object { if ($_) { '✅' } else { '❌' } })" -ForegroundColor White
Write-Host "    - assets/: $(Test-Path 'dist/assets' | ForEach-Object { if ($_) { '✅' } else { '❌' } })" -ForegroundColor White
Write-Host "    - sw.js: $(Test-Path 'dist/sw.js' | ForEach-Object { if ($_) { '✅ (PWA)' } else { '⚠️' } })" -ForegroundColor White
Write-Host ""

# Passo 5: Teste local
Write-Host "========================================" -ForegroundColor Green
Write-Host "   PASSO 5: Iniciando preview" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Abrindo preview do build..." -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://localhost:4173" -ForegroundColor Yellow
Write-Host ""
Write-Host "TESTE:" -ForegroundColor Cyan
Write-Host "  1. Navegue pela aplicação" -ForegroundColor White
Write-Host "  2. Teste login (Admin e Cliente)" -ForegroundColor White
Write-Host "  3. Teste fazer pedido" -ForegroundColor White
Write-Host "  4. Verifique console (F12) por erros" -ForegroundColor White
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o preview" -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

# Abrir navegador automaticamente
Start-Process "http://localhost:4173"

# Iniciar preview
bun run preview

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   BUILD E TESTE CONCLUÍDOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Se tudo funcionou corretamente:" -ForegroundColor White
Write-Host "  1. Abra: DEPLOY_AUTOMATICO.html" -ForegroundColor Green
Write-Host "  2. Escolha Vercel ou Netlify" -ForegroundColor Green
Write-Host "  3. Siga o passo a passo" -ForegroundColor Green
Write-Host ""
Write-Host "  OU execute:" -ForegroundColor White
Write-Host "  Start-Process DEPLOY_AUTOMATICO.html" -ForegroundColor Cyan
Write-Host ""

