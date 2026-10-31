// Gravação do produto, das variações e dos adicionais (criar e editar).
// Código movido do ProductForm.onSubmit sem mudar a ordem das gravações; lança o erro para a tela.
import { supabase } from '@/integrations/supabase/client';
import {
  buildProductAddonRows,
  buildProductPayload,
  buildVariantRows,
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

export async function saveProduct({ productId, data, storeId, variants, selectedAddonCategories }: SaveProductParams) {
  const productData = buildProductPayload(data, storeId);
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

  // Gerenciar variantes
  if (variants.length > 0 && finalProductId) {
    // Remover variantes existentes se estiver editando
    if (productId) {
      await supabase.from('product_variants').delete().eq('product_id', productId);
    }

    // Inserir novas variantes
    const variantData = buildVariantRows(variants, finalProductId);
    const {
      error: variantError
    } = await supabase.from('product_variants').insert(variantData);
    if (variantError) throw variantError;
  } else if (productId && variants.length === 0) {
    // Se não há variantes, remover todas as existentes
    await supabase.from('product_variants').delete().eq('product_id', productId);
  }

  // Gerenciar adicionais do produto
  if (finalProductId) {
    // Remover associações existentes se estiver editando
    if (productId) {
      await supabase.from('product_addons').delete().eq('product_id', productId);
    }

    // Buscar todos os adicionais das categorias selecionadas
    if (selectedAddonCategories.length > 0) {
      const { data: addonsData } = await supabase
        .from('addons')
        .select('id')
        .in('category_id', selectedAddonCategories);

      if (addonsData && addonsData.length > 0) {
        const productAddonData = buildProductAddonRows(addonsData, finalProductId);

        const { error: addonError } = await supabase
          .from('product_addons')
          .insert(productAddonData);

        if (addonError) throw addonError;
      }
    }
  }
}
