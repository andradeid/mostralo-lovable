import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normaliza telefone para formato WhatsApp (com DDI 55 Brasil)
function normalizePhoneForWhatsApp(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  
  if (normalized.startsWith('55') && normalized.length >= 12 && normalized.length <= 13) {
    return normalized;
  }
  
  if (normalized.length >= 10 && normalized.length <= 11) {
    return '55' + normalized;
  }
  
  return normalized;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { customerIds, storeId, forceRevalidate = false } = await req.json();
    console.log(`[validate-whatsapp-batch] Validando ${customerIds?.length || 0} clientes para loja ${storeId}`);

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return new Response(JSON.stringify({ error: 'customerIds é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!storeId) {
      return new Response(JSON.stringify({ error: 'storeId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar clientes
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, phone, whatsapp_valid, whatsapp_validated_at')
      .in('id', customerIds);

    if (customersError) {
      console.error('[validate-whatsapp-batch] Erro ao buscar clientes:', customersError);
      return new Response(JSON.stringify({ error: 'Erro ao buscar clientes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filtrar clientes que precisam validação
    // Cache de 30 dias - não revalidar se já foi validado recentemente
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const customersToValidate = customers?.filter(c => {
      if (!c.phone) return false;
      if (forceRevalidate) return true;
      if (c.whatsapp_valid === null) return true;
      if (!c.whatsapp_validated_at) return true;
      const validatedAt = new Date(c.whatsapp_validated_at);
      return validatedAt < thirtyDaysAgo;
    }) || [];

    const cachedCount = (customers?.length || 0) - customersToValidate.length;
    console.log(`[validate-whatsapp-batch] ${customersToValidate.length} para validar, ${cachedCount} em cache`);

    if (customersToValidate.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        validated: 0,
        valid: 0,
        invalid: 0,
        cached: cachedCount,
        message: 'Todos os números já estão validados (cache de 30 dias)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar configuração da Evolution API
    const { data: evolutionConfig } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!evolutionConfig) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar instância master WhatsApp para validar
    const { data: masterConfig } = await supabase
      .from('master_whatsapp_config')
      .select('instance_name, instance_status')
      .single();

    if (!masterConfig || masterConfig.instance_status !== 'connected') {
      return new Response(JSON.stringify({ error: 'Instância master não conectada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let validated = 0;
    let validCount = 0;
    let invalidCount = 0;
    const results: { id: string; valid: boolean; jid?: string }[] = [];

    // Validar em lotes de 5 para não sobrecarregar a API
    const batchSize = 5;
    for (let i = 0; i < customersToValidate.length; i += batchSize) {
      const batch = customersToValidate.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (customer) => {
        try {
          const normalizedPhone = normalizePhoneForWhatsApp(customer.phone);
          
          // Verificar se o número existe no WhatsApp
          const checkResponse = await fetch(
            `${evolutionConfig.api_url}/chat/whatsappNumbers/${masterConfig.instance_name}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionConfig.api_key,
              },
              body: JSON.stringify({
                numbers: [normalizedPhone]
              }),
            }
          );

          if (!checkResponse.ok) {
            console.error(`[validate-whatsapp-batch] Erro na API para ${normalizedPhone}:`, await checkResponse.text());
            return { id: customer.id, valid: false, error: 'Erro na API' };
          }

          const checkData = await checkResponse.json();
          const numberInfo = checkData?.[0];
          const isValid = numberInfo?.exists === true;
          const jid = numberInfo?.jid || null;

          // Atualizar no banco
          await supabase
            .from('customers')
            .update({
              whatsapp_valid: isValid,
              whatsapp_validated_at: new Date().toISOString(),
              whatsapp_jid: jid,
            })
            .eq('id', customer.id);

          return { id: customer.id, valid: isValid, jid };
        } catch (err) {
          console.error(`[validate-whatsapp-batch] Erro ao validar ${customer.id}:`, err);
          return { id: customer.id, valid: false, error: 'Exceção' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        validated++;
        if (result.valid) {
          validCount++;
        } else {
          invalidCount++;
        }
        results.push(result);
      }

      // Pequena pausa entre lotes para não sobrecarregar
      if (i + batchSize < customersToValidate.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[validate-whatsapp-batch] Concluído: ${validated} validados, ${validCount} válidos, ${invalidCount} inválidos`);

    return new Response(JSON.stringify({
      success: true,
      validated,
      valid: validCount,
      invalid: invalidCount,
      cached: cachedCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[validate-whatsapp-batch] Erro:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
