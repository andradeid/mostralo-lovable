// ============================================
// DEPLOY AUTOMÁTICO DA EDGE FUNCTION
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { readFile } from 'fs/promises';

// Configuração do Supabase (mesmas credenciais do client.ts)
const SUPABASE_URL = 'https://noshwvwpjtnvndokbfjx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMzk5MDYsImV4cCI6MjA0MzkxNTkwNn0.J3v3BQOoBoKCT3Hkq2LD3aZPyc7e_-d2FztDbxuI0D8';

console.log('\n========================================');
console.log('   🚀 DEPLOY AUTOMÁTICO - customer-auth');
console.log('========================================\n');

console.log('📋 INFORMAÇÕES:');
console.log('  - Cliente 33333333333: TEM SENHA ✅');
console.log('  - Cliente 22222222222: SEM SENHA ⚠️');
console.log('  - Problema: Edge Function retornando 401\n');

console.log('⚠️  ATENÇÃO:');
console.log('  Deploy via API requer Service Role Key');
console.log('  Por segurança, vou orientar deploy manual\n');

console.log('========================================');
console.log('   📝 INSTRUÇÕES SIMPLIFICADAS');
console.log('========================================\n');

console.log('🔗 LINK DIRETO:');
console.log('   https://supabase.com/dashboard/project/noshwvwpjtnvndokbfjx/functions\n');

console.log('📋 PASSO A PASSO:');
console.log('   1. Clique no link acima');
console.log('   2. Encontre "customer-auth"');
console.log('   3. Clique nos 3 pontos ⋮ > "Edit"');
console.log('   4. IMPORTANTE: Settings > "Verify JWT" = OFF ❌');
console.log('   5. Copie o código do arquivo abaixo');
console.log('   6. Cole no editor e clique "Deploy"\n');

console.log('📄 ARQUIVO COM CÓDIGO ATUALIZADO:');
console.log('   supabase/functions/customer-auth/index.ts\n');

console.log('========================================');
console.log('   🎯 ALTERNATIVA: CLI');
console.log('========================================\n');

console.log('Se você tem Supabase CLI instalado:');
console.log('   npx supabase functions deploy customer-auth\n');

console.log('========================================');
console.log('   ⚡ TESTE APÓS DEPLOY');
console.log('========================================\n');

console.log('1. Recarregar página (Ctrl+Shift+R)');
console.log('2. Abrir Console (F12)');
console.log('3. Login com 33333333333');
console.log('4. Verificar logs 🔐\n');

console.log('✅ SUCESSO ESPERADO:');
console.log('   "Bem-vindo(a), Capitão América! 🎉"\n');

console.log('❌ SE DER ERRO:');
console.log('   Me envie os logs do console!\n');

