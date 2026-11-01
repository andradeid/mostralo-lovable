// Dados do formulário de produto: loja, categorias, adicionais, produto em edição,
// upload de imagens e variações. A loja é sempre a ativa (novo) ou a do produto (edição).
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import {
  addonCategoryIdsOf,
  descriptionHasHtml,
  productFormValuesFromRow,
  variantsFromRows,
} from '@/lib/productPayload';
import type { Category, ProductFormApi, ProductVariant } from './types';

export function useProductFormData(form: ProductFormApi, productId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [addonCategories, setAddonCategories] = useState<any[]>([]);
  const [selectedAddonCategories, setSelectedAddonCategories] = useState<string[]>([]);
  const [useRichEditor, setUseRichEditor] = useState(false);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  useEffect(() => {
    if (storeAccessLoading || !hasAccess) return;
    // Editando: loja, categorias e adicionais vêm da loja do próprio produto (fetchProduct)
    if (!productId) {
      fetchStoreAndCategories();
      fetchAddonCategories();
    }
    if (productId) {
      // Aguardar um pouco para garantir que as categorias sejam carregadas primeiro
      setTimeout(() => {
        fetchProduct();
      }, 100);
    } else if (categoryFromUrl) {
      // Se não está editando E tem categoria na URL, pré-seleciona
      setTimeout(() => {
        form.setValue('category_id', categoryFromUrl);
        console.log('Categoria pré-selecionada da URL:', categoryFromUrl);
      }, 200); // Aguardar categorias carregarem
    }
  }, [productId, categoryFromUrl, user, validatedStoreId, storeAccessLoading, hasAccess]);
  // Loja ativa já validada pelo useStoreAccess. Antes havia um "plano B" (loja de que é dono, depois
  // user_roles) que, com mais de uma loja, podia escolher a loja errada.
  const getStoreId = async (): Promise<string | null> => {
    if (storeAccessLoading || !hasAccess) return null;
    return validatedStoreId || null;
  };

  const fetchStoreAndCategories = async (forStoreId?: string) => {
    try {
      const storeId = forStoreId || await getStoreId();
      if (storeId) {
        setStore({ id: storeId });

        // Buscar categorias da loja
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('display_order');
        if (categoriesData) {
          setCategories(categoriesData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const fetchAddonCategories = async (forStoreId?: string) => {
    try {
      const storeId = forStoreId || await getStoreId();
      if (storeId) {
        // Buscar categorias de adicionais da loja
        const { data: addonCategoriesData } = await supabase
          .from('addon_categories')
          .select('id, name, description, is_required, min_selections, max_selections')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('display_order');

        if (addonCategoriesData) {
          setAddonCategories(addonCategoriesData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar categorias de adicionais:', error);
    }
  };
  const fetchProduct = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
      if (error) throw error;
      if (!data) {
        toast({
          title: 'Erro',
          description: 'Produto não encontrado.',
          variant: 'destructive'
        });
        return;
      }

      // Loja do próprio produto (salvar a edição não muda o produto de loja)
      await Promise.all([fetchStoreAndCategories(data.store_id), fetchAddonCategories(data.store_id)]);

      // Auto-detectar se a descrição contém HTML para ativar editor rico
      const values = productFormValuesFromRow(data);
      if (descriptionHasHtml(values.description || '')) {
        setUseRichEditor(true);
      }

      form.reset(values);

      // Garantir que a categoria seja setada após o reset
      setTimeout(() => {
        if (data.category_id) {
          form.setValue('category_id', data.category_id);
        }
      }, 100);

      // Buscar variantes do produto
      const {
        data: variantsData
      } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('display_order');
      if (variantsData && variantsData.length > 0) {
        setVariants(variantsFromRows(variantsData));
      }

      // Buscar adicionais associados ao produto
      const { data: productAddonsData } = await supabase
        .from('product_addons')
        .select('addon_id')
        .eq('product_id', productId);

      if (productAddonsData) {
        const addonIds = productAddonsData.map(pa => pa.addon_id);

        // Buscar as categorias desses adicionais
        const { data: addonsData } = await supabase
          .from('addons')
          .select('category_id')
          .in('id', addonIds);

        if (addonsData) {
          setSelectedAddonCategories(addonCategoryIdsOf(addonsData));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do produto.',
        variant: 'destructive'
      });
    }
  };
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('store-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const {
        data
      } = supabase.storage.from('store-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setUploading(false);
    }
  };
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      form.setValue('image_url', imageUrl);
    }
  };
  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setGalleryUploading(true);
    const currentGallery = form.getValues('image_gallery') || [];
    for (let i = 0; i < files.length; i++) {
      const imageUrl = await uploadImage(files[i]);
      if (imageUrl) {
        currentGallery.push(imageUrl);
      }
    }
    form.setValue('image_gallery', currentGallery);
    setGalleryUploading(false);
  };
  const removeGalleryImage = (index: number) => {
    const currentGallery = form.getValues('image_gallery') || [];
    const newGallery = currentGallery.filter((_, i) => i !== index);
    form.setValue('image_gallery', newGallery);
  };
  const addVariant = () => {
    if (!newVariantName.trim()) return;
    const newVariant: ProductVariant = {
      name: newVariantName.trim(),
      price: form.getValues('price') || 0,
      is_default: variants.length === 0
    };
    setVariants([...variants, newVariant]);
    setNewVariantName('');
  };
  const removeVariant = (index: number) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    // Se removemos a variante padrão, definir a primeira como padrão
    if (variants[index].is_default && updatedVariants.length > 0) {
      updatedVariants[0].is_default = true;
    }
    setVariants(updatedVariants);
  };
  const updateVariantPrice = (index: number, price: number) => {
    const updatedVariants = [...variants];
    updatedVariants[index].price = price;
    setVariants(updatedVariants);
  };

  return {
    toast,
    categories,
    store,
    uploading,
    galleryUploading,
    variants,
    newVariantName,
    setNewVariantName,
    addonCategories,
    selectedAddonCategories,
    setSelectedAddonCategories,
    useRichEditor,
    setUseRichEditor,
    handleImageUpload,
    handleGalleryUpload,
    removeGalleryImage,
    addVariant,
    removeVariant,
    updateVariantPrice,
  };
}
