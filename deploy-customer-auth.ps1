# ============================================
# DEPLOY DA EDGE FUNCTION customer-auth
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DEPLOY: customer-auth Edge Function" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "SITUACAO ATUAL:" -ForegroundColor Yellow
Write-Host "  Cliente 33333333333: TEM AUTH (pode logar)" -ForegroundColor Green
Write-Host "  Cliente 22222222222: SEM AUTH (precisa recriar)" -ForegroundColor Red
Write-Host "  Problema: Edge Function retornando 401`n" -ForegroundColor Red

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   INSTRUCOES PARA DEPLOY MANUAL" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "PASSO 1: Abrir Supabase Dashboard" -ForegroundColor Cyan
Write-Host "  URL: https://supabase.com/dashboard`n" -ForegroundColor Gray

Write-Host "PASSO 2: Ir em Edge Functions" -ForegroundColor Cyan
Write-Host "  Menu lateral > Edge Functions`n" -ForegroundColor Gray

Write-Host "PASSO 3: Encontrar customer-auth" -ForegroundColor Cyan
Write-Host "  Clicar nos tres pontos (...) > Edit`n" -ForegroundColor Gray

Write-Host "PASSO 4: Verificar Configuracao JWT" -ForegroundColor Cyan
Write-Host "  Settings > Verify JWT: DESABILITADO" -ForegroundColor Red
Write-Host "  Se estiver habilitado, DESABILITAR!`n" -ForegroundColor Red

Write-Host "PASSO 5: Copiar arquivo atualizado" -ForegroundColor Cyan
Write-Host "  Arquivo: supabase/functions/customer-auth/index.ts" -ForegroundColor Gray
Write-Host "  Colar no editor do Dashboard" -ForegroundColor Gray
Write-Host "  Clicar em Deploy`n" -ForegroundColor Gray

Write-Host "========================================" -ForegroundColor Green
Write-Host "   ALTERNATIVA: Copiar e Colar" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Vou abrir o arquivo para voce copiar..." -ForegroundColor Cyan

# Verificar se o arquivo existe
$filePath = ".\supabase\functions\customer-auth\index.ts"

if (Test-Path $filePath) {
    Write-Host "`nArquivo encontrado!" -ForegroundColor Green
    Write-Host "Abrindo no Notepad...`n" -ForegroundColor Cyan
    
    Start-Process notepad.exe -ArgumentList $filePath
    
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "PROXIMO PASSO:" -ForegroundColor Yellow
    Write-Host "  1. Copiar TODO o conteudo do Notepad" -ForegroundColor White
    Write-Host "  2. Ir no Dashboard > Edge Functions > customer-auth" -ForegroundColor White
    Write-Host "  3. Edit > APAGAR tudo > COLAR o novo codigo" -ForegroundColor White
    Write-Host "  4. Deploy" -ForegroundColor White
    Write-Host "  5. Settings > Verify JWT: DESABILITAR" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Yellow
    
} else {
    Write-Host "`nArquivo nao encontrado!" -ForegroundColor Red
    Write-Host "Caminho esperado: $filePath" -ForegroundColor Gray
    Write-Host "`nVERIFIQUE:" -ForegroundColor Yellow
    Write-Host "  - Esta na pasta correta?" -ForegroundColor White
    Write-Host "  - Estrutura: .mostralo\supabase\functions\customer-auth\index.ts" -ForegroundColor White
}

Write-Host "`nAPOS O DEPLOY:" -ForegroundColor Cyan
Write-Host "  1. Recarregar pagina (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "  2. Testar login com 33333333333" -ForegroundColor White
Write-Host "  3. Deve aparecer mensagem especifica!" -ForegroundColor Green
Write-Host "`n"

