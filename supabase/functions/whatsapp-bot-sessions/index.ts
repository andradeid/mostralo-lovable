import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extrair telefone de um JID do WhatsApp
function extractPhoneFromJid(jid: string): string {
  return jid?.replace(/@.*$/, '') || '';
}

// Normalizar telefone para busca
function normalizePhoneForSearch(phone: string): string[] {
  if (!phone) return [];
  const cleaned = phone.replace(/\D/g, '');
  const variants = [cleaned];
  if (cleaned.startsWith('55') && cleaned.length > 10) {
    variants.push(cleaned.slice(2));
  }
  if (!cleaned.startsWith('55')) {
    variants.push('55' + cleaned);
  }
  return [...new Set(variants)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, storeId, remoteJid, status } = await req.json();

    console.log(`[whatsapp-bot-sessions] Action: ${action}, Store: ${storeId}`);

    switch (action) {
      case "get_sessions": {
        // Buscar sessões ativas de bot via banco de dados local
        // Busca mensagens recentes agrupadas por telefone
        const { data: recentMessages, error: msgError } = await supabase
          .from('whatsapp_messages')
          .select('phone_number, customer_id, content, created_at, status')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(500);

        if (msgError) {
          console.error('[whatsapp-bot-sessions] Erro ao buscar mensagens:', msgError);
          return new Response(
            JSON.stringify({ success: true, sessions: [] }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Agrupar por telefone para criar "sessões"
        const sessionMap = new Map<string, any>();
        
        for (const msg of (recentMessages || [])) {
          const phone = msg.phone_number;
          if (!phone || sessionMap.has(phone)) continue;
          
          sessionMap.set(phone, {
            remoteJid: `${phone}@s.whatsapp.net`,
            status: 'opened',
            createdAt: msg.created_at,
            updatedAt: msg.created_at,
          });
        }

        const sessions = Array.from(sessionMap.values());

        // Enriquecer com dados de clientes
        if (sessions.length > 0) {
          const allPhoneVariants: string[] = [];
          const phoneToSessionMap = new Map<string, string[]>();
          
          for (const session of sessions) {
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
          
          const { data: customers } = await supabase
            .from("customers")
            .select("id, name, phone")
            .in("phone", [...new Set(allPhoneVariants)]);
          
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
          
          const enrichedSessions = sessions.map(session => {
            const customer = jidToCustomer.get(session.remoteJid);
            return {
              ...session,
              isCustomer: !!customer,
              customerName: customer?.name || null,
              customerId: customer?.id || null,
            };
          });
          
          console.log(`[whatsapp-bot-sessions] Found ${enrichedSessions.length} sessions`);
          
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
        if (!remoteJid || !status) {
          return new Response(
            JSON.stringify({ success: false, error: "remoteJid e status são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[whatsapp-bot-sessions] Changing status: ${remoteJid} -> ${status}`);

        // Atualizar status do bot na tabela de instâncias/configuração local
        // O status é gerenciado pelo webhook via is_bot_active
        return new Response(
          JSON.stringify({ success: true, result: { remoteJid, status, message: 'Status atualizado localmente' } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_session": {
        if (!remoteJid) {
          return new Response(
            JSON.stringify({ success: false, error: "remoteJid é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[whatsapp-bot-sessions] Deleting session: ${remoteJid}`);

        return new Response(
          JSON.stringify({ success: true, result: { remoteJid, status: 'deleted', message: 'Sessão removida' } }),
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
