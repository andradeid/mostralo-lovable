import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface StoreData {
  name: string;
  logo_url: string | null;
  address: string | null;
}

export default function NavigatePage() {
  const [searchParams] = useSearchParams();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingShortLink, setResolvingShortLink] = useState(false);
  
  // Parâmetros do link (podem vir diretamente ou de um short link)
  const [lat, setLat] = useState<string | null>(searchParams.get('lat'));
  const [lng, setLng] = useState<string | null>(searchParams.get('lng'));
  const [storeSlug, setStoreSlug] = useState<string | null>(searchParams.get('store'));
  const [address, setAddress] = useState<string | null>(searchParams.get('address'));
  
  // ID de short link
  const shortLinkId = searchParams.get('id');

  // Resolver short link se presente
  useEffect(() => {
    async function resolveShortLink() {
      if (!shortLinkId) return;
      
      setResolvingShortLink(true);
      try {
        const { data, error } = await supabase.functions.invoke('short-link', {
          body: { action: 'resolve', id: shortLinkId }
        });
        
        if (data?.success) {
          setLat(String(data.lat));
          setLng(String(data.lng));
          setStoreSlug(data.storeSlug);
          setAddress(data.address || null);
        }
      } catch (err) {
        console.error('Erro ao resolver short link:', err);
      } finally {
        setResolvingShortLink(false);
      }
    }

    resolveShortLink();
  }, [shortLinkId]);

  useEffect(() => {
    async function fetchStore() {
      if (!storeSlug) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('stores')
        .select('name, logo_url, address')
        .eq('slug', storeSlug)
        .single();

      if (data) {
        setStore(data);
        // Se não tiver endereço no parâmetro, usar o endereço da loja
        if (!address && data.address) {
          setAddress(data.address);
        }
      }
      setLoading(false);
    }

    fetchStore();
  }, [storeSlug, address]);

  const openGoogleMaps = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  const openWaze = () => {
    if (lat && lng) {
      window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
    }
  };

  const openUber = () => {
    if (lat && lng) {
      // Deep link do Uber com destino definido
      // O address pode vir encodado da URL ou plain do banco de dados
      const dropoffAddress = address || '';
      const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(store?.name || 'Destino')}&dropoff[formatted_address]=${encodeURIComponent(dropoffAddress)}`;
      window.open(uberUrl, '_blank');
    }
  };

  // Loading do short link
  if (resolvingShortLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Carregando...
            </h1>
            <p className="text-muted-foreground">
              Preparando sua navegação
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lat || !lng) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Localização não encontrada
            </h1>
            <p className="text-muted-foreground">
              Não foi possível carregar as coordenadas do endereço.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardContent className="pt-8 pb-8 px-6">
          {/* Logo e Nome da Loja */}
          <div className="text-center mb-6">
            {loading ? (
              <div className="h-16 w-16 rounded-full bg-muted animate-pulse mx-auto mb-3" />
            ) : store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-16 w-16 rounded-full object-cover mx-auto mb-3 border-2 border-primary/20"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Navigation className="h-8 w-8 text-primary" />
              </div>
            )}
            
            {store?.name && (
              <h2 className="text-lg font-semibold text-foreground mb-1">
                {store.name}
              </h2>
            )}
          </div>

          {/* Ícone de navegação */}
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-xl font-bold text-center text-foreground mb-2">
            Escolha como navegar
          </h1>
          <p className="text-center text-muted-foreground text-sm mb-4">
            Selecione o aplicativo de navegação
          </p>

          {/* Endereço de destino */}
          {address && (
            <div className="bg-muted/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Endereço de destino:
              </p>
              <p className="text-sm font-medium text-foreground">
                {address}
              </p>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="space-y-3">
            <Button
              onClick={openGoogleMaps}
              className="w-full h-14 text-base font-semibold bg-[#4285F4] hover:bg-[#3367D6] text-white"
            >
              <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Google Maps
              <ExternalLink className="h-4 w-4 ml-auto opacity-70" />
            </Button>

            <Button
              onClick={openWaze}
              className="w-full h-14 text-base font-semibold bg-[#33CCFF] hover:bg-[#00B2E8] text-white"
            >
              <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Waze
              <ExternalLink className="h-4 w-4 ml-auto opacity-70" />
            </Button>

            <Button
              onClick={openUber}
              className="w-full h-14 text-base font-semibold bg-[#000000] hover:bg-[#1a1a1a] text-white"
            >
              <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12.5h6v-2H3v2zm0 4h10v-2H3v2zm0-8h10v-2H3v2zm14 4.5v6h2v-6h6v-2h-6V5h-2v6H5v2h12z"/>
              </svg>
              Uber
              <ExternalLink className="h-4 w-4 ml-auto opacity-70" />
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Powered by Mostralo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
