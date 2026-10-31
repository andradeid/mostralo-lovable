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
import { buildPromotionPayload, hasCalculableBenefit } from '@/lib/promotionPayload';
import { BasicInfoSection } from './promotion-form/BasicInfoSection';
import { BenefitsSection } from './promotion-form/BenefitsSection';
import { ScopeSection } from './promotion-form/ScopeSection';
import { RulesSection } from './promotion-form/RulesSection';
import { PeriodSection } from './promotion-form/PeriodSection';
import { VisibilitySection } from './promotion-form/VisibilitySection';
import { PopupSection } from './promotion-form/PopupSection';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!hasCalculableBenefit(formData)) {
      toast.error(formData.include_free_gift
        ? 'O brinde ainda não é calculado automaticamente: marque também um desconto, frete grátis ou leve x pague y'
        : 'Selecione pelo menos um benefício para a promoção');
      return;
    }
    
    setLoading(true);

    try {
      const promotionData = buildPromotionPayload(formData, { storeId, products });
      let savedPromotionId = promotionId;

      if (promotionId) {
        const { error } = await supabase
          .from('promotions')
          .update(promotionData as any)
          .eq('id', promotionId);
        if (error) throw error;
        await supabase.from('promotion_products').delete().eq('promotion_id', promotionId);
        await supabase.from('promotion_categories').delete().eq('promotion_id', promotionId);
      } else {
        const { data, error } = await supabase
          .from('promotions')
          .insert(promotionData as any)
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



  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicInfoSection formData={formData} setFormData={setFormData} uploadingImage={uploadingImage} uploadProgress={uploadProgress} handleImageUpload={handleImageUpload} handleRemoveImage={handleRemoveImage} />

      <BenefitsSection formData={formData} setFormData={setFormData} products={products} />

      <ScopeSection formData={formData} setFormData={setFormData} products={products} categories={categories} />

      <RulesSection formData={formData} setFormData={setFormData} />

      <PeriodSection formData={formData} setFormData={setFormData} />

      <VisibilitySection formData={formData} setFormData={setFormData} />

      <PopupSection formData={formData} setFormData={setFormData} />

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
