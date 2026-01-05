import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit config para signup (mais restritivo)
const MAX_ATTEMPTS = 3;
const WINDOW_SECONDS = 300; // 5 minutos

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
}

// Validação de senha forte
function validateStrongPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'A senha deve ter no mínimo 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um número.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um caractere especial (!@#$%^&*...).' };
  }
  return { valid: true, message: '' };
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
    const body = await req.json();
    const { email, password, honeypot, metadata } = body;

    // 🍯 Honeypot check - se preenchido, é bot
    if (honeypot && honeypot.trim() !== '') {
      console.log(`🤖 Bot detectado via honeypot: ${getClientIP(req)}`);
      // Retorna sucesso falso para não alertar o bot
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Cadastro realizado! Verifique seu email.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validações básicas
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido. Verifique o formato do email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Senha é obrigatória.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔒 Validação de senha forte
    const passwordValidation = validateStrongPassword(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const clientIP = getClientIP(req);
    const ipIdentifier = `signup_ip:${clientIP}`;
    const emailIdentifier = `signup_email:${normalizedEmail}`;

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
        console.log(`🚫 IP bloqueado signup: ${clientIP}, aguardar ${retryAfter}s`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas de cadastro. Aguarde ${Math.ceil(retryAfter / 60)} minuto(s).`,
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
        
        console.log(`🚫 IP rate limit signup excedido: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas de cadastro. Aguarde ${Math.ceil(WINDOW_SECONDS / 60)} minuto(s).`,
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
        console.log(`🚫 Email bloqueado signup: ${normalizedEmail}, aguardar ${retryAfter}s`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas de cadastro. Aguarde ${Math.ceil(retryAfter / 60)} minuto(s).`,
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
        
        console.log(`🚫 Email rate limit signup excedido: ${normalizedEmail}`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas de cadastro. Aguarde ${Math.ceil(WINDOW_SECONDS / 60)} minuto(s).`,
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

    // Registrar tentativa para IP e Email
    const updateAttempts = async () => {
      // IP
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

      // Email
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
    };

    // Calcular tentativas restantes
    const ipRemaining = MAX_ATTEMPTS - ((ipAttempt?.attempt_count || 0) + 1);
    const emailRemaining = MAX_ATTEMPTS - ((emailAttempt?.attempt_count || 0) + 1);
    const remaining = Math.min(Math.max(0, ipRemaining), Math.max(0, emailRemaining));

    // Tentar criar conta
    const redirectUrl = metadata?.redirectUrl || `${req.headers.get('origin') || 'https://mostralo.com.br'}/`;
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirmar email para permitir login imediato
      user_metadata: metadata?.user_metadata || {}
    });

    if (error) {
      console.log(`❌ Falha no signup: ${normalizedEmail} - ${error.message}`);
      
      // Registrar tentativa falha
      await updateAttempts();
      
      // Mensagem amigável
      let friendlyMessage = 'Erro ao criar conta. Tente novamente.';
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        friendlyMessage = 'Este email já está cadastrado. Tente fazer login.';
      } else if (error.message.includes('invalid')) {
        friendlyMessage = 'Dados inválidos. Verifique as informações.';
      }

      return new Response(
        JSON.stringify({ 
          error: friendlyMessage,
          remaining,
          blocked: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Signup bem-sucedido
    console.log(`✅ Signup bem-sucedido: ${normalizedEmail}`);
    
    // Limpar registros de rate limit para este IP e email
    await supabase
      .from('rate_limit_attempts')
      .delete()
      .in('identifier', [ipIdentifier, emailIdentifier]);

    // Retornar sucesso
    return new Response(
      JSON.stringify({ 
        success: true,
        user: data.user,
        message: 'Conta criada com sucesso!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro inesperado signup-auth:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao criar conta. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
