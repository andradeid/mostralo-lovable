import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando verificação de leads parados...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar leads parados há mais de 3 dias que ainda não receberam lembrete recente
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: staleLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, company_name, phone, city, status, updated_at, salesperson_id, last_follow_up_reminder_at')
      .in('status', ['new', 'contacted', 'qualified'])
      .lt('updated_at', threeDaysAgo.toISOString())
      .or(`last_follow_up_reminder_at.is.null,last_follow_up_reminder_at.lt.${threeDaysAgo.toISOString()}`);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
      throw leadsError;
    }

    console.log(`📊 Encontrados ${staleLeads?.length || 0} leads parados`);

    if (!staleLeads || staleLeads.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum lead parado encontrado',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar master admins para leads sem vendedor
    const { data: masterAdmins, error: adminsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'master_admin')
      .limit(1);

    if (adminsError) {
      console.error('❌ Erro ao buscar master admins:', adminsError);
    }

    const defaultAdminId = masterAdmins?.[0]?.user_id;

    // Criar lembretes para cada lead
    const reminders = [];
    const leadIds = [];

    for (const lead of staleLeads) {
      const now = new Date();
      const updatedAt = new Date(lead.updated_at);
      const daysStale = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

      // Determinar para quem enviar o lembrete
      let targetUserId = lead.salesperson_id;
      
      if (!targetUserId && defaultAdminId) {
        targetUserId = defaultAdminId;
      }

      if (!targetUserId) {
        console.log(`⚠️ Lead ${lead.id} sem vendedor ou admin associado, pulando...`);
        continue;
      }

      // Buscar user_id do vendedor
      let userId = targetUserId;
      if (lead.salesperson_id) {
        const { data: salesperson } = await supabase
          .from('salespeople')
          .select('user_id')
          .eq('id', lead.salesperson_id)
          .single();
        
        if (salesperson?.user_id) {
          userId = salesperson.user_id;
        }
      }

      const urgencyLabel = daysStale >= 7 ? '🔴 URGENTE!' : daysStale >= 5 ? '🟠 Alerta!' : '🟡 Atenção';
      
      reminders.push({
        lead_id: lead.id,
        user_id: userId,
        type: 'stale_lead',
        title: `${urgencyLabel} Lead parado há ${daysStale} dias`,
        message: `O lead "${lead.name}" (${lead.company_name}) está sem atualização há ${daysStale} dias. Status atual: ${lead.status}. Faça follow-up agora!`,
        lead_name: lead.name,
        lead_company: lead.company_name,
        days_stale: daysStale
      });

      leadIds.push(lead.id);
    }

    // Inserir lembretes
    if (reminders.length > 0) {
      const { error: insertError } = await supabase
        .from('lead_follow_up_reminders')
        .insert(reminders);

      if (insertError) {
        console.error('❌ Erro ao inserir lembretes:', insertError);
        throw insertError;
      }

      console.log(`✅ ${reminders.length} lembretes criados`);

      // Atualizar last_follow_up_reminder_at nos leads
      const { error: updateError } = await supabase
        .from('leads')
        .update({ last_follow_up_reminder_at: new Date().toISOString() })
        .in('id', leadIds);

      if (updateError) {
        console.error('❌ Erro ao atualizar leads:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${reminders.length} lembretes criados para leads parados`,
        count: reminders.length,
        leads: staleLeads.map(l => ({
          id: l.id,
          name: l.name,
          company: l.company_name,
          status: l.status,
          updated_at: l.updated_at
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Erro na função check-stale-leads:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
