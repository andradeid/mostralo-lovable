import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomDomainResult {
  storeSlug: string | null;
  isCustomDomain: boolean;
  isLoading: boolean;
}

export function useCustomDomain(): CustomDomainResult {
  const [result, setResult] = useState<CustomDomainResult>({
    storeSlug: null,
    isCustomDomain: false,
    isLoading: true,
  });

  useEffect(() => {
    const detectCustomDomain = async () => {
      const hostname = window.location.hostname;
      
      // Lista de domínios internos do Mostralo
      const internalDomains = [
        'localhost',
        '127.0.0.1',
        'mostralo.me',
        'mostralo.app',
        'mostralo.com.br',
        'lovable.app',
        'lovable.dev',
      ];

      // Verificar se é um domínio interno
      const isInternal = internalDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (isInternal) {
        setResult({
          storeSlug: null,
          isCustomDomain: false,
          isLoading: false,
        });
        return;
      }

      // É um domínio personalizado, buscar loja correspondente
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('slug')
          .eq('custom_domain', hostname)
          .eq('custom_domain_verified', true)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar loja por domínio personalizado:', error);
          setResult({
            storeSlug: null,
            isCustomDomain: true,
            isLoading: false,
          });
          return;
        }

        if (data) {
          console.log(`✅ Domínio personalizado detectado: ${hostname} → loja: ${data.slug}`);
          setResult({
            storeSlug: data.slug,
            isCustomDomain: true,
            isLoading: false,
          });
        } else {
          console.warn(`⚠️ Domínio personalizado ${hostname} não encontrado ou não verificado`);
          setResult({
            storeSlug: null,
            isCustomDomain: true,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Erro ao detectar domínio personalizado:', error);
        setResult({
          storeSlug: null,
          isCustomDomain: true,
          isLoading: false,
        });
      }
    };

    detectCustomDomain();
  }, []);

  return result;
}
