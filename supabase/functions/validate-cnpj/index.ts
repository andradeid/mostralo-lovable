import { corsHeaders } from "../_shared/cors.ts";

interface CNPJResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cnae_fiscal: number;
  cnaes_secundarios: Array<{ codigo: number; descricao: string }>;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  uf: string;
  municipio: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  email: string;
}

// CNAEs aceitos para vendedores/afiliados
const CNAES_ACEITOS = [
  '7319002', // Promoção de vendas
  '7319099', // Outras atividades de publicidade
  '4619200', // Representantes comerciais e agentes
  '7311400', // Agências de publicidade
  '8299799', // Outras atividades de serviços prestados
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj, skip_cnae_validation = false } = await req.json();

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar CNPJ (remover pontos, barras, traços)
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    if (cnpjLimpo.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ deve ter 14 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CNPJs de teste para desenvolvimento (não consulta Receita Federal)
    const TEST_CNPJS: Record<string, any> = {
      '11111111000111': {
        cnpj: '11111111000111',
        razao_social: 'EMPRESA TESTE LTDA',
        nome_fantasia: 'Empresa Teste',
        cnae_fiscal: 7319002,
        cnaes_secundarios: [
          { codigo: 7319099, descricao: 'Outras atividades de publicidade' }
        ],
        situacao_cadastral: 'ATIVA',
        uf: 'SP',
        municipio: 'São Paulo',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        complemento: 'Sala 101',
        bairro: 'Bela Vista',
        cep: '01310100',
        ddd_telefone_1: '1140028922',
        ddd_telefone_2: '',
        email: 'contato@empresateste.com.br'
      },
      '00000000000191': {
        cnpj: '00000000000191',
        razao_social: 'DESENVOLVEDOR MOSTRALO MEI',
        nome_fantasia: 'Dev Mostralo',
        cnae_fiscal: 4619200,
        cnaes_secundarios: [],
        situacao_cadastral: 'ATIVA',
        uf: 'DF',
        municipio: 'Brasília',
        logradouro: 'SQN 308 Bloco A',
        numero: '50',
        complemento: 'Apt 302',
        bairro: 'Asa Norte',
        cep: '70747010',
        ddd_telefone_1: '6199999999',
        ddd_telefone_2: '',
        email: 'dev@mostralo.com'
      }
    };

    // Verificar se é CNPJ de teste
    if (TEST_CNPJS[cnpjLimpo]) {
      console.log('🧪 Usando CNPJ de teste:', cnpjLimpo);
      const testData = TEST_CNPJS[cnpjLimpo];
      
      const cnaePrincipal = testData.cnae_fiscal.toString().padStart(7, '0');
      const cnaesSecundarios = testData.cnaes_secundarios?.map((c: any) => 
        c.codigo.toString().padStart(7, '0')
      ) || [];
      
      return new Response(
        JSON.stringify({
          valid: true,
          data: {
            cnpj: cnpjLimpo,
            razao_social: testData.razao_social,
            nome_fantasia: testData.nome_fantasia,
            cnae_fiscal: cnaePrincipal,
            cnaes_secundarios: cnaesSecundarios,
            situacao_cadastral: testData.situacao_cadastral,
            uf: testData.uf,
            municipio: testData.municipio,
            logradouro: testData.logradouro,
            numero: testData.numero,
            complemento: testData.complemento,
            bairro: testData.bairro,
            cep: testData.cep,
            ddd_telefone_1: testData.ddd_telefone_1,
            ddd_telefone_2: testData.ddd_telefone_2,
            email: testData.email,
          },
          cnaes_encontrados: [cnaePrincipal, ...cnaesSecundarios],
          is_test: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validando CNPJ: ${cnpjLimpo}`);

    // Consultar BrasilAPI
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'CNPJ não encontrado na Receita Federal' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`BrasilAPI error: ${response.status}`);
    }

    const data: CNPJResponse = await response.json();

    console.log(`CNPJ encontrado: ${data.razao_social}`);
    console.log(`Situação: ${data.situacao_cadastral}`);
    console.log(`CNAE principal: ${data.cnae_fiscal}`);

    // Verificar situação cadastral (aceitar "ATIVA" ou código 2)
    const situacao = String(data.situacao_cadastral).toUpperCase();
    const situacaoAtiva = situacao === 'ATIVA' || situacao === '2';
    
    if (!situacaoAtiva) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: `CNPJ com situação cadastral: ${data.situacao_cadastral}`,
          data,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se CNAE é compatível
    const cnaePrincipal = data.cnae_fiscal.toString().padStart(7, '0');
    const cnaesSecundarios = data.cnaes_secundarios?.map(c => 
      c.codigo.toString().padStart(7, '0')
    ) || [];
    
    const todosCnaes = [cnaePrincipal, ...cnaesSecundarios];

    // Validar CNAE apenas se skip_cnae_validation for false (para vendedores/afiliados)
    if (!skip_cnae_validation) {
      const cnaeValido = CNAES_ACEITOS.some(cnaeAceito => {
        // Verificar primeiros 4 dígitos (classe)
        const classeAceita = cnaeAceito.substring(0, 4);
        return todosCnaes.some(cnae => cnae.startsWith(classeAceita));
      });

      if (!cnaeValido) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: 'CNPJ não possui CNAE compatível. CNAEs aceitos: Promoção de vendas, Publicidade, Representantes comerciais, Agências de publicidade',
            data,
            cnaes_encontrados: todosCnaes,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // CNPJ válido
    console.log('✅ CNPJ válido e CNAE compatível');

    return new Response(
      JSON.stringify({
        valid: true,
        data: {
          cnpj: cnpjLimpo,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          cnae_fiscal: cnaePrincipal,
          cnaes_secundarios: cnaesSecundarios,
          situacao_cadastral: data.situacao_cadastral,
          uf: data.uf,
          municipio: data.municipio,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cep: data.cep,
          ddd_telefone_1: data.ddd_telefone_1,
          ddd_telefone_2: data.ddd_telefone_2,
          email: data.email,
        },
        cnaes_encontrados: todosCnaes,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao validar CNPJ:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Erro ao consultar BrasilAPI. Tente novamente.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
