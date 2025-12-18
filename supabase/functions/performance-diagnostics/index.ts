import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Edge Functions críticas para testar
const FUNCTIONS_TO_TEST = [
  { name: 'validate-cpf', method: 'POST', body: { cpf: '12345678909' }, requiresAuth: false },
  { name: 'validate-cnpj', method: 'POST', body: { cnpj: '12345678000195' }, requiresAuth: false },
  { name: 'store-info-json', method: 'GET', query: '?slug=test', requiresAuth: false },
  { name: 'sitemap', method: 'GET', query: '', requiresAuth: false },
];

interface FunctionTestResult {
  name: string;
  latency: number;
  status: 'ok' | 'slow' | 'error';
  statusCode: number;
  error?: string;
}

interface DiagnosticResponse {
  timestamp: string;
  serverInfo: {
    region: string;
    runtime: string;
  };
  functionTests: FunctionTestResult[];
  summary: {
    total: number;
    tested: number;
    avgLatency: number;
    fastCount: number;
    slowCount: number;
    errorCount: number;
  };
  databaseLatency?: number;
}

async function testEdgeFunction(
  supabaseUrl: string,
  anonKey: string,
  func: typeof FUNCTIONS_TO_TEST[0]
): Promise<FunctionTestResult> {
  const start = performance.now();
  
  try {
    const url = `${supabaseUrl}/functions/v1/${func.name}${func.query || ''}`;
    const options: RequestInit = {
      method: func.method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
    };
    
    if (func.method === 'POST' && func.body) {
      options.body = JSON.stringify(func.body);
    }
    
    const response = await fetch(url, options);
    const latency = Math.round(performance.now() - start);
    
    let status: 'ok' | 'slow' | 'error' = 'ok';
    if (response.status >= 400) {
      status = 'error';
    } else if (latency > 300) {
      status = 'slow';
    } else if (latency > 100) {
      status = 'ok';
    }
    
    return {
      name: func.name,
      latency,
      status,
      statusCode: response.status,
    };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    return {
      name: func.name,
      latency,
      status: 'error',
      statusCode: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testDatabaseLatency(supabaseUrl: string, serviceKey: string): Promise<number> {
  const start = performance.now();
  try {
    const client = createClient(supabaseUrl, serviceKey);
    await client.from('stores').select('id').limit(1);
    return Math.round(performance.now() - start);
  } catch {
    return -1;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Starting performance diagnostics...');
    
    // Test database latency
    const databaseLatency = await testDatabaseLatency(supabaseUrl, supabaseServiceKey);
    console.log(`Database latency: ${databaseLatency}ms`);
    
    // Test edge functions in parallel
    const functionTestPromises = FUNCTIONS_TO_TEST.map(func => 
      testEdgeFunction(supabaseUrl, supabaseAnonKey, func)
    );
    
    const functionTests = await Promise.all(functionTestPromises);
    
    // Calculate summary
    const validTests = functionTests.filter(t => t.status !== 'error');
    const avgLatency = validTests.length > 0 
      ? Math.round(validTests.reduce((sum, t) => sum + t.latency, 0) / validTests.length)
      : 0;
    
    const summary = {
      total: FUNCTIONS_TO_TEST.length,
      tested: functionTests.length,
      avgLatency,
      fastCount: functionTests.filter(t => t.status === 'ok' && t.latency < 100).length,
      slowCount: functionTests.filter(t => t.status === 'slow').length,
      errorCount: functionTests.filter(t => t.status === 'error').length,
    };
    
    const response: DiagnosticResponse = {
      timestamp: new Date().toISOString(),
      serverInfo: {
        region: Deno.env.get('DENO_REGION') || 'unknown',
        runtime: `Deno ${Deno.version.deno}`,
      },
      functionTests,
      summary,
      databaseLatency,
    };
    
    console.log('Performance diagnostics completed:', JSON.stringify(summary));
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error running performance diagnostics:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
