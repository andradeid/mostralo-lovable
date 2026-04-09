import { MapPin, Store as StoreIcon, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingStoreHeaderProps {
  store: {
    name: string;
    logo_url?: string | null;
    cover_url?: string | null;
    description?: string | null;
    city?: string | null;
    state?: string | null;
    segment?: string | null;
    business_hours?: any;
    whatsapp?: string | null;
    instagram?: string | null;
    address?: string | null;
    google_maps_link?: string | null;
  };
}

// Helper to check if store is currently open
const getStoreStatus = (businessHours: any) => {
  if (!businessHours) return null;
  
  const now = new Date();
  const dayMap: Record<number, string> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
    4: 'thursday', 5: 'friday', 6: 'saturday'
  };
  const todayKey = dayMap[now.getDay()];
  const todayHours = businessHours[todayKey];
  
  if (!todayHours || todayHours.closed) {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextDay = dayMap[(now.getDay() + i) % 7];
      const nextHours = businessHours[nextDay];
      if (nextHours && !nextHours.closed && nextHours.open) {
        const dayNames: Record<string, string> = {
          sunday: 'Domingo', monday: 'Segunda', tuesday: 'Terça',
          wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado'
        };
        return { isOpen: false, message: `Abre ${dayNames[nextDay]} às ${nextHours.open}` };
      }
    }
    return { isOpen: false, message: 'Fechado' };
  }
  
  if (todayHours.open && todayHours.close) {
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);
    
    if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
      return { isOpen: true, message: `Fecha às ${todayHours.close}` };
    } else if (nowMinutes < openMinutes) {
      return { isOpen: false, message: `Abre às ${todayHours.open}` };
    } else {
      return { isOpen: false, message: 'Fechado hoje' };
    }
  }
  
  return null;
};

export const BookingStoreHeader = ({ store }: BookingStoreHeaderProps) => {
  const hasLocation = store.city || store.state;
  const locationText = [store.city, store.state].filter(Boolean).join(', ');
  const storeStatus = getStoreStatus(store.business_hours);

  const handleWhatsAppClick = () => {
    if (!store.whatsapp) return;
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
    } else {
      const address = [store.address, store.city, store.state].filter(Boolean).join(', ');
      if (address) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
      }
    }
  };

  return (
    <div className="relative">
      {/* Banner - Cover or Gradient */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        {store.cover_url ? (
          <>
            <img 
              src={store.cover_url} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-primary/60" />
        )}
      </div>

      {/* Content block with floating logo */}
      <div className="relative px-4 pb-4">
        {/* Floating Logo */}
        <div className="flex justify-center -mt-12">
          <div className={cn(
            "w-24 h-24 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center",
            "bg-card border-4 border-background shadow-xl"
          )}>
            {store.logo_url ? (
              <img 
                src={store.logo_url} 
                alt={store.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <StoreIcon className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Store Info - Centered */}
        <div className="text-center mt-3">
          <h1 className="text-xl font-bold text-foreground">{store.name}</h1>

          {/* Status */}
          {storeStatus && (
            <div className="flex items-center justify-center gap-1.5 mt-1.5">
              <span className={cn(
                "w-2 h-2 rounded-full",
                storeStatus.isOpen ? "bg-emerald-500" : "bg-red-500"
              )} />
              <span className="text-sm text-muted-foreground">
                {storeStatus.isOpen ? 'Aberto agora' : 'Fechado'}
                {storeStatus.message && (
                  <span className="text-muted-foreground"> • {storeStatus.message}</span>
                )}
              </span>
            </div>
          )}

          {/* Location */}
          {hasLocation && (
            <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {locationText}
            </p>
          )}

          {/* Description */}
          {store.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-md mx-auto">
              {store.description}
            </p>
          )}
        </div>

        {/* Quick Action Buttons */}
        {(store.whatsapp || hasLocation || store.instagram) && (
          <div className="flex items-center justify-center gap-3 mt-4">
            {store.whatsapp && (
              <button
                onClick={handleWhatsAppClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
            )}
            {(hasLocation || store.google_maps_link) && (
              <button
                onClick={handleMapsClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors border border-border"
              >
                <MapPin className="w-4 h-4" />
                Como chegar
              </button>
            )}
            {store.instagram && (
              <button
                onClick={handleInstagramClick}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors border border-pink-200"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
