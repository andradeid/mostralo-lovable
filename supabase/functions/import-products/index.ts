import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductVariant {
  nome: string;
  preco: number;
  preco_oferta?: number | null;
  disponivel?: boolean;
}

interface ProductImportData {
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  disponivel?: boolean;
  mostrar_menu?: boolean;
  controlar_estoque?: boolean;
  quantidade_estoque?: number;
  alerta_estoque?: number;
  preco_oferta?: number | null;
  imagem_url?: string;
  variantes?: ProductVariant[];
}

interface ImageOptions {
  updateFromSpreadsheet: boolean;
  searchMissing: boolean;
  replaceAll: boolean;
}

interface ImportPayload {
  action: 'import' | 'validate' | 'check-duplicates';
  storeId: string;
  createMissingCategories: boolean;
  products: ProductImportData[];
  fileName: string;
  duplicateAction?: 'skip' | 'update' | 'create';
  imageOptions?: ImageOptions;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string | number | null;
}

interface DuplicateInfo {
  productName: string;
  category: string;
  existingId: string;
  existingPrice: number;
  newPrice: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: ImportPayload = await req.json();
    const { action, storeId, createMissingCategories, products, fileName, duplicateAction, imageOptions } = payload;
    const safeFileName = (fileName && String(fileName).trim()) ? String(fileName).trim() : 'import';

    console.log(`[import-products] Action: ${action}, Store: ${storeId}, Products: ${products.length}`);

    // Verify user is store owner or master admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    const isMasterAdmin = profile?.user_type === 'master_admin';

