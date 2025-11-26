# Script para fazer deploy da função create-attendant
Write-Host "🚀 Deploy da Edge Function: create-attendant" -ForegroundColor Cyan
Write-Host ""

$functionName = "create-attendant"
$projectRef = "noshwvwpjtnvndokbfjx"
$functionPath = "supabase\functions\$functionName\index.ts"

# Verificar se o arquivo existe
if (-not (Test-Path $functionPath)) {
    Write-Host "❌ Arquivo não encontrado: $functionPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo encontrado: $functionPath" -ForegroundColor Green
Write-Host ""

# Tentar diferentes métodos de deploy
$deployed = $false

# Método 1: Supabase CLI via PATH
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "📦 Tentando deploy via Supabase CLI..." -ForegroundColor Yellow
    Push-Location $PSScriptRoot
    supabase functions deploy $functionName --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deploy realizado com sucesso via CLI!" -ForegroundColor Green
        $deployed = $true
    }
    Pop-Location
} catch {
    Write-Host "⚠️  Supabase CLI não encontrado no PATH" -ForegroundColor Yellow
}

# Método 2: npx supabase
if (-not $deployed) {
    try {
        Write-Host "📦 Tentando deploy via npx..." -ForegroundColor Yellow
        Push-Location $PSScriptRoot
        npx --yes supabase@latest functions deploy $functionName --project-ref $projectRef
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deploy realizado com sucesso via npx!" -ForegroundColor Green
            $deployed = $true
        }
        Pop-Location
    } catch {
        Write-Host "⚠️  npx não funcionou" -ForegroundColor Yellow
    }
}

# Método 3: bunx
if (-not $deployed) {
    try {
        $null = Get-Command bun -ErrorAction Stop
        Write-Host "📦 Tentando deploy via bunx..." -ForegroundColor Yellow
        Push-Location $PSScriptRoot
        bunx supabase functions deploy $functionName --project-ref $projectRef
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deploy realizado com sucesso via bunx!" -ForegroundColor Green
            $deployed = $true
        }
        Pop-Location
    } catch {
        Write-Host "⚠️  bunx não funcionou" -ForegroundColor Yellow
    }
}

if (-not $deployed) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "⚠️  Deploy automático não foi possível" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 O código da função está atualizado e pronto!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 LINK DIRETO PARA DEPLOY MANUAL:" -ForegroundColor Cyan
    Write-Host "   https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 PASSO A PASSO:" -ForegroundColor Cyan
    Write-Host "   1. Acesse o link acima" -ForegroundColor White
    Write-Host "   2. Encontre a função '$functionName'" -ForegroundColor White
    Write-Host "   3. Clique em 'Edit' ou 'Deploy'" -ForegroundColor White
    Write-Host "   4. O código já está atualizado em:" -ForegroundColor White
    Write-Host "      $PSScriptRoot\$functionPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✨ A função já tem todas as correções aplicadas!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
