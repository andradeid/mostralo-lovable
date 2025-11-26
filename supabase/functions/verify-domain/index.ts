import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { domain } = await req.json();
    
    console.log('🔍 Verificando domínio:', domain);
    
    // Validar formato do domínio
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      console.log('❌ Formato de domínio inválido:', domain);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Formato de domínio inválido' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se não é um subdomínio do mostralo
    if (domain.includes('mostralo.app') || domain.includes('mostralo.com.br')) {
      console.log('❌ Domínio inválido - subdomínio do Mostralo:', domain);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Use um domínio próprio, não um subdomínio do Mostralo' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let isConfigured = false;
    let message = 'DNS ainda não propagado. Aguarde até 48h.';

    try {
      // Verificar registros DNS
      // Verificar registro A (deve apontar para 185.158.133.1)
      const aRecords = await Deno.resolveDns(domain, "A");
      console.log('📋 Registros A encontrados:', aRecords);
      
      const hasCorrectARecord = aRecords.some((record: string) => record === "185.158.133.1");
      
      if (hasCorrectARecord) {
        isConfigured = true;
        message = 'Domínio configurado corretamente!';
        console.log('✅ Domínio verificado com sucesso');
      } else {
        console.log('⚠️ Registro A não aponta para o IP correto');
        message = 'Registro A não aponta para 185.158.133.1. Verifique sua configuração DNS.';
      }
    } catch (dnsError) {
      console.log('⚠️ Erro ao verificar DNS:', dnsError);
      
      // Se não conseguir verificar, considerar como não propagado ainda
      message = 'DNS ainda não propagado ou configurado incorretamente. Verifique os registros e aguarde a propagação (até 48h).';
    }

    console.log('📊 Resultado da verificação:', { domain, verified: isConfigured, message });

    return new Response(
      JSON.stringify({ 
        verified: isConfigured,
        message: message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('💥 Erro na função verify-domain:', error);
    return new Response(
      JSON.stringify({ 
        verified: false,
        error: (error as Error).message || 'Erro ao verificar domínio'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
