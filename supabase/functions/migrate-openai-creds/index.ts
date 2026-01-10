// Migrate OpenAI Credentials - v1.0.0
// Busca credenciais OpenAI existentes na Evolution e popula openai_creds_id nas lojas
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationResult {
  store_id: string;
  store_name: string;
  store_slug: string;
  status: 'migrated' | 'not_found' | 'already_set' | 'error';
  creds_id?: string;
  creds_name?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 Iniciando migração de credenciais OpenAI...');

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Token não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se é master_admin
    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar role de master_admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .eq('role', 'master_admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Apenas master_admin pode executar migração' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Autenticado como master_admin: ${authData.user.email}`);

    // Buscar configuração da Evolution
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const evolutionApiKey = evolutionConfig.api_key;

    console.log(`📡 Evolution URL: ${evolutionUrl}`);

    // Parâmetros opcionais
    const { force = false, store_id } = await req.json().catch(() => ({}));

    // Buscar bots ativos
    let query = supabase
      .from('store_bot_config')
      .select('*, stores!inner(id, name, slug)')
      .eq('enabled', true)
      .not('evolution_bot_id', 'is', null);

    // Se não forçar, apenas buscar os que não têm openai_creds_id
    if (!force) {
      query = query.is('openai_creds_id', null);
    }

    // Filtrar por loja específica se informado
    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    const { data: botsToMigrate, error: botsError } = await query;

    if (botsError) {
      console.error('❌ Erro ao buscar bots:', botsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar configurações de bots', details: botsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!botsToMigrate || botsToMigrate.length === 0) {
      console.log('ℹ️ Nenhum bot para migrar');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum bot precisa de migração',
          total_bots: 0,
          migrated: 0,
          not_found: 0,
          already_set: 0,
          errors: 0,
          details: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Encontrados ${botsToMigrate.length} bots para migrar`);

    const results: MigrationResult[] = [];
    let migrated = 0;
    let notFound = 0;
    let alreadySet = 0;
    let errors = 0;

    for (const botConfig of botsToMigrate) {
      const store = botConfig.stores as any;
      const storeId = store.id;
      const storeName = store.name;
      const storeSlug = store.slug;

      console.log(`\n🏪 Processando: ${storeName} (${storeSlug})`);

      // Se já tem credencial e não é force, pular
      if (botConfig.openai_creds_id && !force) {
        console.log(`⏭️ [${storeName}] Já possui openai_creds_id: ${botConfig.openai_creds_id.slice(0, 8)}...`);
        results.push({
          store_id: storeId,
          store_name: storeName,
          store_slug: storeSlug,
          status: 'already_set',
          creds_id: botConfig.openai_creds_id
        });
        alreadySet++;
        continue;
      }

      try {
        // Determinar nome da instância
        const instanceName = `store_${storeId.replace(/-/g, '_')}`;
        const storeCredName = `store_${storeSlug}_openai`;

        console.log(`🔍 Buscando credenciais na instância: ${instanceName}`);
        console.log(`🏷️ Procurando credencial: ${storeCredName}`);

        // Buscar credenciais na Evolution
        const credsResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionApiKey },
        });

        if (!credsResp.ok) {
          const errorText = await credsResp.text();
          console.error(`❌ [${storeName}] Erro ao buscar credenciais: ${credsResp.status} - ${errorText}`);
          results.push({
            store_id: storeId,
            store_name: storeName,
            store_slug: storeSlug,
            status: 'error',
            error: `Evolution API retornou ${credsResp.status}: ${errorText}`
          });
          errors++;
          continue;
        }

        const credsData = await credsResp.json();
        console.log(`📦 Credenciais retornadas:`, JSON.stringify(credsData, null, 2));

        // Normalizar array de credenciais
        const existingCreds = Array.isArray(credsData) 
          ? credsData 
          : (credsData?.creds || credsData?.data || []);

        // Procurar credencial específica da loja
        const storeCred = existingCreds.find((c: any) => c.name === storeCredName);

        if (storeCred?.id) {
          const credsId = String(storeCred.id);
          console.log(`✅ [${storeName}] Credencial encontrada: ${storeCredName} (${credsId.slice(0, 8)}...)`);

          // Atualizar no banco
          const { error: updateError } = await supabase
            .from('store_bot_config')
            .update({ 
              openai_creds_id: credsId,
              updated_at: new Date().toISOString()
            })
            .eq('id', botConfig.id);

          if (updateError) {
            console.error(`❌ [${storeName}] Erro ao atualizar banco:`, updateError);
            results.push({
              store_id: storeId,
              store_name: storeName,
              store_slug: storeSlug,
              status: 'error',
              creds_id: credsId,
              error: `Erro ao salvar no banco: ${updateError.message}`
            });
            errors++;
          } else {
            console.log(`💾 [${storeName}] openai_creds_id salvo com sucesso!`);
            results.push({
              store_id: storeId,
              store_name: storeName,
              store_slug: storeSlug,
              status: 'migrated',
              creds_id: credsId,
              creds_name: storeCredName
            });
            migrated++;
          }
        } else {
          // Listar todas as credenciais encontradas para debug
          const foundCredsNames = existingCreds.map((c: any) => c.name).join(', ') || 'nenhuma';
          console.log(`⚠️ [${storeName}] Credencial '${storeCredName}' não encontrada. Disponíveis: ${foundCredsNames}`);
          
          results.push({
            store_id: storeId,
            store_name: storeName,
            store_slug: storeSlug,
            status: 'not_found',
            error: `Credencial '${storeCredName}' não existe na Evolution. Disponíveis: ${foundCredsNames}`
          });
          notFound++;
        }

      } catch (e) {
        console.error(`❌ [${storeName}] Erro inesperado:`, e);
        results.push({
          store_id: storeId,
          store_name: storeName,
          store_slug: storeSlug,
          status: 'error',
          error: e instanceof Error ? e.message : String(e)
        });
        errors++;
      }
    }

    console.log('\n📊 RESUMO DA MIGRAÇÃO:');
    console.log(`   Total: ${botsToMigrate.length}`);
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⏭️ Já configurados: ${alreadySet}`);
    console.log(`   ⚠️ Não encontrados: ${notFound}`);
    console.log(`   ❌ Erros: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migração concluída: ${migrated} lojas atualizadas`,
        total_bots: botsToMigrate.length,
        migrated,
        already_set: alreadySet,
        not_found: notFound,
        errors,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral na migração:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno na migração',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
