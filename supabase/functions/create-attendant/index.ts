import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { email, password, full_name, store_id } = await req.json();

    // Validate required fields
    if (!email || !password || !store_id) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando: email, password, store_id' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify JWT token to ensure request is from authenticated admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the calling user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.log('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User trying to create attendant:', user.id, user.email);

    // Check if user is master_admin or store_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    const isMasterAdmin = profile?.user_type === 'master_admin';
    
    // Check user role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isStoreAdmin = userRole?.role === 'store_admin' || profile?.user_type === 'store_admin';

    // Verify user owns the store OR is master admin
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, owner_id')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const isStoreOwner = store.owner_id === user.id;

    if (!isStoreOwner && !isMasterAdmin) {
      return new Response(
        JSON.stringify({ 
          error: 'Você não tem permissão para criar atendentes nesta loja'
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the attendant user using admin API
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name || null,
        role_type: 'attendant' // Marca que é um atendente
      }
    });

    if (createUserError || !newUser.user) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: createUserError?.message || 'Erro ao criar usuário' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify profile was created
    const { data: createdProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', newUser.user.id)
      .single();

    if (profileCheckError || !createdProfile) {
      console.error('Profile not created by trigger:', profileCheckError);
      // Try to clean up the user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Erro: perfil não foi criado automaticamente',
          details: profileCheckError?.message || 'Trigger handle_new_user não executou'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Profile verified:', createdProfile.id);

    // Limpar user_type do profile e garantir que full_name está salvo
    // (atendentes não devem ter user_type)
    // Isso evita conflitos com o trigger sync_user_roles_from_profiles
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ 
        user_type: null,
        full_name: full_name || null  // Garantir que o nome está salvo
      })
      .eq('id', newUser.user.id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
      // Não é crítico, continuar
    }

    // Se o trigger já criou um role indesejado, remover
    const { error: deleteOldRoleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', newUser.user.id)
      .neq('role', 'attendant');

    if (deleteOldRoleError) {
      console.log('No old roles to delete or error deleting:', deleteOldRoleError.message);
      // Não é crítico, continuar
    }

    // Create attendant role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'attendant',
        store_id: store_id
      })
      .select();

    if (roleError) {
      console.error('Role creation error:', roleError);
      console.error('Role error code:', roleError.code);
      console.error('Role error message:', roleError.message);
      console.error('Role error details:', roleError.details);
      console.error('Role error hint:', roleError.hint);
      
      // Try to clean up the user if role creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar role de atendente',
          code: roleError.code,
          message: roleError.message,
          details: roleError.details,
          hint: roleError.hint
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Role created successfully:', roleData);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: newUser.user.id,
        email: newUser.user.email
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro inesperado' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

