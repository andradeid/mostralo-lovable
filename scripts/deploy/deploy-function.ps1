# Script para fazer deploy da Edge Function reset-customer-password
# Este script prepara o código e fornece instruções para deploy

Write-Host "🚀 Preparando deploy da Edge Function: reset-customer-password" -ForegroundColor Cyan
Write-Host ""

$functionName = "reset-customer-password"
$functionPath = "supabase\functions\$functionName"

# Obter o diretório atual do script
if ($PSScriptRoot) {
    $projectPath = $PSScriptRoot
} else {
    $projectPath = Get-Location
}

# Verificar se a função existe
if (-not (Test-Path "$projectPath\$functionPath\index.ts")) {
    Write-Host "❌ Erro: Função não encontrada em $functionPath\index.ts" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Função encontrada: $functionPath\index.ts" -ForegroundColor Green
Write-Host ""

# Verificar se o Supabase CLI está disponível
$supabaseAvailable = $false
$supabasePath = ""

# Tentar encontrar Supabase CLI
$possiblePaths = @(
    "$env:USERPROFILE\.bun\bin\supabase.exe",
    "$env:USERPROFILE\.bun\bin\supabase",
    "$env:LOCALAPPDATA\supabase\supabase.exe",
    "C:\Program Files\Supabase CLI\supabase.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $supabasePath = $path
        $supabaseAvailable = $true
        break
    }
}

# Tentar via PATH
try {
    $null = Get-Command supabase -ErrorAction Stop
    $supabaseAvailable = $true
    $supabasePath = "supabase"
} catch {
    # Não encontrado no PATH
}

if ($supabaseAvailable) {
    Write-Host "✅ Supabase CLI encontrado: $supabasePath" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Fazendo deploy da função..." -ForegroundColor Cyan
    
    Push-Location $projectPath
    
    try {
        if ($supabasePath -eq "supabase") {
            & supabase functions deploy $functionName --no-verify-jwt
        } else {
            & $supabasePath functions deploy $functionName --no-verify-jwt
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Deploy realizado com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "A função está disponível em:" -ForegroundColor Cyan
            Write-Host "https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/$functionName" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "❌ Erro ao fazer deploy. Veja as instruções manuais abaixo." -ForegroundColor Red
            $supabaseAvailable = $false
        }
    } catch {
        Write-Host ""
        Write-Host "❌ Erro ao executar deploy: $_" -ForegroundColor Red
        $supabaseAvailable = $false
    } finally {
        Pop-Location
    }
}

if (-not $supabaseAvailable) {
    Write-Host ""
    Write-Host "⚠️  Supabase CLI não encontrado. Use uma das opções abaixo:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "OPÇÃO 1: Deploy via Supabase Dashboard (RECOMENDADO)" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Acesse: https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Selecione o projeto: noshwvwpjtnvndokbfjx" -ForegroundColor White
    Write-Host "3. Vá em 'Edge Functions' no menu lateral" -ForegroundColor White
    Write-Host "4. Encontre a função 'reset-customer-password'" -ForegroundColor White
    Write-Host "5. Clique em 'Deploy' ou 'Redeploy'" -ForegroundColor White
    Write-Host "6. O Supabase lerá automaticamente o código de:" -ForegroundColor White
    Write-Host "   $projectPath\$functionPath\index.ts" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "OPÇÃO 2: Instalar Supabase CLI e fazer deploy" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Instale o Supabase CLI:" -ForegroundColor White
    Write-Host "  Via npm: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "  Via Scoop: scoop install supabase" -ForegroundColor Yellow
    Write-Host "  Via Chocolatey: choco install supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Depois execute:" -ForegroundColor White
    Write-Host "  cd `"$projectPath`"" -ForegroundColor Yellow
    Write-Host "  supabase functions deploy $functionName --no-verify-jwt" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Mostrar resumo das mudanças
    Write-Host "📝 Resumo das correções aplicadas:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Validação de autenticação (Authorization header)" -ForegroundColor Green
    Write-Host "✅ Validação de permissões (store_admin ou master_admin)" -ForegroundColor Green
    Write-Host "✅ Códigos HTTP apropriados (400, 401, 403, 404, 500)" -ForegroundColor Green
    Write-Host "✅ Service role key para alterar senhas" -ForegroundColor Green
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Pronto! Após o deploy, teste resetar a senha de um cliente." -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

