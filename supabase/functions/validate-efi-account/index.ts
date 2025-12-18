import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  store_id: string;
  efi_account_number: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { store_id, efi_account_number }: ValidateRequest = await req.json();

    console.log('🔍 Validando conta EFI...');
    console.log(`📦 Store ID: ${store_id}`);
    console.log(`🏦 Conta EFI: ${efi_account_number}`);

    // Validar formato do número da conta (6-10 dígitos)
    const accountNumberClean = efi_account_number.replace(/\D/g, '');
    if (accountNumberClean.length < 6 || accountNumberClean.length > 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Número da conta inválido. Deve ter entre 6 e 10 dígitos.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Buscar dados da loja incluindo CPF/CNPJ
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, owner_id, company_document, cpf, responsible_cpf, document_type')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      console.error('❌ Loja não encontrada:', storeError);
      return new Response(
        JSON.stringify({ success: false, error: 'Loja não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Buscar documento da loja (CNPJ ou CPF)
    const document = store.company_document || store.cpf || store.responsible_cpf;
    const documentType = store.company_document ? 'CNPJ' : 'CPF';
    
    if (!document) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CPF/CNPJ da loja não cadastrado. Atualize os dados da loja primeiro.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`📋 Documento: ${document.substring(0, 3)}***`);

    // Por enquanto, não validaremos com a API EFI porque o split 
    // não exige validação prévia - a EFI valida no momento do pagamento.
    // Apenas salvaremos o número da conta.

    // Atualizar a loja com o número da conta EFI
    const { error: updateError } = await supabase
      .from('stores')
      .update({ 
        efi_account_number: accountNumberClean,
        efi_account_status: 'active',
        wants_online_payment: true
      })
      .eq('id', store_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar loja:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar dados da conta' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Conta EFI vinculada com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conta EFI vinculada com sucesso!',
        account_number: accountNumberClean,
        store_name: store.name,
        document_type: documentType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
