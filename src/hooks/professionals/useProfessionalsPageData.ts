// Dados de apoio da tela de Profissionais: slug da loja (links), serviços de cada
// profissional e nome da loja (mensagem de boas-vindas/convite).
// Código movido da ProfessionalsPage sem mudança (mesmas consultas e dependências).
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Professional } from '@/hooks/useBooking';
import { buildProfessionalServicesMap } from '@/lib/professionals/professionalsList';

export function useProfessionalStoreSlug(storeId: string | null) {
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  // Fetch store slug for booking link
  useEffect(() => {
    const fetchStoreSlug = async () => {
      if (!storeId) return;
      const { data } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single();
      if (data) setStoreSlug(data.slug);
    };
    fetchStoreSlug();
  }, [storeId]);

  const copyBookingLink = (professional: Professional) => {
    if (!storeSlug) return;
    const professionalSlug = professional.slug || professional.id;
    const url = `${window.location.origin}/agendar/${storeSlug}?profissional=${professionalSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!', { description: 'Cole e compartilhe com o cliente' });
  };

  return { storeSlug, copyBookingLink };
}

export function useProfessionalServicesMap(professionals: Professional[], storeId: string | null) {
  const [professionalServices, setProfessionalServices] = useState<Record<string, { id: string; name: string }[]>>({});

  // Buscar serviços vinculados a cada profissional
  useEffect(() => {
    const fetchProfessionalServices = async () => {
      if (!professionals.length || !storeId) return;

      const ids = professionals.map(p => p.id);
      
      const { data, error } = await supabase
        .from('professional_services')
        .select(`
          professional_id,
          service:booking_services(id, name)
        `)
        .in('professional_id', ids);

      if (error) {
        console.error('Error fetching professional services:', error);
        return;
      }

      const servicesMap = buildProfessionalServicesMap(data);

      setProfessionalServices(servicesMap);
    };

    fetchProfessionalServices();
  }, [professionals, storeId]);

  return professionalServices;
}

export function useProfessionalStoreName(storeId: string | null) {
  const [storeName, setStoreName] = useState('');

  // Fetch store name for welcome message
  const fetchStoreName = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase.from('stores').select('name').eq('id', storeId).single();
    if (data?.name) setStoreName(data.name);
  }, [storeId]);

  // Mantido como estava: roda só no primeiro render (ver relatório).
  useState(() => {
    fetchStoreName();
  });

  return storeName;
}
