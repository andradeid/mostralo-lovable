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
import { Loader2, Upload, X, Plus, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
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
  display_order: z.number().min(0),
  image_url: z.string().optional(),
  button_text: z.string().min(1, 'Texto do botão é obrigatório'),
  image_gallery: z.array(z.string()).optional(),
  slug: z.string().optional(),
  is_on_offer: z.boolean(),
  original_price: z.number().optional(),
  offer_price: z.number().optional()
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
      display_order: 0,
      image_url: '',
      button_text: 'Comprar',
      image_gallery: [],
      is_on_offer: false,
      original_price: 0,
      offer_price: 0
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
  const fetchStoreAndCategories = async () => {
    try {
      // Buscar a loja do usuário
      const {
        data: storeData
      } = await supabase.from('stores').select('id').eq('owner_id', user?.id).maybeSingle();
      if (storeData) {
        setStore(storeData);

        // Buscar categorias da loja
        const {
          data: categoriesData
        } = await supabase.from('categories').select('id, name').eq('store_id', storeData.id).eq('is_active', true).order('display_order');
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
      // Buscar a loja do usuário
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (storeData) {
        // Buscar categorias de adicionais da loja
        const { data: addonCategoriesData } = await supabase
          .from('addon_categories')
          .select('id, name, description, is_required, min_selections, max_selections')
          .eq('store_id', storeData.id)
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
      console.log('Dados do produto carregados:', data); // Debug

      // Aguardar as categorias serem carregadas primeiro
      await fetchStoreAndCategories();
      form.reset({
        name: data.name,
        description: data.description || '',
        price: Number(data.price),
        category_id: data.category_id || '',
        is_available: data.is_available,
        display_order: data.display_order,
        image_url: data.image_url || '',
        button_text: data.button_text || 'Comprar',
        image_gallery: data.image_gallery || [],
        is_on_offer: data.is_on_offer || false,
        original_price: Number(data.original_price) || 0,
        offer_price: Number(data.offer_price) || 0
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
        display_order: data.display_order,
        image_url: data.image_url || null,
        button_text: data.button_text || 'Comprar',
        image_gallery: data.image_gallery || [],
        store_id: store.id,
        is_on_offer: data.is_on_offer || false,
        original_price: data.is_on_offer ? data.price : null,
        offer_price: data.is_on_offer ? data.offer_price : null
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
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input id="price" type="number" step="0.01" min="0" {...form.register('price', {
                  valueAsNumber: true
                })} placeholder="0,00" />
                  {form.formState.errors.price && <p className="text-sm text-destructive">
                      {form.formState.errors.price.message}
                    </p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" {...form.register('description')} placeholder="Descreva seu produto..." rows={3} />
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
                    <Label htmlFor="offer_price">Preço com Desconto (R$) *</Label>
                    <Input 
                      id="offer_price" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      {...form.register('offer_price', { valueAsNumber: true })} 
                      placeholder="0,00" 
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

            {/* Opções */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Variações</h3>
              
              {variants.length > 0 && <div className="space-y-2">
                  {variants.map((variant, index) => <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <span className="flex-1 font-medium">{variant.name}</span>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">R$</Label>
                        <Input type="number" step="0.01" min="0" value={variant.price} onChange={e => updateVariantPrice(index, Number(e.target.value))} className="w-20" />
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
                  Selecione as categorias de adicionais que estarão disponíveis para este produto
                </p>
                
                <div className="space-y-3">
                  {addonCategories.map((category) => (
                    <div key={category.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={`addon-category-${category.id}`}
                        checked={selectedAddonCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAddonCategories([...selectedAddonCategories, category.id]);
                          } else {
                            setSelectedAddonCategories(selectedAddonCategories.filter(id => id !== category.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`addon-category-${category.id}`} className="font-medium cursor-pointer">
                          {category.name}
                        </Label>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          {category.is_required && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              Obrigatório
                            </span>
                          )}
                          {category.min_selections > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Mín: {category.min_selections}
                            </span>
                          )}
                          {category.max_selections && (
                            <span className="text-xs text-muted-foreground">
                              Máx: {category.max_selections}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedAddonCategories.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>{selectedAddonCategories.length} categoria(s) de adicionais selecionada(s)</strong>
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Os clientes poderão escolher adicionais dessas categorias ao comprar este produto.
                    </p>
                  </div>
                )}
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