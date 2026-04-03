import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingNavigationButtonsProps {
  latitude: number;
  longitude: number;
  storeName?: string;
  address?: string;
}

/**
 * Botões de navegação (Google Maps, Waze, Uber) para páginas de agendamento.
 * Reutiliza o mesmo padrão da NavigatePage.
 */
export function BookingNavigationButtons({ latitude, longitude, storeName, address }: BookingNavigationButtonsProps) {
  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  const openWaze = () => {
    window.open(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`, '_blank');
  };

  const openUber = () => {
    const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}&dropoff[nickname]=${encodeURIComponent(storeName || 'Destino')}&dropoff[formatted_address]=${encodeURIComponent(address || '')}`;
    window.open(uberUrl, '_blank');
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
        <Navigation className="h-4 w-4" />
        Como chegar
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openGoogleMaps}
          className="flex flex-col items-center gap-1 h-auto py-2.5 text-xs"
        >
          <svg className="h-5 w-5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Google Maps
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={openWaze}
          className="flex flex-col items-center gap-1 h-auto py-2.5 text-xs"
        >
          <svg className="h-5 w-5 text-[#33CCFF]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Waze
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={openUber}
          className="flex flex-col items-center gap-1 h-auto py-2.5 text-xs"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 12.5h6v-2H3v2zm0 4h10v-2H3v2zm0-8h10v-2H3v2zm14 4.5v6h2v-6h6v-2h-6V5h-2v6H5v2h12z"/>
          </svg>
          Uber
        </Button>
      </div>
    </div>
  );
}
