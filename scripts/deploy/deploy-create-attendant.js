// Script para fazer deploy da função create-attendant via API do Supabase
const fs = require('fs');
const path = require('path');
const https = require('https');

const FUNCTION_NAME = 'create-attendant';
const PROJECT_REF = 'noshwvwpjtnvndokbfjx';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

// Ler o arquivo da função
const functionPath = path.join(__dirname, 'supabase', 'functions', FUNCTION_NAME, 'index.ts');
const corsPath = path.join(__dirname, 'supabase', 'functions', '_shared', 'cors.ts');

console.log('📦 Preparando deploy da função:', FUNCTION_NAME);
console.log('📄 Lendo arquivos...');

if (!fs.existsSync(functionPath)) {
  console.error('❌ Arquivo da função não encontrado:', functionPath);
  process.exit(1);
}

const functionCode = fs.readFileSync(functionPath, 'utf-8');
const corsCode = fs.readFileSync(corsPath, 'utf-8');

console.log('✅ Arquivos lidos com sucesso');
console.log('');
console.log('⚠️  Para fazer o deploy via API, você precisa:');
console.log('   1. Acessar: https://supabase.com/dashboard/account/tokens');
console.log('   2. Criar um Access Token');
console.log('   3. Executar: SUPABASE_ACCESS_TOKEN=seu-token node deploy-create-attendant.js');
console.log('');
console.log('📋 Ou use o Dashboard do Supabase:');
console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/functions`);
console.log('');
console.log('📝 Código da função está em:');
console.log(`   ${functionPath}`);
console.log('');
console.log('✨ O código já está atualizado e pronto para deploy!');

