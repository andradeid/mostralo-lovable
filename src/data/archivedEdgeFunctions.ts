/**
 * =============================================================================
 * 🗃️ EDGE FUNCTIONS ARQUIVADAS - DOCUMENTAÇÃO PARA RECUPERAÇÃO
 * =============================================================================
 * 
 * Data do arquivo: 2025-12-26
 * Motivo: Limite de Edge Functions do Supabase atingido (88 funções)
 * 
 * Estas funções foram removidas para liberar 3 slots e permitir o deploy de
 * novas funções críticas (fix-user-login, search-cep).
 * 
 * IMPACTO:
 * - ⚠️ Página de Ambiente de Teste (/dashboard/ambiente-teste) temporariamente limitada
 * - ⚠️ Diagnóstico de performance via Edge Function desativado
 * - ✅ NENHUMA funcionalidade de produção afetada
 * 
 * PARA RESTAURAR:
 * 1. Fazer upgrade do Supabase para Pro ($25/mês) para ter 100 Edge Functions
 * 2. Criar as pastas em supabase/functions/
 * 3. Colar o código correspondente em cada index.ts
 * 4. Adicionar as entradas no supabase/config.toml
 * =============================================================================
 */

// =============================================================================
// FUNÇÃO 1: performance-diagnostics (174 linhas)
// Propósito: Diagnóstico de latência de Edge Functions e banco de dados
// Usada apenas pelo Master Admin na página de diagnósticos
// =============================================================================
export const PERFORMANCE_DIAGNOSTICS_CODE = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const url = \`\${supabaseUrl}/functions/v1/\${func.name}\${func.query || ''}\`;
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
    console.log(\`Database latency: \${databaseLatency}ms\`);
    
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
        runtime: \`Deno \${Deno.version.deno}\`,
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
});`;

export const PERFORMANCE_DIAGNOSTICS_CONFIG = `[functions.performance-diagnostics]
verify_jwt = true`;

