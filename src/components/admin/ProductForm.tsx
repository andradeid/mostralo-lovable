import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Plus, HelpCircle, Star, Type, AlignLeft } from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { ProductUpsellSelector } from '@/components/admin/products/ProductUpsellSelector';
import { useAuth } from '@/hooks/use-auth';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  display_order: z.number().min(0),
  image_url: z.string().optional(),
  button_text: z.string().min(1, 'Texto do botão é obrigatório'),
  image_gallery: z.array(z.string()).optional(),
  slug: z.string().optional(),
  is_on_offer: z.boolean(),
  original_price: z.number().optional(),
  offer_price: z.number().optional(),
  // Campos de controle de estoque
  track_stock: z.boolean(),
  stock_quantity: z.number().nullable().optional(),
  stock_alert_threshold: z.number().min(0).optional()
}).refine((data) => {
  if (data.is_on_offer) {
    return data.offer_price && data.offer_price < data.price;
  }
  return true;
}, {
  message: "Preço da oferta deve ser menor que o preço original",
  path: ["offer_price"]
});
type ProductFormData = z.infer<typeof productSchema>;
interface Category {
  id: string;
  name: string;
}
interface ProductVariant {
  id?: string;
  name: string;
  price: number;
  is_default: boolean;
}
interface ProductFormProps {
  productId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}
