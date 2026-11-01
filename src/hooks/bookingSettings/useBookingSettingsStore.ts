// Dados da loja usados nas configurações de agendamento: localização, horário de
// funcionamento, slug/nome/tema e conta EFI (Pix pelo Mostralo).
// Código movido da BookingSettingsPage sem mudança (mesmas consultas e dependências).
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { depositCommissionPercent } from '../../../supabase/functions/_shared/booking-deposit';

export function useBookingSettingsStore(storeId: string | null) {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [storeLocation, setStoreLocation] = useState<{ latitude: number | null; longitude: number | null; address: string; business_hours: any; slug: string; name: string; theme_colors: any }>({
    latitude: null, longitude: null, address: '', business_hours: {}, slug: '', name: '', theme_colors: {}
  });
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  // Pix pelo Mostralo: precisa da conta EFI da loja ativa; taxa = comissão online da loja
  const [efiInfo, setEfiInfo] = useState<{ active: boolean; commission: number }>({ active: false, commission: depositCommissionPercent(null) });

  useEffect(() => {
    if (!storeId) return;
    const loadStore = async () => {
      setIsLoadingStore(true);
      const { data } = await supabase
        .from('stores')
        .select('latitude, longitude, address, business_hours, slug, name, theme_colors, efi_account_number, efi_account_status, online_payment_commission')
        .eq('id', storeId)
        .single();
      if (data) {
        setEfiInfo({
          active: !!data.efi_account_number && data.efi_account_status === 'active',
          commission: depositCommissionPercent(data.online_payment_commission),
        });
        setStoreLocation({
          latitude: data.latitude, longitude: data.longitude,
          address: data.address || '', business_hours: data.business_hours || {},
          slug: data.slug || '', name: data.name || '', theme_colors: data.theme_colors || {}
        });
      }
      setIsLoadingStore(false);
    };
    loadStore();
  }, [storeId]);

  const handleLocationSelect = async (lat: number, lng: number, address: string) => {
    if (!storeId) return;
    // Mantém o endereço digitado pelo lojista (com bloco/loja); o mapa só define o ponto
    const keepAddress = storeLocation.address?.trim() || address;
    setStoreLocation(prev => ({ ...prev, latitude: lat, longitude: lng, address: keepAddress }));
    setShowMapPicker(false);
    await supabase.from('stores').update({ latitude: lat, longitude: lng, address: keepAddress }).eq('id', storeId);
    toast.success('Localização atualizada!');
  };

  const handleBusinessHoursChange = async (hours: any) => {
    if (!storeId) return;
    setStoreLocation(prev => ({ ...prev, business_hours: hours }));
    await supabase.from('stores').update({ business_hours: hours }).eq('id', storeId);
  };

  return {
    showMapPicker, setShowMapPicker,
    storeLocation, setStoreLocation,
    isLoadingStore,
    efiInfo,
    handleLocationSelect,
    handleBusinessHoursChange,
  };
}
