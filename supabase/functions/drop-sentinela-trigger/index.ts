// Placeholder - this function was used to drop Sentinela triggers
// The actual drop is done via database migration
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ message: 'Sentinela trigger already handled via migration' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});