import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityRule {
  id: string;
  tier_full_commission: number;
  tier_reduced_commission: number;
  tier_minimum_commission: number;
  evaluation_period_days: number;
  grace_period_days: number;
}

interface Salesperson {
  id: string;
  full_name: string;
  commission_tier: string;
  active_clients_count: number;
  tier_warning_sent_at: string | null;
}

const determineTier = (activeClients: number, rules: ActivityRule) => {
  if (activeClients >= rules.tier_full_commission) {
    return { tier: 'full', percentage: 100, label: 'Integral' };
  }
  if (activeClients >= rules.tier_reduced_commission) {
    return { tier: 'reduced', percentage: 80, label: 'Reduzida' };
  }
  if (activeClients >= rules.tier_minimum_commission) {
    return { tier: 'minimum', percentage: 50, label: 'Mínima' };
  }
  return { tier: 'suspended', percentage: 0, label: 'Suspensa' };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[evaluate-portfolios] Iniciando avaliação de carteiras...');

    // 1. Buscar regras de atividade ativas
    const { data: rules, error: rulesError } = await supabase
      .from('salesperson_activity_rules')
      .select('*')
      .eq('is_active', true)
      .single();

    if (rulesError || !rules) {
      console.log('[evaluate-portfolios] Nenhuma regra ativa encontrada, usando padrões');
      // Usar valores padrão se não houver regras configuradas
    }

    const activeRules: ActivityRule = rules || {
      id: 'default',
      tier_full_commission: 10,
      tier_reduced_commission: 5,
      tier_minimum_commission: 2,
      evaluation_period_days: 90,
      grace_period_days: 30
    };

    console.log('[evaluate-portfolios] Regras:', JSON.stringify(activeRules));

    // 2. Buscar todos os Parceiros PJ ativos
    const { data: salespeople, error: salespeopleError } = await supabase
      .from('salespeople')
      .select('id, full_name, commission_tier, active_clients_count, tier_warning_sent_at')
      .eq('salesperson_type', 'partner')
      .eq('status', 'active');

    if (salespeopleError) {
      throw new Error(`Erro ao buscar vendedores: ${salespeopleError.message}`);
    }

    console.log(`[evaluate-portfolios] ${salespeople?.length || 0} vendedores PJ ativos encontrados`);

    const results = {
      evaluated: 0,
      upgraded: 0,
      downgraded: 0,
      unchanged: 0,
      warnings_sent: 0,
      errors: [] as string[]
    };

    const now = new Date();
    const gracePeriodMs = activeRules.grace_period_days * 24 * 60 * 60 * 1000;

    // 3. Avaliar cada vendedor
    for (const sp of (salespeople || [])) {
      try {
        // Contar clientes ativos (lojas com assinatura ativa referenciadas pelo vendedor)
        const { count: activeClients, error: countError } = await supabase
          .from('stores')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by_salesperson_id', sp.id)
          .gt('subscription_expires_at', now.toISOString());

        if (countError) {
          results.errors.push(`Erro ao contar clientes de ${sp.full_name}: ${countError.message}`);
          continue;
        }

        const clientCount = activeClients || 0;
        const previousTier = sp.commission_tier || 'full';
        const newTierInfo = determineTier(clientCount, activeRules);

        console.log(`[evaluate-portfolios] ${sp.full_name}: ${clientCount} clientes ativos, faixa ${previousTier} -> ${newTierInfo.tier}`);

        // Verificar se houve mudança
        if (previousTier !== newTierInfo.tier) {
          const isDowngrade = ['full', 'reduced', 'minimum', 'suspended'].indexOf(newTierInfo.tier) > 
                              ['full', 'reduced', 'minimum', 'suspended'].indexOf(previousTier);

          // Se é rebaixamento e ainda está em período de graça
          if (isDowngrade && sp.tier_warning_sent_at) {
            const warningDate = new Date(sp.tier_warning_sent_at);
            const timeSinceWarning = now.getTime() - warningDate.getTime();
            
            if (timeSinceWarning < gracePeriodMs) {
              console.log(`[evaluate-portfolios] ${sp.full_name} ainda em período de graça`);
              results.unchanged++;
              continue;
            }
          }

          // Se é rebaixamento e não tem warning, enviar warning
          if (isDowngrade && !sp.tier_warning_sent_at) {
            await supabase
              .from('salespeople')
              .update({ 
                tier_warning_sent_at: now.toISOString(),
                active_clients_count: clientCount
              })
              .eq('id', sp.id);

            results.warnings_sent++;
            console.log(`[evaluate-portfolios] Warning enviado para ${sp.full_name}`);
            continue;
          }

          // Aplicar mudança de faixa
          const { error: updateError } = await supabase
            .from('salespeople')
            .update({
              commission_tier: newTierInfo.tier,
              active_clients_count: clientCount,
              tier_warning_sent_at: null,
              last_tier_evaluation_at: now.toISOString()
            })
            .eq('id', sp.id);

          if (updateError) {
            results.errors.push(`Erro ao atualizar ${sp.full_name}: ${updateError.message}`);
            continue;
          }

          // Registrar avaliação - calcular período do trimestre
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          const quarterEnd = new Date(quarterStart);
          quarterEnd.setMonth(quarterEnd.getMonth() + 3);
          quarterEnd.setDate(quarterEnd.getDate() - 1);

          await supabase
            .from('salesperson_portfolio_evaluations')
            .insert({
              salesperson_id: sp.id,
              evaluation_period_start: quarterStart.toISOString().split('T')[0],
              evaluation_period_end: quarterEnd.toISOString().split('T')[0],
              active_clients_count: clientCount,
              previous_tier: previousTier,
              new_tier: newTierInfo.tier,
              new_commission_percentage: newTierInfo.percentage,
              notes: isDowngrade 
                ? `Rebaixamento após período de graça: ${previousTier} -> ${newTierInfo.tier}`
                : `Promoção de faixa: ${previousTier} -> ${newTierInfo.tier}`
            });

          if (isDowngrade) {
            results.downgraded++;
          } else {
            results.upgraded++;
          }
        } else {
          // Apenas atualizar contagem de clientes
          await supabase
            .from('salespeople')
            .update({ 
              active_clients_count: clientCount,
              tier_warning_sent_at: null // Limpar warning se voltou ao normal
            })
            .eq('id', sp.id);

          results.unchanged++;
        }

        results.evaluated++;
      } catch (spError: unknown) {
        const errorMessage = spError instanceof Error ? spError.message : 'Erro desconhecido';
        results.errors.push(`Erro ao processar ${sp.full_name}: ${errorMessage}`);
      }
    }

    console.log('[evaluate-portfolios] Resultado:', JSON.stringify(results));

    return new Response(JSON.stringify({
      success: true,
      message: 'Avaliação de carteiras concluída',
      results,
      rules_used: activeRules,
      evaluated_at: now.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[evaluate-portfolios] Erro:', errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
