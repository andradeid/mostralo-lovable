import { useState } from 'react';
import { MapPin, MessageCircle, Instagram, ChevronDown, ChevronUp, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    const username = store.instagram.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
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
          className="w-full flex items-center justify-between px-4 py-3 h-auto bg-muted/50 hover:bg-muted rounded-xl"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Navigation className="w-4 h-4 text-primary" />
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
        <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border">
          {/* Endereço */}
          {hasAddress && (
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{fullAddress}</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-primary mt-1 font-medium"
                    onClick={handleMapsClick}
                  >
                    Abrir no Maps
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="p-4 flex flex-col gap-2.5">
            {/* WhatsApp */}
            {hasWhatsapp && (
              <Button 
                variant="outline"
                className="w-full h-12 rounded-xl justify-start gap-3 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                onClick={handleWhatsAppClick}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </div>
                Conversar no WhatsApp
              </Button>
            )}

            {/* Instagram */}
            {hasInstagram && (
              <Button 
                variant="outline"
                className="w-full h-12 rounded-xl justify-start gap-3 text-sm font-medium hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700 transition-colors"
                onClick={handleInstagramClick}
              >
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <Instagram className="w-4 h-4 text-pink-600" />
                </div>
                Ver no Instagram
              </Button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
