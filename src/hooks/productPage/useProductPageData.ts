// Dados da página do produto: loja (+ configuração pública), produto (com redirecionamento do
// slug antigo), variações, produtos relacionados e adicionais (do produto e da categoria).
import { useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { publicSupabase } from '@/integrations/supabase/publicClient';
import type { Addon, AddonCategory, Product, ProductVariant, Store } from '@/lib/productPage/types';

export function useProductPageData(
  storeSlug: string | null | undefined,
  productSlug: string | undefined,
  navigate: NavigateFunction,
) {
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<any>(null);

  useEffect(() => {
    if (storeSlug && productSlug) {
      fetchProductData();
    }
  }, [storeSlug, productSlug]);

  const fetchProductData = async () => {
    try {
      // Fetch store
      const { data: storeData, error: storeError } = await publicSupabase
        .from('public_stores')
        .select('id, name, description, logo_url, slug, phone, theme_colors, address, instagram, facebook, website, business_hours, delivery_config')
        .eq('slug', storeSlug)
        .eq('status', 'active')
        .single();

      if (storeError) throw storeError;

      // Salvar business_hours e delivery_config
      setBusinessHours(storeData.business_hours);
      setDeliveryConfig(storeData.delivery_config);

      // Fetch store configuration (usando view pública segura)
      const { data: configData } = await publicSupabase
        .from('public_store_config')
        .select('*')
        .eq('store_id', storeData.id)
        .maybeSingle();

      const processedStore = {
        ...storeData,
        configuration: configData || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
        }
      };
      setStore(processedStore);

      // Fetch product with category
      const { data: productData, error: productError } = await publicSupabase
        .from('products')
        .select(`
          id, name, description, price, image_url, image_gallery, 
          category_id, button_text, slug, is_on_offer, original_price, offer_price,
          category:categories(name)
        `)
        .eq('slug', productSlug)
        .eq('store_id', storeData.id)
        .eq('is_available', true)
        .maybeSingle();

      if (productError) throw productError;
      if (!productData) {
        // Endereço antigo do produto (nome editado ou acentos corrigidos): vai para o atual
        const { data: moved } = await publicSupabase
          .from('product_slug_redirects' as any)
          .select('product_id')
          .eq('store_id', storeData.id)
          .eq('old_slug', productSlug)
          .maybeSingle();
        const movedId = (moved as { product_id?: string } | null)?.product_id;
        if (movedId) {
          const { data: cur } = await publicSupabase.from('products').select('slug').eq('id', movedId).maybeSingle();
          if (cur?.slug && cur.slug !== productSlug) {
            navigate(window.location.pathname.replace(/[^/]+\/?$/, encodeURIComponent(cur.slug)), { replace: true });
            return;
          }
        }
        throw new Error('Produto não encontrado');
      }
      setProduct(productData);

      // Fetch variants
      const { data: variantsData } = await publicSupabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productData.id)
        .eq('is_available', true)
        .order('display_order');

      if (variantsData?.length > 0) {
        setVariants(variantsData);
        const defaultVariant = variantsData.find(v => v.is_default) || variantsData[0];
        setSelectedVariant(defaultVariant);
      }

      // Fetch related products from the same category
      if (productData.category_id) {
        const { data: relatedData } = await publicSupabase
          .from('products')
          .select('id, name, description, price, image_url, slug, is_on_offer, original_price, offer_price')
          .eq('store_id', storeData.id)
          .eq('category_id', productData.category_id)
          .eq('is_available', true)
          .neq('id', productData.id)
          .limit(8)
          .order('display_order');

        if (relatedData) {
          setRelatedProducts(relatedData);
        }
      }

      // Fetch addons linked to this specific product via product_addons table
      const { data: productAddonsData } = await publicSupabase
        .from('product_addons')
        .select('addon_id')
        .eq('product_id', productData.id);

      // Also fetch addons linked via product category (category_addon_categories)
      let categoryAddonIds: string[] = [];
      if (productData.category_id) {
        const { data: categoryAddonCats } = await publicSupabase
          .from('category_addon_categories')
          .select('addon_category_id')
          .eq('category_id', productData.category_id);

        if (categoryAddonCats?.length > 0) {
          const catAddonCategoryIds = categoryAddonCats.map(c => c.addon_category_id);
          const { data: categoryAddons } = await publicSupabase
            .from('addons')
            .select('id')
            .in('category_id', catAddonCategoryIds)
            .eq('is_available', true);

          if (categoryAddons) {
            categoryAddonIds = categoryAddons.map(a => a.id);
          }
        }
      }

      // Merge both sources of addon IDs
      const directAddonIds = productAddonsData?.map(pa => pa.addon_id) || [];
      const allAddonIds = [...new Set([...directAddonIds, ...categoryAddonIds])];

      console.log('Product addons:', productAddonsData, 'Category addon IDs:', categoryAddonIds);

      if (allAddonIds.length > 0) {
        // Fetch the actual addons
        const { data: addonsData, error: addonsError } = await publicSupabase
          .from('addons')
          .select('id, name, description, price, is_available, category_id')
          .in('id', allAddonIds)
          .eq('is_available', true)
          .order('display_order');

        console.log('Addons data:', addonsData, 'Error:', addonsError);

        if (addonsData?.length > 0) {
          // Get unique category IDs
          const categoryIds = [...new Set(addonsData.map(a => a.category_id).filter(Boolean))];

          // Fetch categories
          const { data: categoriesData } = await publicSupabase
            .from('addon_categories')
            .select('id, name, description, min_selections, max_selections, is_required, display_order')
            .in('id', categoryIds)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (categoriesData) {
            // Group addons by category
            const categoriesMap = new Map<string, AddonCategory>();

            categoriesData.forEach(category => {
              categoriesMap.set(category.id, {
                id: category.id,
                name: category.name,
                description: category.description,
                min_selections: category.min_selections || 0,
                max_selections: category.max_selections || null,
                is_required: category.is_required || false,
                addons: []
              });
            });

            addonsData.forEach((addon) => {
              if (!addon.category_id) return;

              const category = categoriesMap.get(addon.category_id);
              const categoryData = categoriesData.find(c => c.id === addon.category_id);

              if (category && categoryData) {
                const addonData: Addon = {
                  id: addon.id,
                  name: addon.name,
                  description: addon.description,
                  price: addon.price,
                  is_available: addon.is_available,
                  addon_category: {
                    id: categoryData.id,
                    name: categoryData.name,
                    description: categoryData.description,
                    min_selections: categoryData.min_selections || 0,
                    max_selections: categoryData.max_selections || null,
                    is_required: categoryData.is_required || false
                  }
                };
                category.addons.push(addonData);
              }
            });

            const finalCategories = Array.from(categoriesMap.values()).filter(cat => cat.addons.length > 0);
            console.log('Final addon categories:', finalCategories);
            setAddonCategories(finalCategories);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/404');
    } finally {
      setLoading(false);
    }
  };

  return {
    store,
    product,
    variants,
    selectedVariant,
    setSelectedVariant,
    loading,
    relatedProducts,
    addonCategories,
    businessHours,
    deliveryConfig,
  };
}
