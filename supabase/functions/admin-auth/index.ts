import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Rate limit config
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 60;

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const ipIdentifier = `admin_login_ip:${clientIP}`;
    const emailIdentifier = `admin_login_email:${normalizedEmail}`;

    // Verificar rate limit no banco de dados
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SECONDS * 1000);

    // Verificar IP
    const { data: ipAttempt } = await supabase
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', ipIdentifier)
      .gte('first_attempt_at', windowStart.toISOString())
      .maybeSingle();

    if (ipAttempt) {
      if (ipAttempt.blocked_until && new Date(ipAttempt.blocked_until) > now) {
        const retryAfter = Math.ceil((new Date(ipAttempt.blocked_until).getTime() - now.getTime()) / 1000);
        console.log(`🚫 IP bloqueado: ${clientIP}, aguardar ${retryAfter}s`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas. Aguarde ${retryAfter} segundos.`,
            retryAfterSeconds: retryAfter,
            blocked: true
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter)
            } 
          }
        );
      }
      if (ipAttempt.attempt_count >= MAX_ATTEMPTS) {
        const blockedUntil = new Date(now.getTime() + WINDOW_SECONDS * 1000);
        await supabase
          .from('rate_limit_attempts')
          .update({ blocked_until: blockedUntil.toISOString() })
          .eq('id', ipAttempt.id);
        
        console.log(`🚫 IP rate limit excedido: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas. Aguarde ${WINDOW_SECONDS} segundos.`,
            retryAfterSeconds: WINDOW_SECONDS,
            blocked: true
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(WINDOW_SECONDS)
            } 
          }
        );
      }
    }

    // Verificar Email
    const { data: emailAttempt } = await supabase
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', emailIdentifier)
      .gte('first_attempt_at', windowStart.toISOString())
      .maybeSingle();

    if (emailAttempt) {
      if (emailAttempt.blocked_until && new Date(emailAttempt.blocked_until) > now) {
        const retryAfter = Math.ceil((new Date(emailAttempt.blocked_until).getTime() - now.getTime()) / 1000);
        console.log(`🚫 Email bloqueado: ${normalizedEmail}, aguardar ${retryAfter}s`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas. Aguarde ${retryAfter} segundos.`,
            retryAfterSeconds: retryAfter,
            blocked: true
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter)
            } 
          }
        );
      }
      if (emailAttempt.attempt_count >= MAX_ATTEMPTS) {
        const blockedUntil = new Date(now.getTime() + WINDOW_SECONDS * 1000);
        await supabase
          .from('rate_limit_attempts')
          .update({ blocked_until: blockedUntil.toISOString() })
          .eq('id', emailAttempt.id);
        
        console.log(`🚫 Email rate limit excedido: ${normalizedEmail}`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas. Aguarde ${WINDOW_SECONDS} segundos.`,
            retryAfterSeconds: WINDOW_SECONDS,
            blocked: true
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(WINDOW_SECONDS)
            } 
          }
        );
      }
    }

    // Tentar autenticar
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      console.log(`❌ Falha no login admin: ${normalizedEmail} - ${error.message}`);
      
      // Registrar tentativa falha para IP
      if (ipAttempt) {
        await supabase
          .from('rate_limit_attempts')
          .update({ 
            attempt_count: ipAttempt.attempt_count + 1,
            last_attempt_at: now.toISOString()
          })
          .eq('id', ipAttempt.id);
      } else {
        await supabase
          .from('rate_limit_attempts')
          .insert({ 
            identifier: ipIdentifier,
            attempt_count: 1,
            first_attempt_at: now.toISOString(),
            last_attempt_at: now.toISOString()
          });
      }

      // Registrar tentativa falha para Email
      if (emailAttempt) {
        await supabase
          .from('rate_limit_attempts')
          .update({ 
            attempt_count: emailAttempt.attempt_count + 1,
            last_attempt_at: now.toISOString()
          })
          .eq('id', emailAttempt.id);
      } else {
        await supabase
          .from('rate_limit_attempts')
          .insert({ 
            identifier: emailIdentifier,
            attempt_count: 1,
            first_attempt_at: now.toISOString(),
            last_attempt_at: now.toISOString()
          });
      }

      // Calcular tentativas restantes
      const ipRemaining = MAX_ATTEMPTS - ((ipAttempt?.attempt_count || 0) + 1);
      const emailRemaining = MAX_ATTEMPTS - ((emailAttempt?.attempt_count || 0) + 1);
      const remaining = Math.min(Math.max(0, ipRemaining), Math.max(0, emailRemaining));
      
      // Mensagem amigável
      let friendlyMessage = 'Email ou senha incorretos.';
      if (error.message === 'Invalid login credentials') {
        friendlyMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
      } else if (error.message.includes('Email not confirmed')) {
        friendlyMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      }

      return new Response(
        JSON.stringify({ 
          error: friendlyMessage,
          remaining,
          blocked: false
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Login bem-sucedido - limpar tentativas
    console.log(`✅ Login admin bem-sucedido: ${normalizedEmail}`);
    
    // Limpar registros de rate limit para este IP e email
    await supabase
      .from('rate_limit_attempts')
      .delete()
      .in('identifier', [ipIdentifier, emailIdentifier]);

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
