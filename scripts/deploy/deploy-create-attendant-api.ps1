# Script para fazer deploy via API do Supabase
# Requer SUPABASE_ACCESS_TOKEN como variável de ambiente

param(
    [string]$AccessToken = $env:SUPABASE_ACCESS_TOKEN
)

if (-not $AccessToken) {
    Write-Host "❌ SUPABASE_ACCESS_TOKEN não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para obter o token:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://supabase.com/dashboard/account/tokens" -ForegroundColor White
    Write-Host "2. Crie um novo token" -ForegroundColor White
    Write-Host "3. Execute: `$env:SUPABASE_ACCESS_TOKEN='seu-token'; .\deploy-create-attendant-api.ps1" -ForegroundColor White
    exit 1
}

$functionName = "create-attendant"
$projectRef = "noshwvwpjtnvndokbfjx"
$functionPath = "supabase\functions\$functionName\index.ts"
$corsPath = "supabase\functions\_shared\cors.ts"

Write-Host "🚀 Fazendo deploy via API..." -ForegroundColor Cyan

# Ler arquivos
$functionCode = Get-Content $functionPath -Raw
$corsCode = Get-Content $corsPath -Raw

# Preparar payload
$files = @(
    @{
        name = "functions/$functionName/index.ts"
        content = $functionCode
    },
    @{
        name = "functions/_shared/cors.ts"
        content = $corsCode
    }
)

$body = @{
    entrypoint_path = "functions/$functionName/index.ts"
    verify_jwt = $true
    files = $files
} | ConvertTo-Json -Depth 10

# Fazer deploy
$headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$projectRef/functions/$functionName" `
        -Method PUT `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Deploy realizado com sucesso!" -ForegroundColor Green
    Write-Host "URL: https://$projectRef.supabase.co/functions/v1/$functionName" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro no deploy: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode
    exit 1
}

