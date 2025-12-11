import { corsHeaders } from "../_shared/cors.ts";

interface ValidateCPFRequest {
  cpf: string;
}

// Validar formato e dígitos verificadores do CPF
function isValidCPF(cpf: string): boolean {
  // Remover caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verificar se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Verificar se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF.charAt(9)) !== digit1) {
    return false;
  }
  
  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF.charAt(10)) !== digit2) {
    return false;
  }
  
  return true;
}

// Formatar CPF para exibição
function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ValidateCPFRequest = await req.json();
    const { cpf } = body;

    if (!cpf) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'CPF não informado' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanCPF = cpf.replace(/\D/g, '');
    
    console.log(`Validando CPF: ${cleanCPF.substring(0, 3)}***`);

    // Validar formato e dígitos verificadores
    if (!isValidCPF(cleanCPF)) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'CPF inválido. Verifique os dígitos e tente novamente.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ CPF válido');

    return new Response(
      JSON.stringify({
        valid: true,
        cpf: cleanCPF,
        cpf_formatted: formatCPF(cleanCPF),
        message: 'CPF válido'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao validar CPF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: errorMessage,
        details: 'Erro ao processar validação do CPF'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
