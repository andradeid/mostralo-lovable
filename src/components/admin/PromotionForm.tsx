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
import { CalendarIcon, Loader2, Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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
    type: 'percentage',
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
    selectedCategories: []
  });

  useEffect(() => {
    fetchData();
  }, [promotionId, storeId]);

  const fetchData = async () => {
    // Buscar produtos e categorias
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('id, name').eq('store_id', storeId),
      supabase.from('categories').select('id, name').eq('store_id', storeId)
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);

    // Se editando, buscar dados da promoção
    if (promotionId) {
      const { data: promotion } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (promotion) {
        // Buscar produtos e categorias vinculados
        const [promoProducts, promoCategories] = await Promise.all([
          supabase.from('promotion_products').select('product_id').eq('promotion_id', promotionId),
          supabase.from('promotion_categories').select('category_id').eq('promotion_id', promotionId)
        ]);

        setFormData({
          name: promotion.name,
          description: promotion.description || '',
          code: promotion.code || '',
          type: promotion.type,
          scope: promotion.scope,
          discount_percentage: promotion.discount_percentage || undefined,
          discount_amount: promotion.discount_amount || undefined,
          bogo_buy_quantity: promotion.bogo_buy_quantity || undefined,
          bogo_get_quantity: promotion.bogo_get_quantity || undefined,
          applies_to_delivery: promotion.applies_to_delivery,
          applies_to_pickup: promotion.applies_to_pickup,
          first_order_only: promotion.first_order_only,
          minimum_order_value: promotion.minimum_order_value || undefined,
          max_uses: promotion.max_uses || undefined,
          max_uses_per_customer: promotion.max_uses_per_customer || undefined,
          start_date: new Date(promotion.start_date),
          end_date: promotion.end_date ? new Date(promotion.end_date) : undefined,
          allowed_days: promotion.allowed_days || [],
          start_time: promotion.start_time || undefined,
          end_time: promotion.end_time || undefined,
          is_visible_on_store: promotion.is_visible_on_store,
          show_as_popup: promotion.show_as_popup || false,
          popup_frequency_type: promotion.popup_frequency_type || 'once_session',
          popup_max_displays: promotion.popup_max_displays || 1,
          banner_image_url: promotion.banner_image_url || undefined,
          selectedProducts: promoProducts.data?.map(p => p.product_id) || [],
          selectedCategories: promoCategories.data?.map(c => c.category_id) || []
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const promotionData = {
        store_id: storeId,
        name: formData.name,
        description: formData.description || null,
        code: formData.code?.toUpperCase() || null,
        type: formData.type,
        scope: formData.scope,
        status: 'active' as const,
        discount_percentage: formData.discount_percentage || null,
        discount_amount: formData.discount_amount || null,
        bogo_buy_quantity: formData.bogo_buy_quantity || null,
        bogo_get_quantity: formData.bogo_get_quantity || null,
        applies_to_delivery: formData.applies_to_delivery,
        applies_to_pickup: formData.applies_to_pickup,
        first_order_only: formData.first_order_only,
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
        // Atualizar
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', promotionId);

        if (error) throw error;

        // Deletar vínculos antigos
        await supabase.from('promotion_products').delete().eq('promotion_id', promotionId);
        await supabase.from('promotion_categories').delete().eq('promotion_id', promotionId);
      } else {
        // Criar
        const { data, error } = await supabase
          .from('promotions')
          .insert(promotionData)
          .select()
          .single();

        if (error) throw error;
        savedPromotionId = data.id;
      }

      // Criar vínculos com produtos
      if (formData.scope === 'specific_products' && formData.selectedProducts?.length) {
        await supabase.from('promotion_products').insert(
          formData.selectedProducts.map(productId => ({
            promotion_id: savedPromotionId,
            product_id: productId
          }))
        );
      }

      // Criar vínculos com categorias
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

    // Validar tipo de arquivo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP');
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from('promotion-banners')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Obter URL pública
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
      // Extrair caminho do arquivo da URL
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

      {/* Tipo de Promoção */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tipo de Desconto</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo *</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Desconto Percentual</SelectItem>
                <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                <SelectItem value="free_delivery">Frete Grátis</SelectItem>
                <SelectItem value="bogo">BOGO (Leve X Pague Y)</SelectItem>
                <SelectItem value="first_order">Primeira Compra</SelectItem>
                <SelectItem value="minimum_order">Pedido Mínimo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'percentage' && (
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
                required
              />
            </div>
          )}

          {formData.type === 'fixed_amount' && (
            <div>
              <Label htmlFor="discount_amount">Valor do Desconto (R$) *</Label>
              <Input
                id="discount_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.discount_amount || ''}
                onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) })}
                required
              />
            </div>
          )}

          {formData.type === 'bogo' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bogo_buy">Quantidade para Comprar *</Label>
                <Input
                  id="bogo_buy"
                  type="number"
                  min="1"
                  value={formData.bogo_buy_quantity || ''}
                  onChange={(e) => setFormData({ ...formData, bogo_buy_quantity: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bogo_get">Quantidade Grátis *</Label>
                <Input
                  id="bogo_get"
                  type="number"
                  min="1"
                  value={formData.bogo_get_quantity || ''}
                  onChange={(e) => setFormData({ ...formData, bogo_get_quantity: parseInt(e.target.value) })}
                  required
                />
              </div>
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
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={formData.selectedProducts?.includes(product.id)}
                      onCheckedChange={(checked) => {
                        const current = formData.selectedProducts || [];
                        setFormData({
                          ...formData,
                          selectedProducts: checked
                            ? [...current, product.id]
                            : current.filter(id => id !== product.id)
                        });
                      }}
                    />
                    <label htmlFor={`product-${product.id}`} className="text-sm cursor-pointer">
                      {product.name}
                    </label>
                  </div>
                ))}
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
            <Label htmlFor="minimum_order_value">Valor Mínimo do Pedido (R$)</Label>
            <Input
              id="minimum_order_value"
              type="number"
              min="0"
              step="0.01"
              value={formData.minimum_order_value || ''}
              onChange={(e) => setFormData({ ...formData, minimum_order_value: parseFloat(e.target.value) || undefined })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="first_order_only">Apenas Primeira Compra</Label>
            <Switch
              id="first_order_only"
              checked={formData.first_order_only}
              onCheckedChange={(checked) => setFormData({ ...formData, first_order_only: checked })}
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
