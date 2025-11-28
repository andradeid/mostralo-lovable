import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar dados do vendedor
    const { data: salesperson, error: salespersonError } = await supabase
      .from('salespeople')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (salespersonError || !salesperson) {
      throw new Error('Vendedor não encontrado');
    }

    if (salesperson.status !== 'pending_contract') {
      throw new Error('Contrato já foi aceito ou vendedor não está aprovado');
    }

    // Obter IP e user agent
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    // Criar registro de aceite do contrato
    const { error: contractError } = await supabase
      .from('salesperson_contracts')
      .insert({
        salesperson_id: salesperson.id,
        contract_version: '1.0',
        accepted_at: new Date().toISOString(),
        ip_address,
        user_agent
      });

    if (contractError) {
      console.error('Erro ao criar registro de contrato:', contractError);
      throw new Error('Erro ao registrar aceite do contrato');
    }

    // Atualizar status do vendedor para ativo
    const { error: updateError } = await supabase
      .from('salespeople')
      .update({
        status: 'active',
        contract_accepted_at: new Date().toISOString()
      })
      .eq('id', salesperson.id);

    if (updateError) {
      console.error('Erro ao atualizar vendedor:', updateError);
      throw new Error('Erro ao ativar vendedor');
    }

    console.log(`Contrato aceito pelo vendedor ${salesperson.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contrato aceito com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro ao aceitar contrato:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
