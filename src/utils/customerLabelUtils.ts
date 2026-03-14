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
    // Cores padrão para etiquetas do sistema
    const defaultColors: Record<string, string> = {
      'Balcão': '#f97316',
      'Delivery': '#ef4444',
      'E-commerce': '#3b82f6',
      'WhatsApp': '#25d366',
      'Totem': '#8b5cf6',
      'Agendamento': '#06b6d4',
      'Cardápio na Mesa': '#ec4899',
      'iFood': '#ea1d2c',
    };

    // Buscar o label_id pelo nome e store_id
    let { data: label, error: labelError } = await supabase
      .from('customer_labels')
      .select('id')
      .eq('store_id', storeId)
      .eq('name', labelName)
      .maybeSingle();

    // Se não existe, criar automaticamente como label do sistema
    if (!label && !labelError) {
      const color = defaultColors[labelName] || '#6b7280';
      const { data: newLabel, error: createError } = await supabase
        .from('customer_labels')
        .insert({
          store_id: storeId,
          name: labelName,
          color,
          is_system: true,
          label_type: 'channel',
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`[Label] Erro ao criar etiqueta "${labelName}":`, createError);
        return false;
      }
      label = newLabel;
    }

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
