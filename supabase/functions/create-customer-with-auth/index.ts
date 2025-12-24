import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      phone, 
      storeId, 
      email, 
      notes, 
      latitude, 
      longitude, 
      address,
      whatsappJid,
      whatsappValid
    } = await req.json();

    console.log('[create-customer-with-auth] Iniciando criação de cliente:', { name, phone, storeId });

    // Validações básicas
    if (!name || !phone || !storeId) {
      console.log('[create-customer-with-auth] Dados obrigatórios faltando');
      return new Response(
        JSON.stringify({ success: false, error: 'Nome, telefone e storeId são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalizar telefone (remover DDI 55 se houver, manter apenas DDD + número)
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('55') && normalizedPhone.length > 11) {
      normalizedPhone = normalizedPhone.substring(2);
    }

    console.log('[create-customer-with-auth] Telefone normalizado:', normalizedPhone);

    // Verificar se cliente já existe
    const { data: existingCustomer, error: searchError } = await supabase
      .from('customers')
      .select('id, auth_user_id, name')
      .eq('phone', normalizedPhone)
      .is('deleted_at', null)
      .maybeSingle();

    if (searchError) {
      console.error('[create-customer-with-auth] Erro ao buscar cliente:', searchError);
      throw searchError;
    }

    let customerId: string;
    let passwordCreated: string | null = null;
    let isNewCustomer = false;
    let alreadyHasAuth = false;

    // Gerar email temporário se não fornecido
    const tempEmail = email?.trim() || `cliente_${normalizedPhone}@mostralo.me`;
    
    // Senha = últimos 6 dígitos do telefone
    const autoPassword = normalizedPhone.slice(-6);

    if (existingCustomer) {
      console.log('[create-customer-with-auth] Cliente existente encontrado:', existingCustomer.id);
      customerId = existingCustomer.id;

      if (existingCustomer.auth_user_id) {
        // Cliente JÁ TEM autenticação - apenas vincular à loja
        console.log('[create-customer-with-auth] Cliente já possui auth_user_id, apenas vinculando');
        alreadyHasAuth = true;

        // Atualizar dados do cliente (exceto auth)
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            name: name.trim(),
            email: email?.trim() || null,
            address: address?.trim() || null,
            notes: notes?.trim() || null,
            latitude: latitude || null,
            longitude: longitude || null,
            whatsapp_jid: whatsappJid || null,
            whatsapp_valid: whatsappValid || null,
            whatsapp_validated_at: whatsappValid ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', customerId);

        if (updateError) {
          console.error('[create-customer-with-auth] Erro ao atualizar cliente:', updateError);
          throw updateError;
        }

      } else {
        // Cliente NÃO TEM autenticação - criar agora
        console.log('[create-customer-with-auth] Cliente sem auth, criando autenticação');

        // Criar usuário no auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: tempEmail,
          password: autoPassword,
          email_confirm: true,
          user_metadata: {
            name: name.trim(),
            phone: normalizedPhone,
            role: 'customer'
          }
        });

        if (authError) {
          // Se email já existe, tentar com variação
          if (authError.message.includes('already been registered') || authError.message.includes('duplicate')) {
            console.log('[create-customer-with-auth] Email já existe, tentando variação');
            const uniqueEmail = `cliente_${normalizedPhone}_${Date.now()}@mostralo.me`;
            
            const { data: retryAuthUser, error: retryError } = await supabase.auth.admin.createUser({
              email: uniqueEmail,
              password: autoPassword,
              email_confirm: true,
              user_metadata: {
                name: name.trim(),
                phone: normalizedPhone,
                role: 'customer'
              }
            });

            if (retryError) {
              console.error('[create-customer-with-auth] Erro ao criar auth (retry):', retryError);
              throw retryError;
            }

            // Atualizar cliente com auth_user_id
            const { error: updateError } = await supabase
              .from('customers')
              .update({
                auth_user_id: retryAuthUser.user.id,
                name: name.trim(),
                email: uniqueEmail,
                address: address?.trim() || null,
                notes: notes?.trim() || null,
                latitude: latitude || null,
                longitude: longitude || null,
                whatsapp_jid: whatsappJid || null,
                whatsapp_valid: whatsappValid || null,
                whatsapp_validated_at: whatsappValid ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', customerId);

            if (updateError) throw updateError;

            // Criar role
            await supabase.from('user_roles').upsert({
              user_id: retryAuthUser.user.id,
              role: 'customer'
            }, { onConflict: 'user_id,role' });

            passwordCreated = autoPassword;

          } else {
            console.error('[create-customer-with-auth] Erro ao criar auth:', authError);
            throw authError;
          }
        } else {
          // Auth criado com sucesso
          const { error: updateError } = await supabase
            .from('customers')
            .update({
              auth_user_id: authUser.user.id,
              name: name.trim(),
              email: tempEmail,
              address: address?.trim() || null,
              notes: notes?.trim() || null,
              latitude: latitude || null,
              longitude: longitude || null,
              whatsapp_jid: whatsappJid || null,
              whatsapp_valid: whatsappValid || null,
              whatsapp_validated_at: whatsappValid ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', customerId);

          if (updateError) throw updateError;

          // Criar role
          await supabase.from('user_roles').upsert({
            user_id: authUser.user.id,
            role: 'customer'
          }, { onConflict: 'user_id,role' });

          passwordCreated = autoPassword;
        }
      }

    } else {
      // Cliente NOVO - criar tudo
      console.log('[create-customer-with-auth] Criando novo cliente');
      isNewCustomer = true;

      // Criar usuário no auth.users
      let authUserId: string;
      let finalEmail = tempEmail;

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: autoPassword,
        email_confirm: true,
        user_metadata: {
          name: name.trim(),
          phone: normalizedPhone,
          role: 'customer'
        }
      });

      if (authError) {
        if (authError.message.includes('already been registered') || authError.message.includes('duplicate')) {
          console.log('[create-customer-with-auth] Email já existe, tentando variação');
          finalEmail = `cliente_${normalizedPhone}_${Date.now()}@mostralo.me`;
          
          const { data: retryAuthUser, error: retryError } = await supabase.auth.admin.createUser({
            email: finalEmail,
            password: autoPassword,
            email_confirm: true,
            user_metadata: {
              name: name.trim(),
              phone: normalizedPhone,
              role: 'customer'
            }
          });

          if (retryError) {
            console.error('[create-customer-with-auth] Erro ao criar auth (retry):', retryError);
            throw retryError;
          }
          authUserId = retryAuthUser.user.id;
        } else {
          console.error('[create-customer-with-auth] Erro ao criar auth:', authError);
          throw authError;
        }
      } else {
        authUserId = authUser.user.id;
      }

      // Criar cliente
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          name: name.trim(),
          phone: normalizedPhone,
          email: finalEmail,
          auth_user_id: authUserId,
          address: address?.trim() || null,
          notes: notes?.trim() || null,
          latitude: latitude || null,
          longitude: longitude || null,
          whatsapp_jid: whatsappJid || null,
          whatsapp_valid: whatsappValid || null,
          whatsapp_validated_at: whatsappValid ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[create-customer-with-auth] Erro ao criar cliente:', insertError);
        // Deletar auth user se cliente falhou
        await supabase.auth.admin.deleteUser(authUserId);
        throw insertError;
      }

      customerId = newCustomer.id;

      // Criar role
      await supabase.from('user_roles').upsert({
        user_id: authUserId,
        role: 'customer'
      }, { onConflict: 'user_id,role' });

      passwordCreated = autoPassword;
    }

    // SEMPRE: Criar/atualizar vínculo com a loja
    console.log('[create-customer-with-auth] Vinculando cliente à loja:', storeId);
    const { error: relationError } = await supabase
      .from('customer_stores')
      .upsert({
        customer_id: customerId,
        store_id: storeId,
        first_order_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id,store_id'
      });

    if (relationError) {
      console.error('[create-customer-with-auth] Erro ao vincular loja:', relationError);
      throw relationError;
    }

    console.log('[create-customer-with-auth] Sucesso!', { 
      customerId, 
      isNewCustomer, 
      alreadyHasAuth, 
      hasPassword: !!passwordCreated 
    });

    return new Response(
      JSON.stringify({
        success: true,
        customer_id: customerId,
        is_new: isNewCustomer,
        already_has_auth: alreadyHasAuth,
        password: passwordCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-customer-with-auth] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
