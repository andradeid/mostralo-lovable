import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Clock, MapPin, Phone, Mail, Instagram, 
  Package, Share2, Download, ExternalLink,
  MessageCircle, Car, LogIn
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Store {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  instagram?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

interface StoreInfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store;
  businessHours: any;
  customerName: string | null;
  primaryColor: string;
  onOpenAuth?: () => void;
}

export function StoreInfoDrawer({
  open,
  onOpenChange,
  store,
  businessHours,
  customerName,
  primaryColor,
  onOpenAuth
}: StoreInfoDrawerProps) {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const handleLogin = () => {
    onOpenChange(false);
    if (onOpenAuth) {
      onOpenAuth();
    }
  };

  useEffect(() => {
    // Detectar se já está instalado
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Capturar evento de instalação (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const formatBusinessHours = (hours: any) => {
    if (!hours) return [];
    
    const dayNames: Record<string, string> = {
      monday: "Seg",
      tuesday: "Ter",
      wednesday: "Qua",
      thursday: "Qui",
      friday: "Sex",
      saturday: "Sáb",
      sunday: "Dom"
    };
    
    const formatted: string[] = [];
    
    // Ordem correta dos dias da semana
    const orderedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    orderedDays.forEach((day) => {
      const info = hours[day];
      if (info) {
        if (info.closed) {
          formatted.push(`${dayNames[day]}: Fechado`);
        } else {
          formatted.push(`${dayNames[day]}: ${info.open} às ${info.close}`);
        }
      }
    });
    
    return formatted;
  };

  const openGoogleMaps = () => {
    // Priorizar latitude e longitude se disponíveis
    if (store.latitude && store.longitude) {
      const mapsUrl = `https://www.google.com/maps?q=${store.latitude},${store.longitude}`;
      window.open(mapsUrl, '_blank');
    } else if (store.address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const openWaze = () => {
    if (store.latitude && store.longitude) {
      const wazeUrl = `https://waze.com/ul?ll=${store.latitude},${store.longitude}&navigate=yes`;
      window.open(wazeUrl, '_blank');
    } else if (store.address) {
      const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(store.address)}`;
      window.open(wazeUrl, '_blank');
    }
  };

  const openUber = () => {
    if (store.latitude && store.longitude) {
      const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${store.latitude}&dropoff[longitude]=${store.longitude}`;
      window.open(uberUrl, '_blank');
    } else if (store.address) {
      const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(store.address)}`;
      window.open(uberUrl, '_blank');
    }
  };

  const openWhatsApp = () => {
    if (!store.phone) return;
    const phone = store.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}`, '_blank');
  };

  const openInstagram = () => {
    if (!store.instagram) return;
    window.open(store.instagram, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: store.name,
      text: `Confira ${store.name}! ${store.description || ''}`,
      url: window.location.href
    };

    // Tentar usar Web Share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Compartilhado com sucesso!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      }
    } else {
      // Fallback: copiar link
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência!');
      } catch (err) {
        toast.error('Não foi possível copiar o link');
      }
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App instalado com sucesso!');
      setDeferredPrompt(null);
    }
  };

  const hoursFormatted = formatBusinessHours(businessHours);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-[85vw] sm:max-w-sm overflow-y-auto"
      >
        <SheetHeader className="border-b pb-4" style={{ borderBottomColor: `${primaryColor}20` }}>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-left">Menu</SheetTitle>
            {!customerName && (
              <Button
                onClick={handleLogin}
                size="sm"
                style={{ backgroundColor: primaryColor }}
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="space-y-6 pt-6">
          {/* Meus Pedidos */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" style={{ color: primaryColor }} />
              Meus Pedidos
            </h3>
            {customerName ? (
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    navigate(`/painel-cliente/${store.id}`);
                    onOpenChange(false);
                  }}
                  className="w-full justify-start text-left"
                >
                  → Pedidos Abertos
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    navigate(`/painel-cliente/${store.id}`);
                    onOpenChange(false);
                  }}
                  className="w-full justify-start text-left"
                >
                  → Pedidos Finalizados
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Faça login para ver seus pedidos
              </p>
            )}
          </div>

          <Separator />

          {/* Horário de Funcionamento */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: primaryColor }} />
              Funcionamento
            </h3>
            {hoursFormatted.length > 0 ? (
              <div className="space-y-1 text-sm">
                {hoursFormatted.map((hour, index) => (
                  <p key={index} className="text-muted-foreground">{hour}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Horário não disponível
              </p>
            )}
          </div>

          <Separator />

          {/* Endereço */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              Endereço
            </h3>
            {store.address || (store.latitude && store.longitude) ? (
              <>
                <Button 
                  onClick={openGoogleMaps}
                  className="w-full mb-3"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Como Chegar (Google Maps)
                </Button>
                
                {/* Botões Waze e Uber lado a lado */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button 
                    onClick={openWaze}
                    className="w-full"
                    style={{ backgroundColor: '#00D9FF', color: '#FFFFFF' }}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Waze
                  </Button>
                  <Button 
                    onClick={openUber}
                    className="w-full"
                    style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Uber
                  </Button>
                </div>
                
                {store.address && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {store.address}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Endereço não disponível
              </p>
            )}
          </div>

          <Separator />

          {/* Contato */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5" style={{ color: primaryColor }} />
              Contato
            </h3>
            <div className="space-y-2">
              {store.phone && (
                <Button
                  onClick={openWhatsApp}
                  className="w-full justify-start"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp: {store.phone}
                </Button>
              )}
              {store.email && (
                <Button
                  variant="outline"
                  asChild
                  className="w-full justify-start"
                >
                  <a href={`mailto:${store.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    {store.email}
                  </a>
                </Button>
              )}
              {!store.phone && !store.email && (
                <p className="text-sm text-muted-foreground">
                  Contato não disponível
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Compartilhar */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Share2 className="w-5 h-5" style={{ color: primaryColor }} />
              Compartilhar
            </h3>
            <Button 
              onClick={handleShare}
              className="w-full"
              style={{ backgroundColor: primaryColor }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar Loja
            </Button>
          </div>

          {/* Baixar App PWA */}
          {!isStandalone && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5" style={{ color: primaryColor }} />
                  Baixar App
                </h3>
                
                {isIOS ? (
                  // Cards visuais para iOS
                  <div className="space-y-3">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                          style={{ backgroundColor: primaryColor, color: 'white' }}
                        >
                          1
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-1">Toque em Compartilhar</p>
                          <p className="text-sm text-muted-foreground">
                            Clique no botão <strong>↗️</strong> na barra inferior ou superior do Safari
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                          style={{ backgroundColor: primaryColor, color: 'white' }}
                        >
                          2
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-1">Adicionar à Tela Inicial</p>
                          <p className="text-sm text-muted-foreground">
                            Role para baixo e selecione <strong>"Adicionar à Tela Inicial"</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                          style={{ backgroundColor: primaryColor, color: 'white' }}
                        >
                          3
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-1">Confirmar</p>
                          <p className="text-sm text-muted-foreground">
                            Toque em <strong>"Adicionar"</strong> no canto superior direito
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : deferredPrompt ? (
                  // Botão para Android/Chrome
                  <Button 
                    onClick={handleInstallPWA}
                    className="w-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar Aplicativo
                  </Button>
                ) : (
                  // Mensagem se não disponível
                  <p className="text-sm text-muted-foreground">
                    Instalação de app não disponível neste navegador
                  </p>
                )}
                
                {/* Benefícios */}
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>✓ Acesso rápido na tela inicial</p>
                  <p>✓ Funciona offline</p>
                  <p>✓ Notificações de pedidos</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Redes Sociais */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Redes Sociais</h3>
            <div className="flex items-center justify-center gap-6">
              {store.phone && (
                <button
                  onClick={openWhatsApp}
                  className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="WhatsApp"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <MessageCircle className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <span className="text-xs text-muted-foreground">WhatsApp</span>
                </button>
              )}
              {store.instagram && (
                <button
                  onClick={openInstagram}
                  className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="Instagram"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Instagram className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Instagram</span>
                </button>
              )}
              {store.address && (
                <button
                  onClick={openGoogleMaps}
                  className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="Localização"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Localização</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
