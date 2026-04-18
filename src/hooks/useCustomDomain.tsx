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
    const hostname = window.location.hostname;

    // Lista de domínios internos do Mostralo — NUNCA bater no banco para esses
    const internalDomains = [
      'localhost',
      '127.0.0.1',
      'mostralo.me',
      'mostralo.app',
      'mostralo.com.br',
      'lovable.app',
      'lovable.dev',
      'lovableproject.com',
      'gptengineer.run',
      'webcontainer.io',
      'stackblitz.io',
      'codesandbox.io',
    ];

    const isInternal = internalDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    // Bypass IMEDIATO para domínios internos — não consulta o banco
    if (isInternal) {
      setResult({ storeSlug: null, isCustomDomain: false, isLoading: false });
      return;
    }

    // Só consulta o banco se for realmente um domínio externo
    const detectCustomDomain = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('slug')
          .eq('custom_domain', hostname)
          .eq('custom_domain_verified', true)
          .eq('status', 'active')
          .maybeSingle();

        if (error || !data) {
          setResult({ storeSlug: null, isCustomDomain: true, isLoading: false });
          return;
        }

        setResult({ storeSlug: data.slug, isCustomDomain: true, isLoading: false });
      } catch {
        setResult({ storeSlug: null, isCustomDomain: true, isLoading: false });
      }
    };

    detectCustomDomain();
  }, []);

  return result;
}
