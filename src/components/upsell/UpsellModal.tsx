import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useUpsell } from '@/hooks/useUpsell';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  type CarouselApi 
} from '@/components/ui/carousel';

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
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
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
      setLoadingUpsells(false);
      setCarouselApi(undefined);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [open]);

  // Sincronizar índice do carousel e registrar impressões
  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      const newIndex = carouselApi.selectedScrollSnap();
      setCurrentIndex(newIndex);
      // Registrar impressão do novo upsell visualizado
      if (upsellProducts[newIndex]) {
        recordImpression(upsellProducts[newIndex].id);
      }
    };
    
    carouselApi.on('select', onSelect);
    return () => { carouselApi.off('select', onSelect); };
  }, [carouselApi, upsellProducts, recordImpression]);

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
        <DialogContent 
          className="w-[85%] max-w-[340px] p-0 rounded-3xl border-4 overflow-hidden"
          style={{ borderColor: themeColor }}
        >
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-background">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: themeColor }} />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Se não tem upsell após carregar, não mostrar nada
  if (!currentUpsell) {
    return null;
  }

  const handleAccept = (upsell: UpsellProduct) => {
    const price = upsell.upsell_price ?? upsell.product.price;
    recordAccepted(upsell.id, price);
    onAccept({
      id: upsell.product.id,
      name: upsell.product.name,
      price: price,
      image_url: upsell.product.image_url,
      quantity: 1
    });
    onOpenChange(false);
  };

  const handleDecline = (upsell: UpsellProduct) => {
    recordRejected(upsell.id);
    
    // Se há mais upsells, avança para o próximo
    if (currentIndex < upsellProducts.length - 1) {
      carouselApi?.scrollNext();
    } else {
      // Último upsell - fecha o modal
      onDecline();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[85%] max-w-[340px] p-0 rounded-3xl border-4 overflow-hidden animate-fade-in"
        style={{ borderColor: themeColor }}
      >
        <Carousel setApi={setCarouselApi} opts={{ loop: false }}>
          <CarouselContent className="-ml-0">
            {upsellProducts.map((upsell) => {
              const price = upsell.upsell_price ?? upsell.product.price;
              return (
                <CarouselItem key={upsell.id} className="pl-0">
                  {/* Imagem do Produto */}
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {upsell.product.image_url ? (
                      <img
                        src={upsell.product.image_url}
                        alt={upsell.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-muted-foreground text-4xl">🍽️</span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-6 bg-background text-center">
                    <p className="text-lg font-semibold text-foreground mb-6">
                      Deseja adicionar {upsell.product.name} por mais {formatCurrency(price)}?
                    </p>
                    
                    {/* Botões lado a lado */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAccept(upsell)}
                        className="flex-1 py-6 text-lg font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white"
                      >
                        Sim
                      </Button>
                      <Button
                        onClick={() => handleDecline(upsell)}
                        className="flex-1 py-6 text-lg font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white"
                      >
                        Não
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* Indicadores de página (dots) - só aparece se tiver mais de 1 upsell */}
        {upsellProducts.length > 1 && (
          <div className="flex justify-center gap-2 pb-4 bg-background">
            {upsellProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentIndex 
                    ? "bg-primary" 
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
