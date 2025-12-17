import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normaliza telefone para busca (mesma lógica do webhook)
function normalizePhoneForSearch(phone: string): string[] {
  const digits = phone.replace(/\D/g, '');
  const variants: string[] = [];
  
  // Remove DDI 55 se presente
  let baseNumber = digits;
  if (digits.startsWith('55') && digits.length > 11) {
    baseNumber = digits.substring(2);
  }
  
  variants.push(baseNumber);
  variants.push('55' + baseNumber);
  
  // Variantes com/sem 9º dígito para celulares brasileiros
  if (baseNumber.length === 11 && baseNumber[2] === '9') {
    const without9 = baseNumber.substring(0, 2) + baseNumber.substring(3);
    variants.push(without9);
    variants.push('55' + without9);
  } else if (baseNumber.length === 10) {
    const with9 = baseNumber.substring(0, 2) + '9' + baseNumber.substring(2);
    variants.push(with9);
    variants.push('55' + with9);
  }
  
  return [...new Set(variants)];
}

// Extrai número de telefone do remoteJid
function extractPhoneFromJid(remoteJid: string): string {
  return remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, storeId, botId, instanceName, remoteJid, status } = await req.json();

    console.log(`[whatsapp-bot-sessions] Action: ${action}, Store: ${storeId}, Instance: ${instanceName}`);

    // Buscar configuração da Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from("evolution_config")
      .select("api_url, api_key")
      .eq("is_active", true)
      .single();

    if (configError || !evolutionConfig) {
      console.error("[whatsapp-bot-sessions] Evolution config not found:", configError);
      return new Response(
        JSON.stringify({ success: false, error: "Configuração da Evolution API não encontrada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { api_url, api_key } = evolutionConfig;

    // Buscar botId do store_bot_config se não fornecido
    let effectiveBotId = botId;
    let effectiveInstanceName = instanceName;

    if (!effectiveBotId || !effectiveInstanceName) {
      // Buscar da store_bot_config
      const { data: botConfig } = await supabase
        .from("store_bot_config")
        .select("evolution_bot_id")
        .eq("store_id", storeId)
        .single();

      // Buscar instance_name da whatsapp_instances
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("store_id", storeId)
        .single();

      if (botConfig?.evolution_bot_id) {
        effectiveBotId = botConfig.evolution_bot_id;
      }
      if (instance?.instance_name) {
        effectiveInstanceName = instance.instance_name;
      }
    }

    if (!effectiveBotId || !effectiveInstanceName) {
      return new Response(
        JSON.stringify({ success: false, error: "Bot não configurado para esta loja" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "get_sessions": {
        // GET /openai/fetchSessions/{botId}/{instanceName}
        const url = `${api_url}/openai/fetchSessions/${effectiveBotId}/${effectiveInstanceName}`;
        console.log(`[whatsapp-bot-sessions] Fetching sessions from: ${url}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "apikey": api_key,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[whatsapp-bot-sessions] Evolution API error: ${response.status} - ${errorText}`);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao buscar sessões: ${response.status}` }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const sessions = await response.json();
        console.log(`[whatsapp-bot-sessions] Found ${Array.isArray(sessions) ? sessions.length : 0} sessions`);

        // Enriquecer sessões com dados de clientes
        const sessionsArray = Array.isArray(sessions) ? sessions : [];
        
        if (sessionsArray.length > 0) {
          // Extrair todos os telefones e criar variantes para busca
          const allPhoneVariants: string[] = [];
          const phoneToSessionMap = new Map<string, string[]>();
          
          for (const session of sessionsArray) {
            const phone = extractPhoneFromJid(session.remoteJid);
            const variants = normalizePhoneForSearch(phone);
            
            for (const variant of variants) {
              allPhoneVariants.push(variant);
              if (!phoneToSessionMap.has(variant)) {
                phoneToSessionMap.set(variant, []);
              }
              phoneToSessionMap.get(variant)!.push(session.remoteJid);
            }
          }
          
          // Buscar clientes que correspondem aos telefones
          const { data: customers } = await supabase
            .from("customers")
            .select("id, name, phone")
            .in("phone", [...new Set(allPhoneVariants)]);
          
          // Criar mapa de remoteJid → cliente
          const jidToCustomer = new Map<string, { id: string; name: string }>();
          
          if (customers && customers.length > 0) {
            for (const customer of customers) {
              const customerVariants = normalizePhoneForSearch(customer.phone);
              for (const variant of customerVariants) {
                const jids = phoneToSessionMap.get(variant);
                if (jids) {
                  for (const jid of jids) {
                    jidToCustomer.set(jid, { id: customer.id, name: customer.name });
                  }
                }
              }
            }
          }
          
          // Enriquecer sessões com dados do cliente
          const enrichedSessions = sessionsArray.map(session => {
            const customer = jidToCustomer.get(session.remoteJid);
            return {
              ...session,
              isCustomer: !!customer,
              customerName: customer?.name || null,
              customerId: customer?.id || null,
            };
          });
          
          console.log(`[whatsapp-bot-sessions] Enriched ${enrichedSessions.filter(s => s.isCustomer).length} sessions with customer data`);
          
          return new Response(
            JSON.stringify({ success: true, sessions: enrichedSessions }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, sessions: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "change_status": {
        // POST /openai/changeStatus/{instanceName}
        if (!remoteJid || !status) {
          return new Response(
            JSON.stringify({ success: false, error: "remoteJid e status são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const url = `${api_url}/openai/changeStatus/${effectiveInstanceName}`;
        console.log(`[whatsapp-bot-sessions] Changing status at: ${url} - ${remoteJid} -> ${status}`);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "apikey": api_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remoteJid,
            status, // 'opened', 'paused', 'closed'
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[whatsapp-bot-sessions] Evolution API error: ${response.status} - ${errorText}`);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao alterar status: ${response.status}` }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const result = await response.json();
        console.log(`[whatsapp-bot-sessions] Status changed successfully:`, result);

        return new Response(
          JSON.stringify({ success: true, result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_session": {
        // POST /openai/changeStatus/{instanceName} com status: "delete"
        if (!remoteJid) {
          return new Response(
            JSON.stringify({ success: false, error: "remoteJid é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const url = `${api_url}/openai/changeStatus/${effectiveInstanceName}`;
        console.log(`[whatsapp-bot-sessions] Deleting session at: ${url} - ${remoteJid}`);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "apikey": api_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remoteJid,
            status: "delete",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[whatsapp-bot-sessions] Evolution API error: ${response.status} - ${errorText}`);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao excluir sessão: ${response.status}` }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const result = await response.json();
        console.log(`[whatsapp-bot-sessions] Session deleted successfully:`, result);

        return new Response(
          JSON.stringify({ success: true, result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[whatsapp-bot-sessions] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
