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
    const { cnpj } = await req.json();

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

    // Verificar situação cadastral
    if (data.situacao_cadastral !== 'ATIVA') {
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

    // CNPJ válido e CNAE compatível
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
