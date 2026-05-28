import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Promotion, PromotionFormData } from '@/types/promotions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, Upload, X, Image as ImageIcon, AlertCircle, Percent, DollarSign, Tag, Truck, Gift, ShoppingBag, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CurrencyInput } from '@/components/ui/currency-input';

interface PromotionFormProps {
  promotionId?: string;
  storeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PromotionForm = ({
  promotionId,
  storeId,
  onSuccess,
  onCancel
}: PromotionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    description: '',
    code: '',
    include_product_discount: true,
    include_free_delivery: false,
    include_bogo: false,
    include_first_order: false,
    include_free_gift: false,
    discount_mode: 'sale_price',
    scope: 'all_products',
    applies_to_delivery: true,
    applies_to_pickup: true,
    first_order_only: false,
    is_visible_on_store: true,
    show_as_popup: false,
    popup_frequency_type: 'once_session',
    popup_max_displays: 1,
    start_date: new Date(),
    selectedProducts: [],
    selectedCategories: [],
    free_gift_products: [],
    product_sale_prices: {},
    bogo_discount_percentage: 100,
    bogo_buy_quantity: 2,
    bogo_get_quantity: 1
  });

  useEffect(() => {
    fetchData();
  }, [promotionId, storeId]);

  const fetchData = async () => {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('id, name, price').eq('store_id', storeId),
      supabase.from('categories').select('id, name').eq('store_id', storeId)
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);

    if (promotionId) {
      const { data: promotion } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (promotion) {
        const [promoProducts, promoCategories] = await Promise.all([
          supabase.from('promotion_products').select('product_id').eq('promotion_id', promotionId),
          supabase.from('promotion_categories').select('category_id').eq('promotion_id', promotionId)
        ]);

        // Determinar benefícios a partir do tipo salvo e colunas específicas
        const isFreeDelivery = promotion.type === 'free_delivery';
        const hasDiscount = !!(promotion.discount_percentage || promotion.discount_amount);
        const isBogo = promotion.type === 'bogo';
        const isFreeGift = promotion.type === 'free_gift' || !!promotion.include_free_gift;
        const isFirstOrder = promotion.first_order_only;
        
        let discountMode: 'percentage' | 'fixed_amount' | 'sale_price' = 'sale_price';
        if (promotion.discount_percentage && !promotion.discount_amount) {
          discountMode = 'percentage';
        } else if (promotion.discount_amount && promotion.scope !== 'specific_products') {
          discountMode = 'fixed_amount';
        }
        // Se scope é specific_products e tem discount_amount, mantemos sale_price (default)

        setFormData({
          include_free_gift: isFreeGift,
          free_gift_products: (promotion as any).free_gift_products || [],
          bogo_discount_percentage: promotion.bogo_discount_percentage !== null ? Number(promotion.bogo_discount_percentage) : 100,
          name: promotion.name,
          description: promotion.description || '',
          code: promotion.code || '',
          include_product_discount: hasDiscount && !isBogo,
          include_free_delivery: isFreeDelivery,
          include_bogo: isBogo,
          include_first_order: isFirstOrder || false,
          discount_mode: discountMode,
          discount_percentage: promotion.discount_percentage || undefined,
          discount_amount: promotion.discount_amount || undefined,
          bogo_buy_quantity: promotion.bogo_buy_quantity || undefined,
          bogo_get_quantity: promotion.bogo_get_quantity || undefined,
          scope: promotion.scope,
          applies_to_delivery: promotion.applies_to_delivery ?? true,
          applies_to_pickup: promotion.applies_to_pickup ?? true,
          first_order_only: promotion.first_order_only ?? false,
          minimum_order_value: promotion.minimum_order_value || undefined,
          max_uses: promotion.max_uses || undefined,
          max_uses_per_customer: promotion.max_uses_per_customer || undefined,
          start_date: new Date(promotion.start_date),
          end_date: promotion.end_date ? new Date(promotion.end_date) : undefined,
          allowed_days: promotion.allowed_days || [],
          start_time: promotion.start_time || undefined,
          end_time: promotion.end_time || undefined,
          is_visible_on_store: promotion.is_visible_on_store ?? true,
          show_as_popup: promotion.show_as_popup || false,
          popup_frequency_type: promotion.popup_frequency_type || 'once_session',
          popup_max_displays: promotion.popup_max_displays || 1,
          banner_image_url: promotion.banner_image_url || undefined,
          selectedProducts: promoProducts.data?.map(p => p.product_id) || [],
          selectedCategories: promoCategories.data?.map(c => c.category_id) || [],
          product_sale_prices: (() => {
            // Reconstruir preços promocionais a partir do discount_amount
            if (discountMode === 'sale_price' && promotion.discount_amount && productsRes.data) {
              const selectedIds = promoProducts.data?.map(p => p.product_id) || [];
              const prices: Record<string, number> = {};
              const perProductDiscount = selectedIds.length > 0 
                ? promotion.discount_amount / selectedIds.length 
                : 0;
              for (const pid of selectedIds) {
                const prod = productsRes.data.find((p: any) => p.id === pid);
                if (prod) {
                  prices[pid] = Math.max(0, prod.price - perProductDiscount);
                }
              }
              return prices;
            }
            return {};
          })()
        });
      }
    }
  };

  // Determinar o tipo para salvar no DB
  const resolveDBType = (): string => {
    if (formData.include_bogo) return 'bogo';
    if (formData.include_free_gift) return 'free_gift';
    if (formData.include_free_delivery && !formData.include_product_discount) return 'free_delivery';
    if (formData.include_free_delivery && formData.include_product_discount) {
      // Combo: save as free_delivery with discount fields populated
      return 'free_delivery';
    }
    if (formData.include_first_order) return 'first_order';
    if (formData.discount_mode === 'percentage') return 'percentage';
    return 'fixed_amount';
  };

  // Calcular discount_amount a partir de preços promocionais
  const calculateDiscountFromSalePrices = (): number => {
    if (formData.discount_mode !== 'sale_price' || !formData.product_sale_prices) return 0;
    
    let totalDiscount = 0;
    const selectedIds = formData.selectedProducts || [];
    
    for (const productId of selectedIds) {
      const product = products.find(p => p.id === productId);
      const salePrice = formData.product_sale_prices[productId];
      if (product && salePrice !== undefined && salePrice < product.price) {
        totalDiscount += (product.price - salePrice);
      }
    }
    
    return totalDiscount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.include_product_discount && !formData.include_free_delivery && !formData.include_bogo && !formData.include_first_order) {
      toast.error('Selecione pelo menos um benefício para a promoção');
      return;
    }
    
    setLoading(true);

    try {
      const dbType = resolveDBType();
      
      let discountPercentage = formData.discount_percentage || null;
      let discountAmount = formData.discount_amount || null;
      
      // Se modo preço promocional, calcular o desconto
      if (formData.include_product_discount && formData.discount_mode === 'sale_price') {
        const calculated = calculateDiscountFromSalePrices();
        if (calculated > 0) {
          discountAmount = calculated;
        }
      }

      const promotionData = {
        store_id: storeId,
        name: formData.name,
        description: formData.description || null,
        code: formData.code?.toUpperCase() || null,
        type: dbType as any,
        scope: formData.scope,
        status: 'active' as const,
        discount_percentage: formData.include_product_discount && formData.discount_mode === 'percentage' ? discountPercentage : (formData.include_free_delivery && formData.include_product_discount ? discountPercentage : null),
        discount_amount: formData.include_product_discount ? discountAmount : null,
        bogo_buy_quantity: formData.include_bogo ? (formData.bogo_buy_quantity || null) : null,
        bogo_get_quantity: formData.include_bogo ? (formData.bogo_get_quantity || null) : null,
        bogo_discount_percentage: formData.include_bogo ? (isNaN(Number(formData.bogo_discount_percentage)) ? 100 : Number(formData.bogo_discount_percentage)) : null,
        include_free_gift: formData.include_free_gift || false,
        free_gift_products: formData.include_free_gift ? (formData.free_gift_products || []) : [],
        applies_to_delivery: formData.applies_to_delivery,
        applies_to_pickup: formData.applies_to_pickup,
        first_order_only: formData.include_first_order || formData.first_order_only,
        minimum_order_value: formData.minimum_order_value || null,
        max_uses: formData.max_uses || null,
        max_uses_per_customer: formData.max_uses_per_customer || null,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date?.toISOString() || null,
        allowed_days: formData.allowed_days || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        is_visible_on_store: formData.is_visible_on_store,
        show_as_popup: formData.show_as_popup || false,
        popup_frequency_type: formData.popup_frequency_type || 'once_session',
        popup_max_displays: formData.popup_max_displays || 1,
        banner_image_url: formData.banner_image_url || null
      };

      let savedPromotionId = promotionId;

      if (promotionId) {
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', promotionId);
        if (error) throw error;
        await supabase.from('promotion_products').delete().eq('promotion_id', promotionId);
        await supabase.from('promotion_categories').delete().eq('promotion_id', promotionId);
      } else {
        let type: any = 'percentage';
        if (formData.include_free_delivery) type = 'free_delivery';
        if (formData.include_bogo) type = 'bogo';
        if (formData.include_free_gift) type = 'free_gift';
        
        const promotionData = {
          name: formData.name,
          description: formData.description,
          code: formData.code || null,
          type,
          scope: formData.scope,
          discount_percentage: formData.include_product_discount && formData.discount_mode === 'percentage' ? formData.discount_percentage : null,
          discount_amount: formData.include_product_discount && formData.discount_mode === 'fixed_amount' ? formData.discount_amount : null,
          bogo_buy_quantity: formData.include_bogo ? formData.bogo_buy_quantity : null,
          bogo_get_quantity: formData.include_bogo ? formData.bogo_get_quantity : null,
          bogo_discount_percentage: formData.include_bogo ? formData.bogo_discount_percentage : null,
          include_free_gift: formData.include_free_gift,
          free_gift_products: formData.include_free_gift ? formData.free_gift_products : [],
          minimum_order_value: formData.minimum_order_value,
          first_order_only: formData.first_order_only,
          max_uses: formData.max_uses,
          max_uses_per_customer: formData.max_uses_per_customer,
          start_date: formData.start_date.toISOString(),
          end_date: formData.end_date?.toISOString() || null,
          allowed_days: formData.allowed_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          is_visible_on_store: formData.is_visible_on_store,
          banner_image_url: formData.banner_image_url || null,
          show_as_popup: formData.show_as_popup || false,
          popup_frequency_type: formData.popup_frequency_type || 'once_session',
          popup_max_displays: formData.popup_max_displays || 1,
          store_id: storeId
        };

        const { data, error } = await supabase
          .from('promotions')
          .insert(promotionData)
          .select()
          .single();
        if (error) throw error;
        savedPromotionId = data.id;
      }

      if (formData.scope === 'specific_products' && formData.selectedProducts?.length) {
        await supabase.from('promotion_products').insert(
          formData.selectedProducts.map(productId => ({
            promotion_id: savedPromotionId,
            product_id: productId
          }))
        );
      }

      if (formData.scope === 'category' && formData.selectedCategories?.length) {
        await supabase.from('promotion_categories').insert(
          formData.selectedCategories.map(categoryId => ({
            promotion_id: savedPromotionId,
            category_id: categoryId
          }))
        );
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao salvar promoção');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from('promotion-banners')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('promotion-banners')
        .getPublicUrl(fileName);

      setFormData({ ...formData, banner_image_url: publicUrl });
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.banner_image_url) return;
    try {
      const urlParts = formData.banner_image_url.split('/promotion-banners/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage.from('promotion-banners').remove([filePath]);
      }
      setFormData({ ...formData, banner_image_url: undefined });
      toast.success('Imagem removida');
    } catch (error: any) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  const weekDays = [
    { value: 'monday', label: 'Segunda' },
    { value: 'tuesday', label: 'Terça' },
    { value: 'wednesday', label: 'Quarta' },
    { value: 'thursday', label: 'Quinta' },
    { value: 'friday', label: 'Sexta' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Promoção *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="code">Código do Cupom (opcional)</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ex: DESCONTO10"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se deixar em branco, a promoção será aplicada automaticamente
            </p>
          </div>

          {/* Upload de Imagem */}
          <div>
            <Label>Imagem do Banner (opcional)</Label>
            <div className="mt-2 space-y-3">
              {formData.banner_image_url ? (
                <div className="relative group">
                  <img
                    src={formData.banner_image_url}
                    alt="Banner da promoção"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="banner-upload"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="banner-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Enviando...</p>
                        <Progress value={uploadProgress} className="w-full max-w-xs" />
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Clique para fazer upload</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG ou WEBP (máx 2MB)
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Benefícios da Promoção */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Benefícios da Promoção</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione os benefícios que deseja oferecer. Você pode combinar mais de um!
        </p>
        
        <div className="space-y-4">
          {/* Desconto no Produto */}
          <div className={cn(
            "border rounded-lg p-4 transition-colors",
            formData.include_product_discount ? "border-primary bg-primary/5" : "border-border"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  formData.include_product_discount ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Desconto no Produto</p>
                  <p className="text-xs text-muted-foreground">Reduzir o preço dos produtos selecionados</p>
                </div>
              </div>
              <Switch
                checked={formData.include_product_discount}
                onCheckedChange={(checked) => setFormData({ ...formData, include_product_discount: checked })}
              />
            </div>
            
            {formData.include_product_discount && (
              <div className="mt-4 space-y-4 pt-4 border-t">
                <div>
                  <Label>Como definir o desconto? *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_mode: 'sale_price' })}
                      className={cn(
                        "p-3 rounded-lg border text-center text-sm transition-colors",
                        formData.discount_mode === 'sale_price' 
                          ? "border-primary bg-primary/10 text-primary font-medium" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <DollarSign className="w-4 h-4 mx-auto mb-1" />
                      Preço Promocional
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_mode: 'percentage' })}
                      className={cn(
                        "p-3 rounded-lg border text-center text-sm transition-colors",
                        formData.discount_mode === 'percentage' 
                          ? "border-primary bg-primary/10 text-primary font-medium" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Percent className="w-4 h-4 mx-auto mb-1" />
                      Percentual (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_mode: 'fixed_amount' })}
                      className={cn(
                        "p-3 rounded-lg border text-center text-sm transition-colors",
                        formData.discount_mode === 'fixed_amount' 
                          ? "border-primary bg-primary/10 text-primary font-medium" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <DollarSign className="w-4 h-4 mx-auto mb-1" />
                      Valor Fixo (R$)
                    </button>
                  </div>
                </div>
                
                {formData.discount_mode === 'percentage' && (
                  <div>
                    <Label htmlFor="discount_percentage">Desconto (%) *</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percentage || ''}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                      placeholder="Ex: 10"
                      required
                    />
                  </div>
                )}
                
                {formData.discount_mode === 'fixed_amount' && (
                  <div>
                    <Label htmlFor="discount_amount">Valor do Desconto *</Label>
                    <CurrencyInput
                      id="discount_amount"
                      value={formData.discount_amount || 0}
                      onChange={(value) => setFormData({ ...formData, discount_amount: value })}
                      placeholder="0,00"
                    />
                  </div>
                )}
                
                {formData.discount_mode === 'sale_price' && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      💡 Selecione os produtos abaixo na seção "Aplicar em" e defina o preço que deseja vender cada um.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Frete Grátis */}
          <div className={cn(
            "border rounded-lg p-4 transition-colors",
            formData.include_free_delivery ? "border-primary bg-primary/5" : "border-border"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  formData.include_free_delivery ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Frete Grátis</p>
                  <p className="text-xs text-muted-foreground">Zerar a taxa de entrega do pedido inteiro</p>
                </div>
              </div>
              <Switch
                checked={formData.include_free_delivery}
                onCheckedChange={(checked) => setFormData({ ...formData, include_free_delivery: checked })}
              />
            </div>
          </div>
          
          {/* BOGO */}
          <div className={cn(
            "border rounded-lg p-4 transition-colors",
            formData.include_bogo ? "border-primary bg-primary/5" : "border-border"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  formData.include_bogo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Leve X Pague Y</p>
                  <p className="text-xs text-muted-foreground">O cliente leva mais e paga menos</p>
                </div>
              </div>
              <Switch
                checked={formData.include_bogo}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  include_bogo: checked,
                  include_product_discount: checked ? false : formData.include_product_discount
                })}
              />
            </div>
            
            {formData.include_bogo && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bogo_buy">Compre *</Label>
                    <Input
                      id="bogo_buy"
                      type="number"
                      min="1"
                      value={formData.bogo_buy_quantity || ''}
                      onChange={(e) => setFormData({ ...formData, bogo_buy_quantity: parseInt(e.target.value) })}
                      placeholder="Ex: 2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bogo_get">Ganhe *</Label>
                    <Input
                      id="bogo_get"
                      type="number"
                      min="1"
                      value={formData.bogo_get_quantity || ''}
                      onChange={(e) => setFormData({ ...formData, bogo_get_quantity: parseInt(e.target.value) })}
                      placeholder="Ex: 1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bogo_discount">Desconto no item ganho (%) *</Label>
                  <Input
                    id="bogo_discount"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.bogo_discount_percentage || 100}
                    onChange={(e) => setFormData({ ...formData, bogo_discount_percentage: parseFloat(e.target.value) })}
                    placeholder="Ex: 100 para grátis, 50 para metade do preço"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use 100 para o item sair de graça, ou 50 para 50% de desconto.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Brinde / Produto Grátis */}
          <div className={cn(
            "border rounded-lg p-4 transition-colors",
            formData.include_free_gift ? "border-primary bg-primary/5" : "border-border"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  formData.include_free_gift ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Brinde / Produto Grátis</p>
                  <p className="text-xs text-muted-foreground">Oferecer um produto específico como brinde</p>
                </div>
              </div>
              <Switch
                checked={formData.include_free_gift}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  include_free_gift: checked,
                  include_product_discount: checked ? false : formData.include_product_discount,
                  include_bogo: checked ? false : formData.include_bogo
                })}
              />
            </div>
            
            {formData.include_free_gift && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <Label>Selecione o(s) brinde(s) *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`gift-${product.id}`}
                        checked={formData.free_gift_products?.includes(product.id)}
                        onCheckedChange={(checked) => {
                          const current = formData.free_gift_products || [];
                          if (checked) {
                            setFormData({ ...formData, free_gift_products: [...current, product.id] });
                          } else {
                            setFormData({ ...formData, free_gift_products: current.filter(id => id !== product.id) });
                          }
                        }}
                      />
                      <label htmlFor={`gift-${product.id}`} className="text-sm cursor-pointer truncate">
                        {product.name}
                      </label>
                    </div>
                  ))}
                </div>
                {(!formData.free_gift_products || formData.free_gift_products.length === 0) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Selecione ao menos um produto para brinde
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Primeira Compra */}
          <div className={cn(
            "border rounded-lg p-4 transition-colors",
            formData.include_first_order ? "border-primary bg-primary/5" : "border-border"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  formData.include_first_order ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Apenas Primeira Compra</p>
                  <p className="text-xs text-muted-foreground">Válida somente para clientes novos</p>
                </div>
              </div>
              <Switch
                checked={formData.include_first_order}
                onCheckedChange={(checked) => setFormData({ ...formData, include_first_order: checked, first_order_only: checked })}
              />
            </div>
          </div>

          {/* Resumo dos benefícios */}
          {(formData.include_product_discount || formData.include_free_delivery || formData.include_bogo || formData.include_first_order) && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Resumo dos benefícios:</p>
              <ul className="text-xs text-green-700 dark:text-green-400 space-y-0.5">
                {formData.include_product_discount && (
                  <li>✓ Desconto no produto ({formData.discount_mode === 'sale_price' ? 'preço promocional' : formData.discount_mode === 'percentage' ? 'percentual' : 'valor fixo'})</li>
                )}
                {formData.include_free_delivery && <li>✓ Frete grátis no pedido inteiro</li>}
                {formData.include_bogo && <li>✓ Leve {formData.bogo_buy_quantity || '?'} pague {(formData.bogo_buy_quantity || 0) - (formData.bogo_get_quantity || 0) > 0 ? (formData.bogo_buy_quantity || 0) - (formData.bogo_get_quantity || 0) : '?'}</li>}
                {formData.include_first_order && <li>✓ Apenas para primeira compra</li>}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Escopo */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Aplicar Promoção Em</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="scope">Aplicar em *</Label>
            <Select value={formData.scope} onValueChange={(value: any) => setFormData({ ...formData, scope: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_products">Todos os Produtos</SelectItem>
                <SelectItem value="category">Categorias Específicas</SelectItem>
                <SelectItem value="specific_products">Produtos Específicos</SelectItem>
                <SelectItem value="delivery_type">Tipo de Entrega</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.scope === 'specific_products' && (
            <div className="space-y-2">
              <Label>Produtos *</Label>
              <div className="border rounded-lg p-4 max-h-80 overflow-y-auto space-y-3">
                {products.map((product) => {
                  const isSelected = formData.selectedProducts?.includes(product.id);
                  const salePrice = formData.product_sale_prices?.[product.id];
                  
                  return (
                    <div key={product.id} className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-colors",
                      isSelected ? "bg-primary/5" : ""
                    )}>
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const current = formData.selectedProducts || [];
                          const newSalePrices = { ...formData.product_sale_prices };
                          if (!checked) {
                            delete newSalePrices[product.id];
                          }
                          setFormData({
                            ...formData,
                            selectedProducts: checked
                              ? [...current, product.id]
                              : current.filter(id => id !== product.id),
                            product_sale_prices: newSalePrices
                          });
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor={`product-${product.id}`} className="text-sm cursor-pointer font-medium block">
                          {product.name}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          Preço atual: {formatCurrency(product.price)}
                        </span>
                      </div>
                      
                      {/* Campo de preço promocional */}
                      {isSelected && formData.include_product_discount && formData.discount_mode === 'sale_price' && (
                        <div className="w-36">
                          <CurrencyInput
                            value={salePrice ?? 0}
                            onChange={(value) => {
                              setFormData({
                                ...formData,
                                product_sale_prices: {
                                  ...formData.product_sale_prices,
                                  [product.id]: value
                                }
                              });
                            }}
                            placeholder="0,00"
                            className="h-8 text-xs"
                          />
                          {salePrice !== undefined && salePrice > 0 && salePrice < product.price && (
                            <p className="text-[10px] text-green-600 mt-0.5">
                              -{((1 - salePrice / product.price) * 100).toFixed(0)}% OFF
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {formData.scope === 'category' && (
            <div className="space-y-2">
              <Label>Categorias *</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={formData.selectedCategories?.includes(category.id)}
                      onCheckedChange={(checked) => {
                        const current = formData.selectedCategories || [];
                        setFormData({
                          ...formData,
                          selectedCategories: checked
                            ? [...current, category.id]
                            : current.filter(id => id !== category.id)
                        });
                      }}
                    />
                    <label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="applies_to_delivery">Aplicar em Delivery</Label>
              <Switch
                id="applies_to_delivery"
                checked={formData.applies_to_delivery}
                onCheckedChange={(checked) => setFormData({ ...formData, applies_to_delivery: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="applies_to_pickup">Aplicar em Retirada</Label>
              <Switch
                id="applies_to_pickup"
                checked={formData.applies_to_pickup}
                onCheckedChange={(checked) => setFormData({ ...formData, applies_to_pickup: checked })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Regras */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Regras e Limites</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="minimum_order_value">Valor Mínimo do Pedido</Label>
            <CurrencyInput
              id="minimum_order_value"
              value={formData.minimum_order_value || 0}
              onChange={(value) => setFormData({ ...formData, minimum_order_value: value || undefined })}
              placeholder="0,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_uses">Máximo de Usos Total</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={formData.max_uses || ''}
                onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || undefined })}
              />
            </div>
            <div>
              <Label htmlFor="max_uses_per_customer">Máximo por Cliente</Label>
              <Input
                id="max_uses_per_customer"
                type="number"
                min="1"
                value={formData.max_uses_per_customer || ''}
                onChange={(e) => setFormData({ ...formData, max_uses_per_customer: parseInt(e.target.value) || undefined })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Período */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Período de Validade</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, 'PP', { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => date && setFormData({ ...formData, start_date: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, 'PP', { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => setFormData({ ...formData, end_date: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Dias Permitidos</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {weekDays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={formData.allowed_days?.includes(day.value)}
                    onCheckedChange={(checked) => {
                      const current = formData.allowed_days || [];
                      setFormData({
                        ...formData,
                        allowed_days: checked
                          ? [...current, day.value]
                          : current.filter(d => d !== day.value)
                      });
                    }}
                  />
                  <label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                    {day.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Hora Início</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time || ''}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value || undefined })}
              />
            </div>
            <div>
              <Label htmlFor="end_time">Hora Término</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time || ''}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value || undefined })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Visibilidade */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_visible_on_store">Exibir na Loja</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar esta promoção em destaque na página da loja
            </p>
          </div>
          <Switch
            id="is_visible_on_store"
            checked={formData.is_visible_on_store}
            onCheckedChange={(checked) => setFormData({ ...formData, is_visible_on_store: checked })}
          />
        </div>
      </Card>

      {/* Configurações de Popup */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show_as_popup" className="text-base font-semibold">
                Exibir como Popup Automático
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Mostrar esta promoção automaticamente quando o cliente entrar na loja
              </p>
            </div>
            <Switch
              id="show_as_popup"
              checked={formData.show_as_popup || false}
              onCheckedChange={(checked) => {
                setFormData({ 
                  ...formData, 
                  show_as_popup: checked,
                  ...(checked ? {} : {
                    popup_frequency_type: 'once_session',
                    popup_max_displays: 1
                  })
                });
              }}
            />
          </div>

          {formData.show_as_popup && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="popup_frequency_type">
                  Frequência de Exibição
                </Label>
                <Select
                  value={formData.popup_frequency_type || 'once_session'}
                  onValueChange={(value: 'once_browser' | 'once_session' | 'custom_count') => 
                    setFormData({ 
                      ...formData, 
                      popup_frequency_type: value,
                      popup_max_displays: value === 'custom_count' ? formData.popup_max_displays : 1
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once_browser">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Uma vez no navegador</span>
                        <span className="text-xs text-muted-foreground">
                          Aparece apenas 1 vez (salvo permanentemente)
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="once_session">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Uma vez por sessão</span>
                        <span className="text-xs text-muted-foreground">
                          Aparece 1 vez cada vez que o cliente abre o site
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom_count">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Personalizado (contador)</span>
                        <span className="text-xs text-muted-foreground">
                          Definir quantas vezes o popup pode aparecer
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.popup_frequency_type === 'custom_count' && (
                <div className="space-y-2">
                  <Label htmlFor="popup_max_displays">
                    Número Máximo de Exibições
                  </Label>
                  <Input
                    id="popup_max_displays"
                    type="number"
                    min="1"
                    max="999"
                    value={formData.popup_max_displays || 1}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      popup_max_displays: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                    placeholder="Ex: 3"
                  />
                  <p className="text-xs text-muted-foreground">
                    O popup aparecerá no máximo {formData.popup_max_displays} vez(es) para cada cliente
                  </p>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Como funciona:</p>
                {formData.popup_frequency_type === 'once_browser' && (
                  <p className="text-xs text-muted-foreground">
                    ✓ O popup aparecerá <strong>apenas 1 vez</strong> no navegador do cliente<br/>
                    ✓ Mesmo que o cliente feche e reabra o navegador, não aparecerá novamente<br/>
                    ✓ Salvo permanentemente no dispositivo (localStorage)
                  </p>
                )}
                {formData.popup_frequency_type === 'once_session' && (
                  <p className="text-xs text-muted-foreground">
                    ✓ O popup aparecerá <strong>1 vez por sessão</strong><br/>
                    ✓ Se o cliente fechar e reabrir o navegador, aparecerá novamente<br/>
                    ✓ Salvo temporariamente na sessão (sessionStorage)
                  </p>
                )}
                {formData.popup_frequency_type === 'custom_count' && (
                  <p className="text-xs text-muted-foreground">
                    ✓ O popup aparecerá <strong>até {formData.popup_max_displays} vez(es)</strong><br/>
                    ✓ Após atingir o limite, não aparecerá mais<br/>
                    ✓ Contador salvo permanentemente (localStorage)
                  </p>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ <strong>Apenas 1 promoção pode ter popup ativo por vez.</strong> 
                  Ao ativar esta opção, qualquer outra promoção configurada como popup será automaticamente desativada.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            promotionId ? 'Atualizar Promoção' : 'Criar Promoção'
          )}
        </Button>
      </div>
    </form>
  );
};
