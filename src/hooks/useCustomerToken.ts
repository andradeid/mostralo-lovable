import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorage } from '@/lib/safeStorage';

/**
 * Hook que detecta ?ct=TOKEN na URL, resolve via Edge Function
 * e salva o perfil do cliente no localStorage com chave customer_{storeId}.
 * 
 * Também tenta resolver um token já salvo no localStorage ao carregar a página.
 */
export function useCustomerToken(storeId: string | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!storeId || resolvedRef.current) return;

    const urlToken = searchParams.get('ct');
    const storageKey = `customer_${storeId}`;

    const resolveToken = async (token: string, source: 'url' | 'storage') => {
      try {
        console.log(`[CustomerToken] Resolvendo token (${source})...`);

        const { data, error } = await supabase.functions.invoke('customer-auth-v2', {
          body: {
            action: 'resolve-token',
            token,
            store_id: storeId,
          },
        });

        if (error || data?.error) {
          console.warn(`[CustomerToken] Token inválido (${source}):`, error || data?.error);
          if (source === 'storage') {
            // Token salvo expirou sem regeneração → limpar
            safeLocalStorage.removeItem(storageKey);
          }
          return false;
        }

        // Salvar perfil no localStorage
        const profile = {
          customer_id: data.customer.id,
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email,
          address: data.customer.address,
          latitude: data.customer.latitude,
          longitude: data.customer.longitude,
          token: data.token,
          expires_at: data.expires_at,
          saved_at: new Date().toISOString(),
        };

        safeLocalStorage.setItem(storageKey, JSON.stringify(profile));
        console.log(`[CustomerToken] Perfil salvo para ${data.customer.name}`);

        // Emitir evento para atualizar UI
        window.dispatchEvent(
          new CustomEvent('customerProfileUpdated', { detail: profile })
        );

        resolvedRef.current = true;
        return true;
      } catch (err) {
        console.error('[CustomerToken] Erro ao resolver token:', err);
        return false;
      }
    };

    const init = async () => {
      // Prioridade 1: Token na URL
      if (urlToken) {
        await resolveToken(urlToken, 'url');
        // Limpar ?ct= da URL sem recarregar
        searchParams.delete('ct');
        setSearchParams(searchParams, { replace: true });
        return;
      }

      // Prioridade 2: Token salvo no localStorage
      const saved = safeLocalStorage.getItem(storageKey);
      if (saved) {
        try {
          const profile = JSON.parse(saved);
          if (profile.token) {
            await resolveToken(profile.token, 'storage');
          }
        } catch {
          // JSON inválido → ignorar
        }
      }
    };

    init();
  }, [storeId, searchParams, setSearchParams]);
}
