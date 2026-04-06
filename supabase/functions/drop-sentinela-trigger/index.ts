import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const results: string[] = [];

  // Drop trigger
  const { error: e1 } = await admin.rpc('exec_sql', {
    query: `DROP TRIGGER IF EXISTS trigger_track_sentinela_conversion ON public.orders;`
  }).maybeSingle();
  
  if (e1) {
    // Try raw SQL via pg
    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({ query: 'DROP TRIGGER IF EXISTS trigger_track_sentinela_conversion ON public.orders;' })
      });
      results.push(`trigger drop via rpc: ${resp.status}`);
    } catch (err) {
      results.push(`trigger drop error: ${err}`);
    }
  } else {
    results.push('trigger dropped');
  }

  // Drop function
  const { error: e2 } = await admin.rpc('exec_sql', {
    query: `DROP FUNCTION IF EXISTS public.track_sentinela_conversion();`
  }).maybeSingle();
  
  if (e2) {
    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({ query: 'DROP FUNCTION IF EXISTS public.track_sentinela_conversion();' })
      });
      results.push(`function drop via rpc: ${resp.status}`);
    } catch (err) {
      results.push(`function drop error: ${err}`);
    }
  } else {
    results.push('function dropped');
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});