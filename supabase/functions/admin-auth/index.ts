import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getClientIP, rateLimitExceededResponse } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    // Validações básicas
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido. Verifique o formato do email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || password.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Senha é obrigatória.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const clientIP = getClientIP(req);

    // Rate limiting por IP (5 tentativas a cada 60 segundos)
    const ipRateLimit = checkRateLimit(`admin_login_ip:${clientIP}`, 5, 60000);
    if (!ipRateLimit.allowed) {
      console.log(`🚫 Rate limit IP excedido: ${clientIP}`);
      return rateLimitExceededResponse(ipRateLimit, corsHeaders);
    }

    // Rate limiting por email (5 tentativas a cada 60 segundos)
    const emailRateLimit = checkRateLimit(`admin_login_email:${normalizedEmail}`, 5, 60000);
    if (!emailRateLimit.allowed) {
      console.log(`🚫 Rate limit email excedido: ${normalizedEmail}`);
      return rateLimitExceededResponse(emailRateLimit, corsHeaders);
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Tentar autenticar
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      console.log(`❌ Falha no login admin: ${normalizedEmail} - ${error.message}`);
      
      // Mensagem amigável
      let friendlyMessage = 'Email ou senha incorretos.';
      if (error.message === 'Invalid login credentials') {
        friendlyMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
      } else if (error.message.includes('Email not confirmed')) {
        friendlyMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      }

      // Retornar remaining para feedback visual
      const remaining = Math.min(ipRateLimit.remaining, emailRateLimit.remaining);
      
      return new Response(
        JSON.stringify({ 
          error: friendlyMessage,
          remaining,
          blocked: false
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Login admin bem-sucedido: ${normalizedEmail}`);

    // Retornar sessão para o cliente
    return new Response(
      JSON.stringify({ 
        session: data.session,
        user: data.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro inesperado admin-auth:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao fazer login. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