export function ProductForm({
  productId,
  onSuccess,
  onCancel
}: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [addonCategories, setAddonCategories] = useState<any[]>([]);
  const [selectedAddonCategories, setSelectedAddonCategories] = useState<string[]>([]);
  const [categoryAddonCategoryIds, setCategoryAddonCategoryIds] = useState<string[]>([]);
  const [useRichEditor, setUseRichEditor] = useState(false);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category_id: '',
      is_available: true,
      is_featured: false,
      display_order: 0,
      image_url: '',
      button_text: 'Comprar',
      image_gallery: [],
      is_on_offer: false,
      original_price: 0,
      offer_price: 0,
      track_stock: false,
      stock_quantity: null,
      stock_alert_threshold: 5
    }
  });
  useEffect(() => {
    fetchStoreAndCategories();
    fetchAddonCategories();
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
  }, [productId, categoryFromUrl, user]);
  const getStoreId = async (): Promise<string | null> => {
    // Primeiro tenta como owner
    const { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user?.id)
      .maybeSingle();
    if (storeData) return storeData.id;

    // Fallback: buscar como atendente via user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('store_id')
      .eq('user_id', user?.id)
      .not('store_id', 'is', null)
      .maybeSingle();
    return roleData?.store_id || null;
  };

  const fetchStoreAndCategories = async () => {
    try {
      const storeId = await getStoreId();
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

  const fetchAddonCategories = async () => {
    try {
      const storeId = await getStoreId();
      if (storeId) {
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

  // Buscar categorias de adicionais vinculadas à categoria do produto
  const fetchCategoryAddonLinks = async (categoryId: string) => {
    try {
      const { data } = await supabase
        .from('category_addon_categories')
        .select('addon_category_id')
        .eq('category_id', categoryId);

      if (data) {
        const linkedIds = data.map(d => d.addon_category_id);
        setCategoryAddonCategoryIds(linkedIds);
        // Auto-selecionar as categorias vinculadas (merge com as já selecionadas manualmente)
        setSelectedAddonCategories(prev => {
          const merged = new Set([...prev, ...linkedIds]);
          return Array.from(merged);
        });
      } else {
        setCategoryAddonCategoryIds([]);
      }
    } catch (error) {
      console.error('Erro ao buscar vínculos de adicionais da categoria:', error);
    }
  };

  // Quando a categoria do produto muda, buscar os adicionais vinculados
  const watchedCategoryId = form.watch('category_id');
  useEffect(() => {
    if (watchedCategoryId) {
      fetchCategoryAddonLinks(watchedCategoryId);
    } else {
      setCategoryAddonCategoryIds([]);
    }
  }, [watchedCategoryId]);
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
      console.log('Dados do produto carregados:', data); // Debug

      // Aguardar as categorias serem carregadas primeiro
      await fetchStoreAndCategories();

      // Auto-detectar se a descrição contém HTML para ativar editor rico
      const desc = data.description || '';
      if (/<[a-z][\s\S]*>/i.test(desc)) {
        setUseRichEditor(true);
      }

      form.reset({
        name: data.name,
        description: desc,
        price: Number(data.price),
        category_id: data.category_id || '',
        is_available: data.is_available,
        is_featured: data.is_featured || false,
        display_order: data.display_order,
        image_url: data.image_url || '',
        button_text: data.button_text || 'Comprar',
        image_gallery: data.image_gallery || [],
        is_on_offer: data.is_on_offer || false,
        original_price: Number(data.original_price) || 0,
        offer_price: Number(data.offer_price) || 0,
        track_stock: data.track_stock || false,
        stock_quantity: data.stock_quantity ?? null,
        stock_alert_threshold: data.stock_alert_threshold ?? 5
      });

      // Garantir que a categoria seja setada após o reset
      setTimeout(() => {
        if (data.category_id) {
          form.setValue('category_id', data.category_id);
          console.log('Categoria setada:', data.category_id); // Debug
        }
      }, 100);

      // Buscar variantes do produto
      const {
        data: variantsData
      } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('display_order');
      if (variantsData && variantsData.length > 0) {
        setVariants(variantsData.map(variant => ({
          id: variant.id,
          name: variant.name,
          price: Number(variant.price),
          is_default: variant.is_default
        })));
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
          const categoryIds = [...new Set(addonsData.map(a => a.category_id).filter(id => id))];
          setSelectedAddonCategories(categoryIds);
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
  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      const productData = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        category_id: data.category_id,
        is_available: data.is_available,
        is_featured: data.is_featured || false,
        display_order: data.display_order,
        image_url: data.image_url || null,
        button_text: data.button_text || 'Comprar',
        image_gallery: data.image_gallery || [],
        store_id: store.id,
        is_on_offer: data.is_on_offer || false,
        original_price: data.is_on_offer ? data.price : null,
        offer_price: data.is_on_offer ? data.offer_price : null,
        track_stock: data.track_stock || false,
        stock_quantity: data.track_stock ? data.stock_quantity : null,
        stock_alert_threshold: data.track_stock ? (data.stock_alert_threshold ?? 5) : 5
      };
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
        const variantData = variants.map((variant, index) => ({
          product_id: finalProductId,
          name: variant.name,
          price: variant.price,
          is_default: variant.is_default,
          display_order: index,
          is_available: true
        }));
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
            const productAddonData = addonsData.map(addon => ({
              product_id: finalProductId,
              addon_id: addon.id,
              is_required: false,
              max_quantity: 1
            }));

            const { error: addonError } = await supabase
              .from('product_addons')
              .insert(productAddonData);

            if (addonError) throw addonError;
          }
        }
      }

      toast({
        title: 'Sucesso',
        description: productId ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!'
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {productId ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input id="name" {...form.register('name')} placeholder="Ex: Pizza Margherita" />
                  {form.formState.errors.name && <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço *</Label>
                  <CurrencyInput
                    id="price"
                    value={form.watch('price') || 0}
                    onChange={(value) => form.setValue('price', value, { shouldValidate: true })}
                  />
                  {form.formState.errors.price && <p className="text-sm text-destructive">
                      {form.formState.errors.price.message}
                    </p>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Descrição</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setUseRichEditor(!useRichEditor)}
                  >
                    {useRichEditor ? (
                      <>
                        <AlignLeft className="w-3 h-3" />
                        Editor Simples
                      </>
                    ) : (
                      <>
                        <Type className="w-3 h-3" />
                        Editor com Formatação
                      </>
                    )}
                  </Button>
                </div>
                {useRichEditor ? (
                  <RichTextEditor
                    value={form.watch('description') || ''}
                    onChange={(value) => form.setValue('description', value)}
                    placeholder="Descreva seu produto..."
                  />
                ) : (
                  <Textarea id="description" {...form.register('description')} placeholder="Descreva seu produto..." rows={3} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={form.watch('category_id')} onValueChange={value => form.setValue('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.category_id && <p className="text-sm text-destructive">
                    {form.formState.errors.category_id.message}
                  </p>}
              </div>
            </div>

            <Separator />

            {/* Sistema de Ofertas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">Ofertas e Promoções</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" side="right">
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Desconto do Produto:</strong> Para ofertas permanentes ou de longa duração.
                        </p>
                        <p>
                          <strong>Promoções (aba Promoções):</strong> Para campanhas temporárias com regras específicas.
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                          ⚡ Se ambos existirem, o sistema aplicará automaticamente o maior desconto ao cliente.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_on_offer" 
                  checked={form.watch('is_on_offer')} 
                  onCheckedChange={checked => {
                    form.setValue('is_on_offer', checked);
                    if (!checked) {
                      form.setValue('offer_price', 0);
                    }
                  }} 
                />
                <Label htmlFor="is_on_offer">Este produto está em oferta</Label>
              </div>

              {form.watch('is_on_offer') && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="offer_price">Preço com Desconto *</Label>
                    <CurrencyInput
                      id="offer_price"
                      value={form.watch('offer_price') || 0}
                      onChange={(value) => form.setValue('offer_price', value, { shouldValidate: true })}
                    />
                    {form.formState.errors.offer_price && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.offer_price.message}
                      </p>
                    )}
                  </div>

                  {form.watch('offer_price') > 0 && form.watch('price') > 0 && form.watch('offer_price') < form.watch('price') && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Desconto: {Math.round((1 - form.watch('offer_price') / form.watch('price')) * 100)}%</strong>
                      </p>
                      <p className="text-sm text-green-700">
                        De R$ {form.watch('price').toFixed(2)} por R$ {form.watch('offer_price').toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Controle de Estoque */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Controle de Estoque</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="right">
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Estoque Controlado:</strong> O sistema irá decrementar automaticamente a cada venda.
                          </p>
                          <p>
                            <strong>Sem Controle:</strong> Produto sempre disponível (ideal para serviços ou combos).
                          </p>
                          <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                            ⚡ Quando o estoque zerar, o produto será marcado como indisponível automaticamente.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="track_stock"
                    checked={form.watch('track_stock')}
                    onCheckedChange={(checked) => {
                      form.setValue('track_stock', checked);
                      if (!checked) {
                        form.setValue('stock_quantity', null);
                      }
                    }}
                  />
                  <Label htmlFor="track_stock">Controlar estoque</Label>
                </div>
              </div>

              {form.watch('track_stock') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Quantidade em Estoque *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={form.watch('stock_quantity') ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        form.setValue('stock_quantity', value);
                      }}
                      placeholder="Ex: 100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantidade atual disponível para venda
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock_alert_threshold">Alerta de Estoque Baixo</Label>
                    <Input
                      id="stock_alert_threshold"
                      type="number"
                      min="0"
                      {...form.register('stock_alert_threshold', { valueAsNumber: true })}
                      placeholder="Ex: 5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Aviso quando estoque atingir esta quantidade
                    </p>
                  </div>

                  {form.watch('stock_quantity') !== null && form.watch('stock_quantity') !== undefined && (
                    <div className="col-span-full">
                      <div className={`p-3 rounded-lg border ${
                        form.watch('stock_quantity')! <= 0 
                          ? 'bg-red-50 border-red-200' 
                          : form.watch('stock_quantity')! <= (form.watch('stock_alert_threshold') || 5)
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          form.watch('stock_quantity')! <= 0 
                            ? 'text-red-800' 
                            : form.watch('stock_quantity')! <= (form.watch('stock_alert_threshold') || 5)
                              ? 'text-yellow-800'
                              : 'text-green-800'
                        }`}>
                          {form.watch('stock_quantity')! <= 0 
                            ? '⚠️ Sem estoque - Produto será marcado como indisponível' 
                            : form.watch('stock_quantity')! <= (form.watch('stock_alert_threshold') || 5)
                              ? `⚠️ Estoque baixo - Apenas ${form.watch('stock_quantity')} unidades`
                              : `✓ Estoque OK - ${form.watch('stock_quantity')} unidades disponíveis`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Opções */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Variações</h3>
              
              {variants.length > 0 && <div className="space-y-2">
                  {variants.map((variant, index) => <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <span className="flex-1 font-medium">{variant.name}</span>
                      <div className="flex items-center gap-2">
                        <CurrencyInput
                          value={variant.price}
                          onChange={(value) => updateVariantPrice(index, value)}
                          className="w-32"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>)}
                </div>}

              <div className="flex items-center gap-2">
                <Input value={newVariantName} onChange={e => setNewVariantName(e.target.value)} placeholder="Ex: 250 ML, Tamanho P, etc." className="flex-1" onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addVariant();
                }
              }} />
                <Button type="button" variant="outline" size="sm" onClick={addVariant} disabled={!newVariantName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button type="button" variant="link" className="p-0 h-auto text-sm text-muted-foreground" onClick={() => {
              const input = document.querySelector('input[placeholder="Ex: 250 ML, Tamanho P, etc."]') as HTMLInputElement;
              input?.focus();
            }}>Adicionar </Button>
            </div>

            <Separator />

            {/* Upload de Imagem Principal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Imagem Principal</h3>
              
              <div className="space-y-4">
                {form.watch('image_url') && <div className="relative inline-block">
                    <img src={form.watch('image_url')} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                    <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2" onClick={() => form.setValue('image_url', '')}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>}

                <div>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  {uploading && <div className="flex items-center space-x-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Enviando imagem...
                      </span>
                    </div>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Galeria de Fotos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Galeria de Fotos</h3>
              
              <div className="space-y-4">
                {form.watch('image_gallery') && form.watch('image_gallery')!.length > 0 && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {form.watch('image_gallery')!.map((imageUrl, index) => <div key={index} className="relative">
                        <img src={imageUrl} alt={`Galeria ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2" onClick={() => removeGalleryImage(index)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>)}
                  </div>}

                <div>
                  <Label>Adicionar Fotos à Galeria</Label>
                  <Input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={galleryUploading} />
                  {galleryUploading && <div className="flex items-center space-x-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Enviando fotos...
                      </span>
                    </div>}
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecione múltiplas imagens para adicionar à galeria
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Adicionais */}
            {addonCategories.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Adicionais Disponíveis</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione as categorias de adicionais que estarão disponíveis para este produto.
                  {categoryAddonCategoryIds.length > 0 && (
                    <span className="block mt-1 text-xs">
                      🔗 Itens marcados com <strong>"Da categoria"</strong> são herdados automaticamente da categoria do produto.
                    </span>
                  )}
                </p>
                
                <div className="space-y-3">
                  {addonCategories.map((addonCat) => {
                    const isFromCategory = categoryAddonCategoryIds.includes(addonCat.id);
                    const isChecked = selectedAddonCategories.includes(addonCat.id);
                    return (
                      <div key={addonCat.id} className={`flex items-start space-x-3 p-3 border rounded-lg ${isFromCategory ? 'border-primary/30 bg-primary/5' : ''}`}>
                        <input
                          type="checkbox"
                          id={`addon-category-${addonCat.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddonCategories([...selectedAddonCategories, addonCat.id]);
                            } else {
                              setSelectedAddonCategories(selectedAddonCategories.filter(id => id !== addonCat.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`addon-category-${addonCat.id}`} className="font-medium cursor-pointer">
                              {addonCat.name}
                            </Label>
                            {isFromCategory && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                Da categoria
                              </span>
                            )}
                          </div>
                          {addonCat.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {addonCat.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            {addonCat.is_required && (
                              <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                                Obrigatório
                              </span>
                            )}
                            {addonCat.min_selections > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Mín: {addonCat.min_selections}
                              </span>
                            )}
                            {addonCat.max_selections && (
                              <span className="text-xs text-muted-foreground">
                                Máx: {addonCat.max_selections}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedAddonCategories.length > 0 && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium">
                      {selectedAddonCategories.length} categoria(s) de adicionais selecionada(s)
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Os clientes poderão escolher adicionais dessas categorias ao comprar este produto.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Upsell - Vendas Sugeridas */}
            {productId && store?.id && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Upsell</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Sugira produtos complementares quando o cliente adicionar este item ao carrinho.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure produtos que serão sugeridos automaticamente quando este produto for adicionado ao carrinho.
                </p>
                <ProductUpsellSelector
                  storeId={store.id}
                  productId={productId}
                />
              </div>
            )}

            <Separator />

            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Texto do Botão *</Label>
                  <Input id="button_text" {...form.register('button_text')} placeholder="Ex: Comprar, Alugar, Agendar" />
                  {form.formState.errors.button_text && <p className="text-sm text-destructive">
                      {form.formState.errors.button_text.message}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input id="display_order" type="number" min="0" {...form.register('display_order', {
                  valueAsNumber: true
                })} placeholder="0" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_available" checked={form.watch('is_available')} onCheckedChange={checked => form.setValue('is_available', checked)} />
                <Label htmlFor="is_available">Produto disponível</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_featured" checked={form.watch('is_featured')} onCheckedChange={checked => form.setValue('is_featured', checked)} />
                <div className="flex items-center gap-2">
                  <Label htmlFor="is_featured" className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Produto em Destaque
                  </Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground ml-8 -mt-2">
                Este produto aparecerá na aba "Destaques" da loja
              </p>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || uploading || galleryUploading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {productId ? 'Atualizar' : 'Criar'} Produto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>;
}