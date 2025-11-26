import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the session from the Authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { action, data } = await req.json();
    console.log('Customer account action:', action, 'for user:', user.id);

    // Buscar customer do usuário
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (customerError || !customer) {
      console.error('Customer not found:', customerError);
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    switch (action) {
      case 'update_profile': {
        const { name, email, address, latitude, longitude } = data;

        // Validações
        if (!name || name.trim().length < 3) {
          return new Response(
            JSON.stringify({ error: 'Nome deve ter pelo menos 3 caracteres' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return new Response(
            JSON.stringify({ error: 'Email inválido' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Atualizar customer
        const { error: updateError } = await supabaseClient
          .from('customers')
          .update({
            name: name.trim(),
            email: email?.trim() || null,
            address: address?.trim() || null,
            latitude: latitude || null,
            longitude: longitude || null,
          })
          .eq('id', customer.id);

        if (updateError) {
          console.error('Update error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar perfil' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Perfil atualizado com sucesso' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'change_password': {
        const { newPassword } = data;

        if (!newPassword || newPassword.length < 6) {
          return new Response(
            JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Atualizar senha no auth
        const { error: passwordError } = await supabaseClient.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          console.error('Password update error:', passwordError);
          return new Response(
            JSON.stringify({ error: 'Erro ao alterar senha' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Senha alterada com sucesso' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'delete_account': {
        // Verificar se há pedidos pendentes
        const { data: pendingOrders } = await supabaseClient
          .from('orders')
          .select('id')
          .eq('customer_id', customer.id)
          .in('status', ['entrada', 'em_preparo', 'aguarda_retirada', 'em_transito'])
          .limit(1);

        if (pendingOrders && pendingOrders.length > 0) {
          return new Response(
            JSON.stringify({ 
              error: 'Você possui pedidos pendentes. Aguarde a conclusão antes de excluir sua conta.' 
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Soft delete - anonimizar dados
        const { error: deleteError } = await supabaseClient
          .from('customers')
          .update({
            deleted_at: new Date().toISOString(),
            name: 'Usuário Excluído',
            email: null,
            address: null,
            latitude: null,
            longitude: null,
            notes: null,
          })
          .eq('id', customer.id);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Erro ao excluir conta' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Deslogar o usuário
        await supabaseClient.auth.signOut();

        return new Response(
          JSON.stringify({ success: true, message: 'Conta excluída com sucesso' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
