import { supabase } from '@/integrations/supabase/client';

/**
 * Atribui uma etiqueta a um cliente (evita duplicatas)
 * @param customerId ID do cliente
 * @param storeId ID da loja
 * @param labelName Nome da etiqueta (ex: "Totem", "E-commerce", "Delivery")
 * @returns true se atribuiu, false se já existia ou erro
 */
export async function assignCustomerLabel(
  customerId: string,
  storeId: string,
  labelName: string
): Promise<boolean> {
  try {
    // Buscar o label_id pelo nome e store_id
    const { data: label, error: labelError } = await supabase
      .from('customer_labels')
      .select('id')
      .eq('store_id', storeId)
      .eq('name', labelName)
      .maybeSingle();

    if (labelError || !label) {
      console.log(`[Label] Etiqueta "${labelName}" não encontrada para store ${storeId}`);
      return false;
    }

    // Verificar se já existe a atribuição
    const { data: existing } = await supabase
      .from('customer_label_assignments')
      .select('id')
      .eq('customer_id', customerId)
      .eq('label_id', label.id)
      .maybeSingle();

    if (existing) {
      console.log(`[Label] Cliente ${customerId} já tem etiqueta "${labelName}"`);
      return false;
    }

    // Inserir nova atribuição
    const { error: insertError } = await supabase
      .from('customer_label_assignments')
      .insert({
        customer_id: customerId,
        label_id: label.id,
        store_id: storeId,
      });

    if (insertError) {
      console.error(`[Label] Erro ao atribuir etiqueta "${labelName}":`, insertError);
      return false;
    }

    console.log(`[Label] ✅ Etiqueta "${labelName}" atribuída ao cliente ${customerId}`);
    return true;
  } catch (error) {
    console.error(`[Label] Erro inesperado:`, error);
    return false;
  }
}

/**
 * Atribui múltiplas etiquetas a um cliente
 */
export async function assignCustomerLabels(
  customerId: string,
  storeId: string,
  labelNames: string[]
): Promise<void> {
  for (const labelName of labelNames) {
    await assignCustomerLabel(customerId, storeId, labelName);
  }
}
