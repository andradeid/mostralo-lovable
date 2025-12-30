import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  store_id: string;
  module_key: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { store_id, module_key } = body;

    if (!store_id || !module_key) {
      return new Response(
        JSON.stringify({ error: 'store_id e module_key são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, plan_id')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .select('id, key, name, is_active')
      .eq('key', module_key)
      .single();

    if (moduleError || !moduleData || !moduleData.is_active) {
      return new Response(
        JSON.stringify({ error: 'Módulo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let isInPlan = false;
    if (store.plan_id) {
      const { data: planModules, error: planError } = await supabase
        .from('plan_modules')
        .select('module_id')
        .eq('plan_id', store.plan_id)
        .eq('module_id', moduleData.id)
        .limit(1);

      if (planError) throw planError;
      isInPlan = (planModules || []).length > 0;
    }

    const { data: storeModule, error: storeModuleError } = await supabase
      .from('store_modules')
      .select('is_enabled, blocked_reason, blocked_at')
      .eq('store_id', store_id)
      .eq('module_id', moduleData.id)
      .maybeSingle();

    if (storeModuleError) throw storeModuleError;

    let isBlocked = false;
    let isFromPlan = false;
    let isExtraAccess = false;
    let hasAccess = false;

    if (isInPlan) {
      isFromPlan = true;
      isBlocked = storeModule ? storeModule.is_enabled === false : false;
      hasAccess = !isBlocked;
    } else {
      if (storeModule && storeModule.is_enabled === true) {
        isExtraAccess = true;
        hasAccess = true;
      } else {
        isBlocked = true;
        hasAccess = false;
      }
    }

    return new Response(
      JSON.stringify({
        has_access: hasAccess,
        is_from_plan: isFromPlan,
        is_extra_access: isExtraAccess,
        is_blocked: isBlocked,
        blocked_reason: storeModule?.blocked_reason ?? null,
        blocked_at: storeModule?.blocked_at ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('❌ store-module-access error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao verificar módulo' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
