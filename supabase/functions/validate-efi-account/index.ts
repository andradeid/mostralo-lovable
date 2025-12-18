import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  store_id: string;
  efi_account_number: string;
  efi_document_type?: 'cpf' | 'cnpj';
  efi_document_number?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { store_id, efi_account_number, efi_document_type, efi_document_number }: ValidateRequest = await req.json();

    console.log('🔍 Validando conta EFI...');
    console.log(`📦 Store ID: ${store_id}`);
    console.log(`🏦 Conta EFI: ${efi_account_number}`);
    console.log(`📄 Tipo Documento: ${efi_document_type || 'não informado'}`);
    console.log(`📄 Documento: ${efi_document_number ? efi_document_number.substring(0, 3) + '***' : 'não informado'}`);

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

    // Validar documento se informado
    if (efi_document_number) {
      const docClean = efi_document_number.replace(/\D/g, '');
      const expectedLength = efi_document_type === 'cpf' ? 11 : 14;
      if (docClean.length !== expectedLength) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `${(efi_document_type || 'documento').toUpperCase()} inválido. Deve ter ${expectedLength} dígitos.` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Buscar dados da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, owner_id, responsible_cpf')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      console.error('❌ Loja não encontrada:', storeError);
      return new Response(
        JSON.stringify({ success: false, error: 'Loja não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Usar documento informado ou fallback para responsible_cpf
    const document = efi_document_number?.replace(/\D/g, '') || store.responsible_cpf;
    const documentType = efi_document_type || (document && document.length === 11 ? 'cpf' : 'cnpj');
    
    if (!document) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CPF/CNPJ não informado. Preencha o documento do titular da conta EFI.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`📋 Documento final: ${document.substring(0, 3)}*** (${documentType})`);

    // Atualizar a loja com os dados da conta EFI
    const { error: updateError } = await supabase
      .from('stores')
      .update({ 
        efi_account_number: accountNumberClean,
        efi_document_type: documentType,
        efi_document_number: document,
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
        document_type: documentType.toUpperCase()
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
