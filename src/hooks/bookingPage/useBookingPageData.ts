// Dados da loja na página pública de agendamento: loja, serviços, profissionais e quem faz
// cada serviço (professional_services), além do canal "agendamento" ligado/pausado.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCheckSalesChannel } from '@/hooks/useCheckSalesChannel';
import type { BookingService, Professional, ProfessionalServiceLink, StoreInfo } from '@/lib/bookingPage/types';

export function useBookingPageData(storeSlug: string | null | undefined) {
  // Store data
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [hasShop, setHasShop] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  // Quais profissionais fazem cada serviço (professional_services)
  const [professionalServices, setProfessionalServices] = useState<ProfessionalServiceLink[]>([]);

  // Check if booking channel is enabled
  const { isEnabled: isBookingEnabled, isLoading: isCheckingChannel, message: channelMessage } = useCheckSalesChannel(store?.id, 'booking_enabled');

  // Fetch store and services data
  useEffect(() => {
    const fetchData = async () => {
      if (!storeSlug) return;

      setLoading(true);
      try {
        // Fetch store
        const { data: storeData, error: storeError } = await supabase
          .from('public_stores')
          .select('id, name, logo_url, slug, address, city, state, phone, whatsapp, description, cover_url, instagram, google_maps_link, segment, latitude, longitude, business_hours')
          .eq('slug', storeSlug)
          .maybeSingle();

        if (storeError || !storeData) {
          toast.error('Estabelecimento não encontrado');
          return;
        }

        setStore(storeData);

        // Loja que também vende produtos: mostra o botão "Loja" no cabeçalho
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('is_available', true)
          .then(({ count }) => setHasShop((count ?? 0) > 0));

        // Fetch services using raw query (tables not in types yet)
        const client = supabase as unknown as {
          from: (table: string) => {
            select: (columns: string) => {
              eq: (col: string, val: string) => {
                eq: (col: string, val: boolean) => {
                  order: (col: string, opts: { ascending: boolean }) => Promise<{ data: BookingService[] | null; error: Error | null }>;
                };
              };
            };
          };
        };

        const servicesResult = await client
          .from('booking_services')
          .select('id, name, description, duration_minutes, price, price_type, category_id, image_url, requires_deposit, deposit_amount, deposit_percentage')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (servicesResult.data) {
          setServices(servicesResult.data);
        }

        // Fetch professionals
        const profsResult = await client
          .from('professionals')
          .select('id, name, slug, photo_url, specialty')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true }) as unknown as { data: Professional[] | null };

        if (profsResult.data) {
          setProfessionals(profsResult.data);
          const profIds = profsResult.data.map(p => p.id);
          if (profIds.length > 0) {
            const { data: links } = await (supabase as any)
              .from('professional_services')
              .select('professional_id, service_id')
              .in('professional_id', profIds)
              .eq('is_active', true);
            setProfessionalServices(links || []);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeSlug]);

  return {
    store,
    hasShop,
    services,
    professionals,
    professionalServices,
    loading,
    isBookingEnabled,
    isCheckingChannel,
    channelMessage,
  };
}
