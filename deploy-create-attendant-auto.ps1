# Script automático para fazer deploy da função create-attendant
Write-Host "🚀 Deploy Automático - create-attendant" -ForegroundColor Cyan
Write-Host ""

$functionName = "create-attendant"
$projectRef = "noshwvwpjtnvndokbfjx"

# Verificar se Supabase CLI está instalado
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔑 Para fazer o deploy, você precisa de um Access Token do Supabase" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 PASSO A PASSO:" -ForegroundColor Cyan
Write-Host "   1. Acesse: https://supabase.com/dashboard/account/tokens" -ForegroundColor White
Write-Host "   2. Clique em 'Generate New Token'" -ForegroundColor White
Write-Host "   3. Dê um nome (ex: 'Deploy Functions')" -ForegroundColor White
Write-Host "   4. Copie o token gerado" -ForegroundColor White
Write-Host ""
Write-Host "💻 Depois execute:" -ForegroundColor Cyan
Write-Host "   `$env:SUPABASE_ACCESS_TOKEN='seu-token-aqui'" -ForegroundColor Yellow
Write-Host "   supabase functions deploy $functionName --project-ref $projectRef" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ OU use o Dashboard do Supabase:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor Yellow
Write-Host ""

# Tentar fazer deploy se o token estiver disponível
if ($env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "🔑 Token encontrado! Fazendo deploy..." -ForegroundColor Green
    Push-Location $PSScriptRoot
    supabase functions deploy $functionName --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deploy realizado com sucesso!" -ForegroundColor Green
        Write-Host "URL: https://$projectRef.supabase.co/functions/v1/$functionName" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ Erro no deploy. Verifique o token e tente novamente." -ForegroundColor Red
    }
    Pop-Location
} else {
    Write-Host "⚠️  Token não encontrado. Siga as instruções acima." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
