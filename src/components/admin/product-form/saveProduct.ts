// Gravação do produto, das variações e dos adicionais (criar e editar).
// Produto primeiro; depois variações e adicionais juntos pela função save_product_children. Lança o erro para a tela.
import { supabase } from '@/integrations/supabase/client';
import { barcodeForSave } from '@/lib/pdv/barcode';
import {
  buildProductPayload,
  buildVariantPayload,
  type ProductFormData,
  type ProductVariant,
} from '@/lib/productPayload';

interface SaveProductParams {
  productId?: string;
  data: ProductFormData;
  storeId: string;
  variants: ProductVariant[];
  selectedAddonCategories: string[];
}

/** Grava e devolve o id do produto (novo ou editado). */
export async function saveProduct({ productId, data, storeId, variants, selectedAddonCategories }: SaveProductParams): Promise<string | undefined> {
  // barcode fora dos tipos gerados: string vazia vira null (índice único por loja ignora null)
  const productData = { ...buildProductPayload(data, storeId), barcode: barcodeForSave(data.barcode) } as ReturnType<typeof buildProductPayload>;
  let finalProductId = productId;
  if (productId) {
    // Atualizar produto existente
    const {
      error
    } = await supabase.from('products').update(productData).eq('id', productId);
    if (error) throw error;
  } else {
    // Criar novo produto
    const {
      data: newProduct,
      error
    } = await supabase.from('products').insert([productData]).select('id').single();
    if (error) throw error;
    finalProductId = newProduct.id;
  }

  // Variações e adicionais numa única operação no banco (tudo ou nada; mantém ids e estoque das variações)
  if (finalProductId) {
    const { error: childrenError } = await supabase.rpc('save_product_children' as never, {
      p_product_id: finalProductId,
      p_variants: buildVariantPayload(variants),
      p_addon_category_ids: selectedAddonCategories,
    } as never);
    if (childrenError) throw childrenError;
  }
  return finalProductId;
}
