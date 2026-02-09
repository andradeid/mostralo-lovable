import { 
  MapPin, 
  MessageCircle,
  Instagram,
  Phone,
  Mail,
  Clock,
  Car
} from 'lucide-react';
import { DashboardFooter } from '@/components/admin/DashboardFooter';

interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  phone?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  email?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  theme_colors: any;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
  };
}

interface StoreFooterProps {
  store: Store;
  businessHours?: any;
}

function formatBusinessHours(hours: any): string[] {
  if (!hours) return [];
  const dayNames: Record<string, string> = {
    monday: "Seg", tuesday: "Ter", wednesday: "Qua",
    thursday: "Qui", friday: "Sex", saturday: "Sáb", sunday: "Dom"
  };
  const formatted: string[] = [];
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
}

export function StoreFooter({ store, businessHours }: StoreFooterProps) {
  const primaryColor = store?.configuration?.primary_color || store?.theme_colors?.primary || '#3B82F6';
  const hoursFormatted = formatBusinessHours(businessHours);

  const hasContact = store?.phone || store?.email;
  const hasAddress = store?.address || (store?.latitude && store?.longitude);
  const hasSocial = store?.phone || store?.instagram;
  const hasHours = hoursFormatted.length > 0;

  const openGoogleMaps = () => {
    if (store.latitude && store.longitude) {
      window.open(`https://www.google.com/maps?q=${store.latitude},${store.longitude}`, '_blank');
    } else if (store.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`, '_blank');
    }
  };

  const openWaze = () => {
    if (store.latitude && store.longitude) {
      window.open(`https://waze.com/ul?ll=${store.latitude},${store.longitude}&navigate=yes`, '_blank');
    } else if (store.address) {
      window.open(`https://waze.com/ul?q=${encodeURIComponent(store.address)}`, '_blank');
    }
  };

  const openUber = () => {
    if (store.latitude && store.longitude) {
      window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${store.latitude}&dropoff[longitude]=${store.longitude}`, '_blank');
    } else if (store.address) {
      window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(store.address)}`, '_blank');
    }
  };

  return (
    <>
      {/* Rodapé Informativo da Loja */}
      <footer 
        className="text-white px-4 py-8 md:py-12 mt-12"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-[1080px] mx-auto">
          {/* Grid informativo - responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            
            {/* Redes Sociais */}
            {hasSocial && (
              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  Redes Sociais
                </h4>
                <div className="flex items-center gap-4">
                  {store.phone && (
                    <a
                      href={`https://wa.me/55${store.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  )}
                  {store.instagram && (
                    <a
                      href={store.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Contato */}
            {hasContact && (
              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contato
                </h4>
                <div className="space-y-2 text-sm text-white/80">
                  {store.phone && (
                    <a 
                      href={`https://wa.me/55${store.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      {store.phone}
                    </a>
                  )}
                  {store.email && (
                    <a 
                      href={`mailto:${store.email}`}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      {store.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Endereço */}
            {hasAddress && (
              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </h4>
                {store.address && (
                  <p className="text-sm text-white/80 mb-3 leading-relaxed">
                    {store.address}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={openGoogleMaps}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Maps
                  </button>
                  <button
                    onClick={openWaze}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Waze
                  </button>
                  <button
                    onClick={openUber}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Uber
                  </button>
                </div>
              </div>
            )}

            {/* Horários */}
            {hasHours && (
              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Funcionamento
                </h4>
                <div className="space-y-1 text-sm text-white/80">
                  {hoursFormatted.map((hour, index) => (
                    <p key={index}>{hour}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Copyright */}
          <div className="border-t border-white/20 pt-4 text-center">
            <p className="text-xs md:text-sm text-white/80">
              © 2025 {store?.name}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Dashboard Footer */}
      <DashboardFooter />
    </>
  );
}