    if (!isMasterAdmin) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (!store || store.owner_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Sem permissão para importar produtos nesta loja' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch existing categories
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('store_id', storeId);

    const categoryMap = new Map<string, string>();
    const categoryIdToName = new Map<string, string>();
    existingCategories?.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      categoryIdToName.set(cat.id, cat.name);
    });

    // Validate products
    const errors: ImportError[] = [];
    const missingCategories = new Set<string>();

    products.forEach((product, index) => {
      const row = index + 2; // +2 because row 1 is header

      // Required fields
      if (!product.nome?.trim()) {
        errors.push({ row, field: 'nome', message: 'Nome é obrigatório' });
      }

      if (product.preco === undefined || product.preco === null || isNaN(product.preco)) {
        errors.push({ row, field: 'preco', message: 'Preço é obrigatório', value: product.preco });
      } else if (product.preco < 0) {
        errors.push({ row, field: 'preco', message: 'Preço deve ser maior ou igual a zero', value: product.preco });
      }

      if (!product.categoria?.trim()) {
        errors.push({ row, field: 'categoria', message: 'Categoria é obrigatória' });
      } else {
        const catKey = product.categoria.toLowerCase().trim();
        if (!categoryMap.has(catKey)) {
          if (!createMissingCategories) {
            errors.push({ row, field: 'categoria', message: `Categoria "${product.categoria}" não existe`, value: product.categoria });
          } else {
            missingCategories.add(product.categoria.trim());
          }
        }
      }

      // Validate variants
      product.variantes?.forEach((variant, vIndex) => {
        if (!variant.nome?.trim()) {
          errors.push({ row, field: `variante_${vIndex}_nome`, message: `Nome da variante ${vIndex + 1} é obrigatório` });
        }
        if (variant.preco === undefined || variant.preco === null || isNaN(variant.preco)) {
          errors.push({ row, field: `variante_${vIndex}_preco`, message: `Preço da variante ${vIndex + 1} é obrigatório` });
        }
      });
    });

    // For validation only, return errors and missing categories
    if (action === 'validate') {
      return new Response(JSON.stringify({
        success: errors.length === 0,
        errors,
        missingCategories: Array.from(missingCategories),
        summary: {
          totalRows: products.length,
          validProducts: products.length - errors.filter((e, i, arr) => 
            arr.findIndex(x => x.row === e.row) === i
          ).length,
          errors: errors.length,
          newCategories: missingCategories.size,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================
    // CHECK DUPLICATES ACTION
    // =============================================
    if (action === 'check-duplicates') {
      // Fetch existing products
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, name, category_id, price, image_url')
        .eq('store_id', storeId);

      // Create lookup map: lowercase(name)|lowercase(category) -> product
      interface ExistingProduct {
        id: string;
        name: string;
        category_id: string;
        price: number;
        image_url: string | null;
      }
      const existingMap = new Map<string, ExistingProduct>();
      existingProducts?.forEach(p => {
        const key = `${p.name.toLowerCase().trim()}|${p.category_id}`;
        existingMap.set(key, p);
      });

      // Classify each product from spreadsheet
      const duplicates: DuplicateInfo[] = [];
      let newCount = 0;
      let existingCount = 0;

      products.forEach(product => {
        const categoryKey = product.categoria.toLowerCase().trim();
        const categoryId = categoryMap.get(categoryKey);
        // Se a categoria não existe ainda (será criada), não há como ser duplicata agora.
        if (!categoryId) {
          newCount++;
          return;
        }

        const key = `${product.nome.toLowerCase().trim()}|${categoryId}`;
        const existing = existingMap.get(key);
        if (existing) {
          existingCount++;
          duplicates.push({
            productName: product.nome,
            category: product.categoria,
            existingId: existing.id,
            existingPrice: existing.price,
            newPrice: product.preco,
          });
        } else {
          newCount++;
        }
      });

      return new Response(JSON.stringify({
        success: true,
        newProducts: newCount,
        existingProducts: existingCount,
        duplicates,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If there are critical errors, don't import
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        errors,
        message: 'Corrija os erros antes de importar',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================
    // IMPORT ACTION
    // =============================================

    // Create import log
    const { data: importLog, error: logError } = await supabase
      .from('product_import_logs')
      .insert({
        store_id: storeId,
        imported_by: user.id,
        file_name: safeFileName,
        total_rows: products.length,
        status: 'processing',
      })
      .select()
      .single();

    if (logError) {
      console.error('[import-products] Error creating log:', logError);
    }

    // Create missing categories
    const createdCategories: string[] = [];
    for (const categoryName of missingCategories) {
      const { data: newCat, error: catError } = await supabase
        .from('categories')
        .insert({
          store_id: storeId,
          name: categoryName,
          is_active: true,
          show_in_menu: true,
        })
        .select()
        .single();

      if (!catError && newCat) {
        categoryMap.set(categoryName.toLowerCase().trim(), newCat.id);
        categoryIdToName.set(newCat.id, categoryName);
        createdCategories.push(categoryName);
      }
    }

    // Fetch existing products for duplicate handling
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, name, category_id, price, image_url')
      .eq('store_id', storeId);

    interface ExistingProductInfo {
      id: string;
      name: string;
      category_id: string;
      price: number;
      image_url: string | null;
    }
    const existingProductsMap = new Map<string, ExistingProductInfo>();
    existingProducts?.forEach(p => {
      const key = `${p.name.toLowerCase().trim()}|${p.category_id}`;
      existingProductsMap.set(key, p);
    });

    // Import products
    let successCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let variantsCreated = 0;
    const importErrors: ImportError[] = [];

    // Segurança: se o frontend não mandar, evitar gerar duplicatas por padrão.
    const effectiveDuplicateAction = duplicateAction || 'update';
    const effectiveImageOptions = imageOptions || { 
      updateFromSpreadsheet: true, 
      searchMissing: false, 
      replaceAll: false 
    };

    console.log(`[import-products] Duplicate action: ${effectiveDuplicateAction}`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const row = i + 2;

      try {
        const categoryId = categoryMap.get(product.categoria.toLowerCase().trim());

        if (!categoryId) {
          importErrors.push({ row, field: 'categoria', message: `Categoria não encontrada: ${product.categoria}` });
          continue;
        }

        const productKey = `${product.nome.toLowerCase().trim()}|${categoryId}`;
        const existingProduct = existingProductsMap.get(productKey);

        const hasOfferPrice = product.preco_oferta !== undefined && product.preco_oferta !== null && product.preco_oferta > 0;

        if (existingProduct) {
          // Product already exists
          if (effectiveDuplicateAction === 'skip') {
            skippedCount++;
            continue;
          }

          if (effectiveDuplicateAction === 'update') {
            // Determine image URL
            let imageUrl = existingProduct.image_url;
            
            if (effectiveImageOptions.replaceAll && product.imagem_url) {
              // Replace all: use new image if provided
              imageUrl = product.imagem_url;
            } else if (effectiveImageOptions.updateFromSpreadsheet && product.imagem_url) {
              // Update from spreadsheet if provided
              imageUrl = product.imagem_url;
            } else if (effectiveImageOptions.searchMissing && !existingProduct.image_url) {
              // Would search for image here (placeholder - not implemented in this PR)
              // imageUrl = await searchProductImage(product.nome, storeId);
            }

            // UPDATE existing product
            const { error: updateError } = await supabase
              .from('products')
              .update({
                description: product.descricao?.trim() || null,
                price: product.preco,
                original_price: hasOfferPrice ? product.preco : null,
                offer_price: hasOfferPrice ? product.preco_oferta : null,
                is_on_offer: hasOfferPrice,
                is_available: product.disponivel !== false,
                show_in_menu: product.mostrar_menu !== false,
                track_stock: product.controlar_estoque || false,
                stock_quantity: product.quantidade_estoque || 0,
                stock_alert_threshold: product.alerta_estoque || 5,
                image_url: imageUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProduct.id);

            if (updateError) {
              console.error(`[import-products] Error updating product at row ${row}:`, updateError);
              importErrors.push({ row, field: 'produto', message: updateError.message });
              continue;
            }

            updatedCount++;
            continue;
          }

          // effectiveDuplicateAction === 'create' - fall through to create new
        }

        // Insert new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            category_id: categoryId,
            name: product.nome.trim(),
            description: product.descricao?.trim() || null,
            price: product.preco,
            original_price: hasOfferPrice ? product.preco : null,
            offer_price: hasOfferPrice ? product.preco_oferta : null,
            is_on_offer: hasOfferPrice,
            is_available: product.disponivel !== false,
            show_in_menu: product.mostrar_menu !== false,
            track_stock: product.controlar_estoque || false,
            stock_quantity: product.quantidade_estoque || 0,
            stock_alert_threshold: product.alerta_estoque || 5,
            image_url: product.imagem_url || null,
          })
          .select()
          .single();

        if (productError) {
          console.error(`[import-products] Error inserting product at row ${row}:`, productError);
          importErrors.push({ row, field: 'produto', message: productError.message });
          continue;
        }

        successCount++;

        // Insert variants if any
        if (product.variantes && product.variantes.length > 0 && newProduct) {
          for (const variant of product.variantes) {
            const { error: variantError } = await supabase
              .from('product_variants')
              .insert({
                product_id: newProduct.id,
                name: variant.nome.trim(),
                price: variant.preco,
                is_available: variant.disponivel !== false,
              });

            if (!variantError) {
              variantsCreated++;
            }
          }
        }
      } catch (err) {
        console.error(`[import-products] Exception at row ${row}:`, err);
        importErrors.push({ row, field: 'geral', message: 'Erro ao processar produto' });
      }
    }

    // Update import log
    if (importLog) {
      await supabase
        .from('product_import_logs')
        .update({
          success_count: successCount + updatedCount,
          error_count: importErrors.length,
          errors: importErrors,
          status: importErrors.length > 0 ? 'completed_with_errors' : 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', importLog.id);
    }

    console.log(`[import-products] Completed: ${successCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${variantsCreated} variants, ${importErrors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      importLogId: importLog?.id,
      summary: {
        totalRows: products.length,
        productsCreated: successCount,
        productsUpdated: updatedCount,
        productsSkipped: skippedCount,
        categoriesCreated: createdCategories.length,
        variantsCreated,
        errors: importErrors.length,
      },
      errors: importErrors,
      createdCategories,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[import-products] Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
