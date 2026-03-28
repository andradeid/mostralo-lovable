import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Página de redirecionamento para short links genéricos (URLs)
 * Rota: /r/:id
 */
export default function ShortLinkRedirect() {
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      setError(true);
      return;
    }

    const resolve = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('short-link', {
          body: { action: 'resolve', id }
        });

        if (fnError || !data?.success) {
          setError(true);
          return;
        }

        // Se for um link de URL, redirecionar diretamente
        if (data.linkType === 'url' && data.targetUrl) {
          window.location.href = data.targetUrl;
          return;
        }

        // Se for um link de localização, redirecionar para a loja
        if (data.storeSlug && data.lat && data.lng) {
          window.location.href = `/loja/${data.storeSlug}?lat=${data.lat}&lng=${data.lng}`;
          return;
        }

        setError(true);
      } catch {
        setError(true);
      }
    };

    resolve();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Link não encontrado</h1>
          <p className="text-muted-foreground">Este link pode ter expirado ou não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
