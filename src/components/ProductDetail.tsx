import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Minus, 
  Plus, 
  MessageCircle,
  Store as StoreIcon,
  ArrowLeft
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProductPromotion } from '@/hooks/useProductPromotion';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id?: string;
  display_order: number;
  button_text?: string;
  image_gallery?: string[];
  variants?: ProductVariant[];
  is_on_offer?: boolean;
  original_price?: number;
  offer_price?: number;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  is_default: boolean;
  is_available: boolean;
}

interface Store {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  description?: string;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
  };
}

interface ProductDetailProps {
  product: Product | null;
  store: Store;
  relatedProducts?: Product[];
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: Product) => void;
  storeStatus?: {
    canAddToCart: boolean;
    shouldShowSchedulingRequired: boolean;
  };
  onAuthRequired?: () => void; // Callback para quando login for necessário
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  store,
  relatedProducts = [],
  isOpen,
  onClose,
  onProductSelect,
  storeStatus,
  onAuthRequired
}) => {
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  const primaryColor = store.configuration?.primary_color || '#3B82F6';

  // Hook para calcular promoções aplicáveis ao produto
  const { finalPrice: promotionFinalPrice, discountInfo } = useProductPromotion({
    product: product,
    storeId: store.id,
    quantity: quantity,
    selectedVariantPrice: selectedVariant?.price
  });

  // Buscar variantes quando o produto for aberto
  useEffect(() => {
    if (product && isOpen) {
      fetchProductVariants();
    }
  }, [product, isOpen]);

  const fetchProductVariants = async () => {
    if (!product) return;
    
    setLoadingVariants(true);
    try {
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_available', true)
        .order('display_order');

      if (variantsData && variantsData.length > 0) {
        setVariants(variantsData);
        // Selecionar a variante padrão ou a primeira
        const defaultVariant = variantsData.find(v => v.is_default) || variantsData[0];
        setSelectedVariant(defaultVariant);
      } else {
        setVariants([]);
        setSelectedVariant(null);
      }
    } catch (error) {
      console.error('Erro ao buscar variantes:', error);
      setVariants([]);
      setSelectedVariant(null);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Resetar estado quando fechar o modal
  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
      setObservations('');
      setCurrentImageIndex(0);
      setVariants([]);
      setSelectedVariant(null);
    }
  }, [isOpen]);

  // Criar array com todas as imagens (principal + galeria)
  const allImages = [
    ...(product?.image_url ? [product.image_url] : []),
    ...(product?.image_gallery || [])
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getCurrentPrice = () => {
    return promotionFinalPrice || (selectedVariant ? selectedVariant.price : product?.price || 0);
  };

  const getCurrentVariantName = () => {
    return selectedVariant ? selectedVariant.name : '';
  };

  // Verificar se o cliente está logado
  const isCustomerLoggedIn = () => {
    if (!store?.id) return false;
    
    const savedProfile = localStorage.getItem(`customer_${store.id}`);
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        return !!profile.name || !!profile.email;
      } catch (error) {
        return false;
      }
    }
    return false;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Verificar se o cliente está logado
    if (!isCustomerLoggedIn()) {
      toast({
        title: "⚠️ Login necessário",
        description: "Para adicionar produtos ao carrinho, você precisa estar logado. Faça login ou crie uma conta.",
        variant: "destructive"
      });
      onClose(); // Fecha o modal
      if (onAuthRequired) {
        onAuthRequired(); // Abre o dialog de autenticação na página pai
      }
      return;
    }

    const currentPrice = getCurrentPrice();
    const variantInfo = selectedVariant ? ` - ${selectedVariant.name}` : '';

    addItem({
      id: selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id,
      name: product.name + variantInfo,
      price: currentPrice,
      image_url: product.image_url
    }, quantity);

    toast({
      title: 'Produto adicionado!',
      description: `${quantity}x ${product.name}${variantInfo}${discountInfo?.source === 'promotion' ? ' com promoção aplicada' : ''} adicionado ao carrinho.`
    });

    onClose();
  };

  const sendWhatsAppMessage = () => {
    if (!product || !store.phone) return;
    
    const currentPrice = getCurrentPrice();
    const variantInfo = selectedVariant ? ` - ${selectedVariant.name}` : '';
    
    let message = `Olá! Gostaria de pedir:

*${product.name}*${variantInfo}
Preço: ${formatPrice(currentPrice)}`;
    if (quantity > 1) {
      message += `\nQuantidade: ${quantity}`;
    }
    if (observations) {
      message += `\nObservações: ${observations}`;
    }
    message += `\n\nPoderia me ajudar?`;
    
    const phone = store.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          {/* Header */}
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
            </div>
          </DialogHeader>

          {/* Produto Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Imagem do Produto */}
            <div className="space-y-4">
              {/* Imagem Principal */}
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[currentImageIndex]}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-all ${
                      storeStatus && !storeStatus.canAddToCart ? 'grayscale opacity-60' : ''
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <StoreIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Galeria de Miniaturas */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((imageUrl, index) => (
                    <div 
                      key={index}
                      className={`aspect-square bg-muted rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                        currentImageIndex === index 
                          ? 'border-primary' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={imageUrl}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informações do Produto */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <p className="text-muted-foreground mb-4">{product.description}</p>
                
                {/* Badge de Oferta ou Promoção */}
                {discountInfo && discountInfo.amount > 0 && (
                  <div className="mb-2">
                    <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                      {Math.round((discountInfo.amount / (selectedVariant?.price || product.price)) * 100)}% OFF
                      {discountInfo.source === 'promotion' && ' (Promoção)'}
                      {discountInfo.source === 'product_offer' && ' (Oferta)'}
                    </span>
                  </div>
                )}
                
                {/* Mensagem de desconto */}
                {discountInfo && discountInfo.message && (
                  <p className="text-sm text-green-600 font-medium mb-2">
                    ✨ {discountInfo.message}
                  </p>
                )}
                
                {/* Preços */}
                <div className="flex items-baseline gap-3 mb-4">
                  {discountInfo && discountInfo.amount > 0 ? (
                    <>
                      <div 
                        className="text-3xl font-bold"
                        style={{ color: primaryColor }}
                      >
                        {formatPrice(promotionFinalPrice || product.price)}
                      </div>
                      <div className="text-xl text-muted-foreground line-through">
                        {formatPrice(selectedVariant?.price || product.price)}
                      </div>
                    </>
                  ) : product.is_on_offer ? (
                    <>
                      <div 
                        className="text-3xl font-bold"
                        style={{ color: primaryColor }}
                      >
                        {formatPrice(product.offer_price!)}
                      </div>
                      <div className="text-xl text-muted-foreground line-through">
                        {formatPrice(product.price)}
                      </div>
                    </>
                  ) : (
                    <div 
                      className="text-3xl font-bold"
                      style={{ color: primaryColor }}
                    >
                      {formatPrice(getCurrentPrice())}
                    </div>
                  )}
                </div>
              </div>

              {/* Opções de Tamanho/Variantes */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium block">Opções:</label>
                  {loadingVariants ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {variants.map((variant) => (
                        <div
                          key={variant.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedVariant?.id === variant.id
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedVariant(variant)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                selectedVariant?.id === variant.id
                                  ? 'border-primary bg-primary'
                                  : 'border-gray-300'
                              }`}
                            />
                            <span className="font-medium">{variant.name}</span>
                          </div>
                          <span 
                            className="font-bold text-lg"
                            style={{ color: primaryColor }}
                          >
                            {formatPrice(variant.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Controle de Quantidade */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quantidade:</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-sm font-medium mb-2 block">Observações:</label>
                <Textarea
                  placeholder="Observações..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="min-h-20"
                />
              </div>

              {/* Total e Botões */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span style={{ color: primaryColor }}>
                    {formatPrice(getCurrentPrice() * quantity)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    style={{ 
                      backgroundColor: storeStatus && storeStatus.canAddToCart ? primaryColor : '#9ca3af',
                      opacity: storeStatus && storeStatus.canAddToCart ? 1 : 0.5
                    }}
                    className="flex-1 text-white hover:opacity-90"
                    disabled={storeStatus && !storeStatus.canAddToCart}
                  >
                    {storeStatus?.shouldShowSchedulingRequired 
                      ? '📅 Adicionar para Agendamento' 
                      : product.button_text || 'Adicionar à sacola'}
                  </Button>
                  {store.phone && (
                    <Button
                      onClick={sendWhatsAppMessage}
                      variant="outline"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                      className="hover:bg-primary/10"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Produtos Relacionados */}
          {relatedProducts.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Veja também</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.slice(0, 4).map((relatedProduct) => (
                  <Card 
                    key={relatedProduct.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onProductSelect(relatedProduct)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square bg-muted rounded-md overflow-hidden mb-3">
                        {relatedProduct.image_url ? (
                          <img
                            src={relatedProduct.image_url}
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <StoreIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h4>
                      <div 
                        className="text-sm font-bold"
                        style={{ color: primaryColor }}
                      >
                        {formatPrice(relatedProduct.price)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetail;