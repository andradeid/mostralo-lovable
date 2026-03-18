import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Esta função é legado da migração Evolution → UaZapi.
// As credenciais OpenAI agora são gerenciadas diretamente via uazapi_config e store_bot_config.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Esta função foi descontinuada. As credenciais OpenAI agora são gerenciadas diretamente via UaZapi (uazapi_config e store_bot_config).',
      deprecated: true,
      total_bots: 0,
      migrated: 0,
      not_found: 0,
      already_set: 0,
      errors: 0,
      details: []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
