import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Navigation } from 'lucide-react';

interface CustomerMapProps {
  latitude: number;
  longitude: number;
  customerName: string;
  compact?: boolean;
}

export const CustomerMap = ({ latitude, longitude, customerName, compact = false }: CustomerMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferredApp, setPreferredApp] = useState<'google_maps' | 'waze'>('google_maps');

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current) return;

      try {
        // Buscar preferência de navegação
        const { data: storeData } = await supabase
          .from('stores')
          .select('preferred_navigation_app')
          .limit(1)
          .single();
        
        if (storeData?.preferred_navigation_app) {
          setPreferredApp(storeData.preferred_navigation_app as 'google_maps' | 'waze');
        }

        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;

        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [longitude, latitude],
          zoom: compact ? 13 : 15,
          interactive: !compact,
        });

        new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>${customerName}</strong>`))
          .addTo(map.current);

        if (!compact) {
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar mapa:', error);
        setLoading(false);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, customerName, compact]);

  const openInGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      '_blank'
    );
  };

  const openInWaze = () => {
    window.open(
      `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
      '_blank'
    );
  };

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className={`rounded-lg overflow-hidden ${
          compact ? 'h-[250px]' : 'h-[400px]'
        } w-full`}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </div>
  );
};
