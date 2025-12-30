import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Minus, Loader2 } from 'lucide-react';
import { useUpsell } from '@/hooks/useUpsell';
import { formatCurrency } from '@/lib/utils';

interface UpsellProduct {
  id: string;
  upsell_product_id: string;
  upsell_price: number | null;
  priority: number;
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  };
}

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  triggerProductId: string;
  onAccept: (product: { 
    id: string; 
    name: string; 
    price: number; 
    image_url: string | null;
    quantity: number;
  }) => void;
  onDecline: () => void;
  themeColor?: string;
  mode?: 'public' | 'admin';
}

export function UpsellModal({
  open,
  onOpenChange,
  storeId,
  triggerProductId,
  onAccept,
  onDecline,
  themeColor = '#f97316',
  mode = 'public',
}: UpsellModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);
  const hasLoadedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    fetchUpsells, 
    fetchUpsellsPublic,
    recordImpression, 
    recordAccepted, 
    recordRejected, 
    hasAccess,
    modulesLoading 
  } = useUpsell(storeId);

  // Resetar estados quando o modal fecha
  useEffect(() => {
    if (!open) {
      hasLoadedRef.current = false;
      setUpsellProducts([]);
      setCurrentIndex(0);
      setQuantity(1);
      setLoadingUpsells(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [open]);

  // Carregar upsells - usar ref para garantir execução única
  useEffect(() => {
    if (!open) return;
    if (hasLoadedRef.current) return;
    
    // Modo público: não espera modulesLoading, vai direto
    // Modo admin: espera módulos carregarem para verificar hasAccess
    if (mode === 'admin') {
      if (modulesLoading) return;
      
      hasLoadedRef.current = true;
      
      if (!hasAccess) {
        console.log('❌ UpsellModal: Sem acesso ao módulo upsell (admin)');
        onDecline();
        onOpenChange(false);
        return;
      }
    } else {
      // Modo público - não verifica hasAccess
      hasLoadedRef.current = true;
    }
    
    console.log('✅ UpsellModal: Carregando upsells...', { mode });
    loadUpsells();
  }, [open, modulesLoading, mode]);

  const loadUpsells = async () => {
    setLoadingUpsells(true);
    
    // Timeout de segurança (6 segundos)
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutRef.current = setTimeout(() => {
        console.warn('⏱️ UpsellModal: Timeout ao carregar upsells');
        resolve(null);
      }, 6000);
    });
    
    try {
      console.log('📦 UpsellModal: Buscando upsells para produto:', triggerProductId);
      
      // Usar fetch público no modo public, fetch normal no admin
      const fetchFn = mode === 'public' ? fetchUpsellsPublic : fetchUpsells;
      
      const result = await Promise.race([
        fetchFn(triggerProductId),
        timeoutPromise
      ]);
      
      // Limpar timeout se completou antes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Timeout ou erro
      if (result === null) {
        console.log('⏱️ UpsellModal: Fechando por timeout');
        onDecline();
        onOpenChange(false);
        return;
      }
      
      const upsells = result;
      console.log('📦 UpsellModal: Upsells encontrados:', upsells.length);
      
      setUpsellProducts(upsells);
      setCurrentIndex(0);
      setQuantity(1);
      
      // Se não há upsells, fechar o modal graciosamente
      if (upsells.length === 0) {
        console.log('ℹ️ UpsellModal: Nenhum upsell configurado');
        onDecline();
        onOpenChange(false);
        return;
      }
      
      // Registrar impressão do primeiro upsell
      recordImpression(upsells[0].id);
    } catch (err) {
      console.error('❌ UpsellModal: Erro ao carregar upsells:', err);
      onDecline();
      onOpenChange(false);
    } finally {
      setLoadingUpsells(false);
    }
  };

  const currentUpsell = upsellProducts[currentIndex];
  
  // Mostrar loader - no modo público só depende de loadingUpsells
  const isLoading = mode === 'public' ? loadingUpsells : (modulesLoading || loadingUpsells);
  
  if (open && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm max-h-[70vh] p-0">
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: themeColor }} />
            <span className="text-xs text-muted-foreground">Carregando...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Se não tem upsell após carregar, não mostrar nada
  if (!currentUpsell) {
    return null;
  }

  const finalPrice = currentUpsell.upsell_price ?? currentUpsell.product.price;
  const hasDiscount = currentUpsell.upsell_price !== null && currentUpsell.upsell_price < currentUpsell.product.price;
  const totalPrice = finalPrice * quantity;

  const handleNext = () => {
    if (currentIndex < upsellProducts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setQuantity(1);
      recordImpression(upsellProducts[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setQuantity(1);
    }
  };

  const handleAccept = () => {
    recordAccepted(currentUpsell.id, totalPrice);
    onAccept({
      id: currentUpsell.product.id,
      name: currentUpsell.product.name,
      price: finalPrice,
      image_url: currentUpsell.product.image_url,
      quantity
    });
    onOpenChange(false);
  };

  const handleDecline = () => {
    recordRejected(currentUpsell.id);
    onDecline();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[75vh] p-0 gap-0 overflow-hidden animate-fade-in">
        <DialogHeader className="p-3 pb-1">
          <DialogTitle className="text-center text-sm font-medium">
            Que tal adicionar?
          </DialogTitle>
        </DialogHeader>

        {/* Product Image */}
        <div className="relative aspect-video max-h-[25vh] bg-muted overflow-hidden">
          {currentUpsell.product.image_url ? (
            <img
              src={currentUpsell.product.image_url}
              alt={currentUpsell.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-2xl">🍽️</span>
            </div>
          )}
          
          {/* Navigation arrows */}
          {upsellProducts.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === upsellProducts.length - 1}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {/* Pagination dots */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                {upsellProducts.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2 overflow-y-auto">
          <div className="text-center">
            <h3 className="font-semibold text-sm">{currentUpsell.product.name}</h3>
            {currentUpsell.product.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {currentUpsell.product.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="text-center">
            {hasDiscount ? (
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground line-through">
                  De {formatCurrency(currentUpsell.product.price)}
                </span>
                <div className="text-lg font-bold" style={{ color: themeColor }}>
                  Por {formatCurrency(finalPrice)}
                </div>
              </div>
            ) : (
              <div className="text-lg font-bold" style={{ color: themeColor }}>
                {formatCurrency(finalPrice)}
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="p-1.5 rounded-md border border-border hover:bg-muted"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-base font-semibold w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="p-1.5 rounded-md text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Total */}
          {quantity > 1 && (
            <div className="text-center text-xs text-muted-foreground">
              Total: <span className="font-semibold">{formatCurrency(totalPrice)}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-1.5 pt-1">
            <Button
              onClick={handleAccept}
              className="w-full py-3 text-sm font-semibold"
              style={{ backgroundColor: themeColor }}
            >
              Adicionar {formatCurrency(totalPrice)}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDecline}
              className="w-full text-xs text-muted-foreground py-2"
            >
              Não, obrigado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