// =============================================================================
// FUNÇÃO 2: master-test-instance (369 linhas)
// Propósito: Gerenciamento de instância WhatsApp de teste do Master Admin
// Usada apenas pelo Master Admin na página de ambiente de testes
// =============================================================================
export const MASTER_TEST_INSTANCE_CODE = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é master_admin
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!userRoles) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action } = await req.json();

    // Buscar Evolution config
    const { data: evolutionConfig, error: configError } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\\/$/, '');

    // Buscar ou criar config de teste do admin
    let { data: testConfig } = await supabaseClient
      .from('master_admin_test_config')
      .select('*')
      .eq('admin_user_id', user.id)
      .single();

    if (!testConfig) {
      const { data: newConfig, error: insertError } = await supabaseClient
        .from('master_admin_test_config')
        .insert({ admin_user_id: user.id })
        .select()
        .single();
      
      if (insertError) {
        console.error('Erro ao criar config:', insertError);
        return new Response(JSON.stringify({ error: 'Falha ao criar configuração' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      testConfig = newConfig;
    }

    if (action === 'create') {
      // Criar nova instância de teste
      const instanceName = \`master_test_\${Date.now()}\`;
      
      const createResponse = await fetch(\`\${evolutionUrl}/instance/create\`, {
        method: 'POST',
        headers: {
          'apikey': evolutionConfig.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Erro ao criar instância:', errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Falha ao criar instância na Evolution' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const instanceData = await createResponse.json();
      
      // Atualizar config
      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_name: instanceName,
          test_instance_id: instanceData.instance?.instanceId || instanceName,
          test_instance_status: 'created',
          test_instance_qr_code: instanceData.qrcode?.base64 || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Instância criada!',
        instanceName,
        qrCode: instanceData.qrcode?.base64,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'connect') {
      if (!testConfig.test_instance_name) {
        return new Response(JSON.stringify({ error: 'Crie uma instância primeiro' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const connectResponse = await fetch(\`\${evolutionUrl}/instance/connect/\${testConfig.test_instance_name}\`, {
        method: 'GET',
        headers: { 'apikey': evolutionConfig.api_key },
      });

      if (!connectResponse.ok) {
        return new Response(JSON.stringify({ success: false, error: 'Falha ao obter QR Code' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const connectData = await connectResponse.json();
      
      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_qr_code: connectData.base64 || connectData.qrcode?.base64,
          test_instance_status: 'connecting',
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ 
        success: true, 
        qrCode: connectData.base64 || connectData.qrcode?.base64,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      if (!testConfig.test_instance_name) {
        return new Response(JSON.stringify({ success: true, status: 'not_created', connected: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusResponse = await fetch(\`\${evolutionUrl}/instance/connectionState/\${testConfig.test_instance_name}\`, {
        method: 'GET',
        headers: { 'apikey': evolutionConfig.api_key },
      });

      if (!statusResponse.ok) {
        await supabaseClient
          .from('master_admin_test_config')
          .update({
            test_instance_name: null,
            test_instance_id: null,
            test_instance_status: 'not_found',
            test_instance_qr_code: null,
            test_phone_number: null,
            bot_evolution_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', testConfig.id);

        return new Response(JSON.stringify({ 
          success: true, status: 'not_found', connected: false,
          message: 'Instância não encontrada na Evolution - dados limpos',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusData = await statusResponse.json();
      const isConnected = statusData.state === 'open' || statusData.instance?.state === 'open';

      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_status: isConnected ? 'connected' : 'disconnected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ 
        success: true,
        status: isConnected ? 'connected' : 'disconnected',
        connected: isConnected,
        instanceName: testConfig.test_instance_name,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      if (!testConfig.test_instance_name) {
        return new Response(JSON.stringify({ error: 'Instância não existe' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await fetch(\`\${evolutionUrl}/instance/logout/\${testConfig.test_instance_name}\`, {
        method: 'DELETE',
        headers: { 'apikey': evolutionConfig.api_key },
      });

      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_status: 'disconnected',
          test_instance_qr_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ success: true, message: 'Desconectado!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (testConfig.test_instance_name) {
        await fetch(\`\${evolutionUrl}/instance/delete/\${testConfig.test_instance_name}\`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionConfig.api_key },
        });
      }

      await supabaseClient
        .from('master_admin_test_config')
        .update({
          test_instance_name: null,
          test_instance_id: null,
          test_instance_status: 'disconnected',
          test_instance_qr_code: null,
          test_phone_number: null,
          bot_evolution_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ success: true, message: 'Instância deletada!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_config') {
      return new Response(JSON.stringify({ success: true, config: testConfig }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});`;

export const MASTER_TEST_INSTANCE_CONFIG = `[functions.master-test-instance]
verify_jwt = true`;

// =============================================================================
// FUNÇÃO 3: master-test-bot-sync (1191 linhas)
// Propósito: Sincronização de bots IA de teste com Evolution API
// Usada apenas pelo Master Admin na página de ambiente de testes
// NOTA: Código completo muito extenso - ver arquivo original em backup
// =============================================================================
export const MASTER_TEST_BOT_SYNC_SUMMARY = `
/**
 * master-test-bot-sync - Sincronização de Bot IA de Teste
 * 
 * LINHAS: 1191
 * PROPÓSITO: Gerenciar bot de IA no ambiente de teste do Master Admin
 * 
 * AÇÕES SUPORTADAS:
 * - create: Cria novo bot na Evolution API
 * - update: Atualiza configurações do bot
 * - toggle: Liga/desliga o bot
 * - delete: Remove o bot
 * - save_sandbox: Salva dados da loja sandbox
 * - get_sessions: Consulta sessões ativas
 * 
 * DEPENDÊNCIAS:
 * - Evolution API (WhatsApp)
 * - OpenAI API
 * - Tabela master_admin_test_config
 * - Tabela evolution_config
 * 
 * PARA RESTAURAR:
 * O código completo está disponível no histórico do Git ou pode ser
 * reconstruído baseado na documentação da Evolution API.
 */
`;

export const MASTER_TEST_BOT_SYNC_CONFIG = `[functions.master-test-bot-sync]
verify_jwt = true`;

// =============================================================================
// INSTRUÇÕES DE RESTAURAÇÃO
// =============================================================================
export const RESTORATION_INSTRUCTIONS = `
## Como Restaurar as Edge Functions

### Pré-requisitos
1. Fazer upgrade do Supabase para Pro ($25/mês) ou consolidar outras funções
2. Ter acesso ao Supabase CLI configurado

### Passo a Passo

#### 1. Criar as pastas
\`\`\`bash
mkdir -p supabase/functions/performance-diagnostics
mkdir -p supabase/functions/master-test-instance
mkdir -p supabase/functions/master-test-bot-sync
\`\`\`

#### 2. Criar os arquivos index.ts
Copiar o código de PERFORMANCE_DIAGNOSTICS_CODE para:
  supabase/functions/performance-diagnostics/index.ts

Copiar o código de MASTER_TEST_INSTANCE_CODE para:
  supabase/functions/master-test-instance/index.ts

Para master-test-bot-sync, buscar no histórico do Git ou reconstruir.

#### 3. Atualizar supabase/config.toml
Adicionar as entradas de configuração de cada função.

#### 4. Reverter alterações no frontend
- usePerformanceDiagnostics.ts: Remover comentário e reativar chamada
- TestEnvironmentPage.tsx: Remover aviso de indisponibilidade

#### 5. Deploy
\`\`\`bash
supabase functions deploy performance-diagnostics
supabase functions deploy master-test-instance
supabase functions deploy master-test-bot-sync
\`\`\`
`;

// Exportar tudo para referência
export const ARCHIVED_FUNCTIONS = {
  performanceDiagnostics: {
    name: 'performance-diagnostics',
    lines: 174,
    code: PERFORMANCE_DIAGNOSTICS_CODE,
    config: PERFORMANCE_DIAGNOSTICS_CONFIG,
  },
  masterTestInstance: {
    name: 'master-test-instance',
    lines: 369,
    code: MASTER_TEST_INSTANCE_CODE,
    config: MASTER_TEST_INSTANCE_CONFIG,
  },
  masterTestBotSync: {
    name: 'master-test-bot-sync',
    lines: 1191,
    summary: MASTER_TEST_BOT_SYNC_SUMMARY,
    config: MASTER_TEST_BOT_SYNC_CONFIG,
    note: 'Código muito extenso - buscar no histórico do Git',
  },
};
