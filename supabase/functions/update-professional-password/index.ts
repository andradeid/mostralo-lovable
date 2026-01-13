import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

interface UpdatePasswordRequest {
  professional_id: string;
  new_password: string;
  store_id: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Creating admin client...');
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body: UpdatePasswordRequest = await req.json();
    
    console.log('Request received:', { 
      professional_id: body.professional_id, 
      store_id: body.store_id,
      password_length: body.new_password?.length || 0
    });

    // Validações
    if (!body.professional_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID do profissional é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.new_password || body.new_password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.store_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar profissional e validar que pertence à loja
    console.log('Fetching professional...');
    const { data: professional, error: professionalError } = await supabaseAdmin
      .from('professionals')
      .select('id, user_id, name, store_id')
      .eq('id', body.professional_id)
      .eq('store_id', body.store_id)
      .single();

    if (professionalError || !professional) {
      console.error('Professional not found:', professionalError);
      return new Response(
        JSON.stringify({ success: false, error: 'Profissional não encontrado ou não pertence a esta loja' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Professional found:', professional.name, 'user_id:', professional.user_id);

    if (!professional.user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profissional não possui conta de acesso vinculada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar senha do usuário usando Admin API
    console.log('Updating password for user:', professional.user_id);
    
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      professional.user_id,
      { password: body.new_password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao atualizar senha: ${updateError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password updated successfully for:', professional.name);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Senha atualizada com sucesso'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
