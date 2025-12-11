import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';

// Simple hash function using Web Crypto API
async function generateVerificationHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    console.log('Buscando vendedor para user_id:', user.id);
    
    const { data: salesperson, error: salespersonError } = await supabase
      .from('salespeople')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Resultado da busca:', { salesperson, salespersonError });

    if (salespersonError) {
      console.error('Erro ao buscar vendedor:', salespersonError);
      throw new Error('Erro ao buscar dados do vendedor');
    }

    if (!salesperson) {
      throw new Error('Vendedor não encontrado');
    }

    if (salesperson.status !== 'pending_contract') {
      throw new Error('Contrato já foi aceito ou vendedor não está aprovado');
    }

    // Buscar template ativo do contrato
    const { data: template, error: templateError } = await supabase
      .from('salesperson_contract_templates')
      .select('id, version')
      .eq('is_active', true)
      .maybeSingle();

    // Obter IP e user agent
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';
    const accepted_at = new Date().toISOString();

    // Gerar hash de verificação único
    const hashData = `${salesperson.id}|${template?.version || '1.0'}|${accepted_at}|${ip_address}|${user.id}`;
    const verification_hash = await generateVerificationHash(hashData);

    // Usar nome diretamente do registro do vendedor
    const salespersonName = salesperson.full_name || null;

    // Criar registro de aceite do contrato
    const { error: contractError } = await supabase
      .from('salesperson_contracts')
      .insert({
        salesperson_id: salesperson.id,
        version: template?.version || '1.0',
        accepted_at,
        ip_address,
        user_agent,
        verification_hash,
        contract_template_id: template?.id || null,
        salesperson_name: salespersonName,
        salesperson_cnpj: salesperson.cnpj || null,
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
        contract_accepted_at: accepted_at
      })
      .eq('id', salesperson.id);

    if (updateError) {
      console.error('Erro ao atualizar vendedor:', updateError);
      throw new Error('Erro ao ativar vendedor');
    }

    console.log(`Contrato aceito pelo vendedor ${salesperson.id} - Hash: ${verification_hash}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contrato aceito com sucesso',
        verification_hash
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
