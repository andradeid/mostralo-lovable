# Script para fazer deploy da Edge Function reset-customer-password
# Usa Bun para executar o Supabase CLI

Write-Host "Deploy da Edge Function: reset-customer-password" -ForegroundColor Cyan
Write-Host ""

$projectPath = Get-Location
$functionName = "reset-customer-password"

# Verificar se estamos no diretorio correto
if (-not (Test-Path "supabase\functions\$functionName\index.ts")) {
    Write-Host "Erro: Execute este script no diretorio .mostralo" -ForegroundColor Red
    Write-Host "   Diretorio atual: $projectPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "Funcao encontrada" -ForegroundColor Green
Write-Host ""

# Tentar fazer deploy
Write-Host "Tentando fazer deploy..." -ForegroundColor Cyan
Write-Host ""

$deployCommand = "bunx supabase functions deploy $functionName --no-verify-jwt --project-ref noshwvwpjtnvndokbfjx"

try {
    $output = Invoke-Expression $deployCommand 2>&1
    $output | ForEach-Object { Write-Host $_ }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Deploy realizado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "A funcao esta disponivel em:" -ForegroundColor Cyan
        Write-Host "https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/$functionName" -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host "Erro ao executar deploy: $_" -ForegroundColor Red
}

# Se chegou aqui, precisa de autenticacao
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Autenticacao necessaria" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPCAO 1: Obter token e fazer deploy (RECOMENDADO)" -ForegroundColor Green
Write-Host ""
Write-Host "1. Obtenha seu access token do Supabase:" -ForegroundColor White
Write-Host "   - Acesse: https://supabase.com/dashboard/account/tokens" -ForegroundColor Yellow
Write-Host "   - Crie um novo token ou use um existente" -ForegroundColor White
Write-Host ""
Write-Host "2. Execute o deploy com o token:" -ForegroundColor White
Write-Host "   `$env:SUPABASE_ACCESS_TOKEN='seu-token-aqui'" -ForegroundColor Yellow
Write-Host "   bunx supabase functions deploy $functionName --no-verify-jwt --project-ref noshwvwpjtnvndokbfjx" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPCAO 2: Deploy via Dashboard (MAIS FACIL)" -ForegroundColor Green
Write-Host ""
Write-Host "1. Acesse: https://supabase.com/dashboard/project/noshwvwpjtnvndokbfjx/functions" -ForegroundColor Yellow
Write-Host "2. Encontre 'reset-customer-password'" -ForegroundColor White
Write-Host "3. Clique em 'Deploy' ou 'Redeploy'" -ForegroundColor White
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
