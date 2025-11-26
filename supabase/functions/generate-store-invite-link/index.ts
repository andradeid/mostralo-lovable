import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { store_id, expires_in_days, max_uses } = await req.json();

    if (!store_id) {
      return new Response(JSON.stringify({ error: 'store_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Generating invite link for store:', store_id, 'by user:', user.id);

    // Verificar se usuário é master admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isMasterAdmin = userRoles?.some(r => r.role === 'master_admin');

    // Verificar se usuário é dono da loja e buscar custom domain
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, owner_id, name, custom_domain')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      console.error('Store not found:', storeError);
      return new Response(JSON.stringify({ error: 'Loja não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isMasterAdmin && store.owner_id !== user.id) {
      console.error('Permission denied. User:', user.id, 'Store owner:', store.owner_id);
      return new Response(JSON.stringify({ error: 'Sem permissão para criar link desta loja' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gerar token único
    const inviteToken = crypto.randomUUID();

    // Calcular expiração
    let expiresAt = null;
    if (expires_in_days && expires_in_days > 0) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + expires_in_days);
      expiresAt = expireDate.toISOString();
    }

    // Criar link de convite
    const { data: inviteLink, error: insertError } = await supabase
      .from('store_invite_links')
      .insert({
        store_id,
        token: inviteToken,
        created_by: user.id,
        expires_at: expiresAt,
        max_uses: max_uses && max_uses > 0 ? max_uses : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Construir URL completo do link usando custom domain se disponível e válido
    let baseUrl = 'https://mostralo.app'; // default
    
    if (store.custom_domain) {
      // Limpar e validar custom domain
      const cleanDomain = store.custom_domain.replace(/^(https?:\/\/)?(www\.)?/, '');
      const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      
      // Se válido, usar custom domain; senão, usar mostralo.app
      if (domainPattern.test(cleanDomain) && cleanDomain.length > 3) {
        baseUrl = `https://${cleanDomain}`;
      }
    }
    
    const fullLink = `${baseUrl}/cadastro-entregador?invite=${inviteToken}`;

    console.log('Invite link created successfully:', inviteLink.id, 'with base URL:', baseUrl);

    return new Response(JSON.stringify({
      success: true,
      invite_link: fullLink,
      token: inviteToken,
      expires_at: expiresAt,
      max_uses: max_uses || null,
      store_name: store.name
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
