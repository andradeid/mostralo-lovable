import { useState } from 'react';
import { MapPin, Phone, MessageCircle, Instagram, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatBrazilianPhone } from '@/lib/utils';
import { trackClick } from '@/utils/trackClick';

interface BookingStoreInfoProps {
  store: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
    google_maps_link?: string | null;
  };
  defaultExpanded?: boolean;
}

export const BookingStoreInfo = ({ store, defaultExpanded = false }: BookingStoreInfoProps) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const hasAddress = store.address || store.city;
  const hasWhatsapp = store.whatsapp;
  const hasInstagram = store.instagram;
  const hasAnyInfo = hasAddress || hasWhatsapp || hasInstagram;

  if (!hasAnyInfo) return null;

  const fullAddress = [store.address, store.city, store.state].filter(Boolean).join(', ');

  const handleWhatsAppClick = () => {
    if (!store.whatsapp) return;
    trackClick('click_whatsapp', 'booking-store-info');
    const phone = store.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleInstagramClick = () => {
    if (!store.instagram) return;
    const username = store.instagram.replace('@', '');
    window.open(`https://instagram.com/${username}`, '_blank');
  };

  const handleMapsClick = () => {
    if (store.google_maps_link) {
      window.open(store.google_maps_link, '_blank');
    } else if (fullAddress) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`, '_blank');
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-between px-4 py-3 h-auto bg-muted/50 hover:bg-muted rounded-lg"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Phone className="w-4 h-4 text-muted-foreground" />
            Informações de contato
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div className="bg-card border rounded-lg p-4 space-y-3">
          {/* Endereço */}
          {hasAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{fullAddress}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-primary"
                  onClick={handleMapsClick}
                >
                  Abrir no Maps
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* WhatsApp */}
          {hasWhatsapp && (
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <p className="text-sm text-foreground">
                  {formatBrazilianPhone(store.whatsapp!)}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleWhatsAppClick}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Mensagem
                </Button>
              </div>
            </div>
          )}

          {/* Instagram */}
          {hasInstagram && (
            <div className="flex items-center gap-3">
              <Instagram className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <p className="text-sm text-foreground">
                  {store.instagram!.startsWith('@') ? store.instagram : `@${store.instagram}`}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleInstagramClick}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Seguir
                </Button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
