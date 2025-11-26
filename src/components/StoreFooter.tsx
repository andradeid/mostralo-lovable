import { 
  MapPin, 
  MessageCircle,
  Instagram
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
  slug?: string;
  theme_colors: any;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
  };
}

interface StoreFooterProps {
  store: Store;
}

export function StoreFooter({ store }: StoreFooterProps) {
  const primaryColor = store?.configuration?.primary_color || store?.theme_colors?.primary || '#3B82F6';

  return (
    <>
      {/* Rodapé da Loja */}
      <footer 
        className="text-white px-4 py-6 md:py-8 mt-12"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-[1080px] mx-auto">
          {/* Endereço centralizado */}
          {store?.address && (
            <div className="text-center mb-4 md:mb-5">
              <p className="text-sm md:text-base font-medium leading-relaxed">
                {store.address}
              </p>
            </div>
          )}
          
          {/* Ícones de redes sociais */}
          <div className="flex items-center justify-center gap-6 md:gap-8 mb-4 md:mb-5">
            {/* WhatsApp */}
            {store?.phone && (
              <a
                href={`https://wa.me/${store.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
              </a>
            )}
            
            {/* Instagram */}
            {store?.instagram && (
              <a
                href={store.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 md:w-7 md:h-7" />
              </a>
            )}
            
            {/* Localização (Google Maps) */}
            {store?.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                aria-label="Localização no mapa"
              >
                <MapPin className="w-6 h-6 md:w-7 md:h-7" />
              </a>
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