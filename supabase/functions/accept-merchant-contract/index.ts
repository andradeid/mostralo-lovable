import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptanceRequest {
  user_id: string;
  store_id?: string;
  contract_version: string;
  contract_template_id?: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  cookies_accepted: boolean;
  marketing_accepted: boolean;
  business_info_declaration: boolean;
  company_authorization: boolean;
  compliance_commitment: boolean;
}

// Generate SHA-256 hash for verification
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const body: AcceptanceRequest = await req.json();
    
    console.log('📋 Processing merchant contract acceptance:', {
      user_id: body.user_id,
      store_id: body.store_id,
      contract_version: body.contract_version,
      ip: clientIP
    });

    // Validate required fields
    if (!body.user_id || !body.contract_version) {
      return new Response(
        JSON.stringify({ error: 'user_id and contract_version are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all required acceptances
    if (!body.terms_accepted || !body.privacy_accepted || !body.cookies_accepted ||
        !body.business_info_declaration || !body.company_authorization || !body.compliance_commitment) {
      return new Response(
        JSON.stringify({ error: 'All required terms must be accepted' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate verification hash
    const acceptedAt = new Date().toISOString();
    const hashData = `${body.user_id}-${body.store_id || 'none'}-${body.contract_version}-${acceptedAt}-${clientIP}-${userAgent}`;
    const verificationHash = await generateHash(hashData);

    // Get active contract template if not provided
    let templateId = body.contract_template_id;
    if (!templateId) {
      const { data: activeTemplate } = await supabase
        .from('merchant_contract_templates')
        .select('id')
        .eq('version', body.contract_version)
        .eq('is_active', true)
        .single();
      
      templateId = activeTemplate?.id;
    }

    // Insert acceptance record
    const { data: acceptance, error: insertError } = await supabase
      .from('merchant_contract_acceptance')
      .insert({
        user_id: body.user_id,
        store_id: body.store_id || null,
        contract_version: body.contract_version,
        contract_template_id: templateId || null,
        accepted_at: acceptedAt,
        ip_address: clientIP,
        user_agent: userAgent,
        verification_hash: verificationHash,
        terms_accepted: body.terms_accepted,
        privacy_accepted: body.privacy_accepted,
        cookies_accepted: body.cookies_accepted,
        marketing_accepted: body.marketing_accepted || false,
        business_info_declaration: body.business_info_declaration,
        company_authorization: body.company_authorization,
        compliance_commitment: body.compliance_commitment,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting acceptance:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Contract acceptance recorded:', {
      id: acceptance.id,
      hash: verificationHash.substring(0, 16) + '...'
    });

    return new Response(
      JSON.stringify({
        success: true,
        acceptance_id: acceptance.id,
        verification_hash: verificationHash,
        accepted_at: acceptedAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
