import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapLocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  onClose: () => void;
}

export function MapLocationPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  onClose,
}: MapLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLat, setSelectedLat] = useState(initialLat || -15.7801);
  const [selectedLng, setSelectedLng] = useState(initialLng || -47.9292);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    const loadMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) {
          console.error('Erro ao buscar token:', error);
          toast.error('Erro ao carregar mapa. Configure o token MAPBOX_PUBLIC_TOKEN no Supabase.');
          return;
        }
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          toast.error('Token Mapbox não configurado. Adicione MAPBOX_PUBLIC_TOKEN nas secrets do Supabase.');
        }
      } catch (error) {
        console.error('Erro ao buscar token:', error);
        toast.error('Erro ao carregar configuração do mapa');
      }
    };
    loadMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [selectedLng, selectedLat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#3B82F6',
    })
      .setLngLat([selectedLng, selectedLat])
      .addTo(map.current);

    marker.current.on('dragend', () => {
      const lngLat = marker.current!.getLngLat();
      setSelectedLat(lngLat.lat);
      setSelectedLng(lngLat.lng);
      reverseGeocode(lngLat.lat, lngLat.lng);
    });

    map.current.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      setSelectedLat(lat);
      setSelectedLng(lng);
      marker.current?.setLngLat([lng, lat]);
      reverseGeocode(lat, lng);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!mapboxToken) return;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=pt`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        console.log('Endereço encontrado:', address);
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${mapboxToken}&language=pt&country=BR`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setSelectedLat(lat);
        setSelectedLng(lng);
        marker.current?.setLngLat([lng, lat]);
        map.current?.flyTo({ center: [lng, lat], zoom: 15 });
        reverseGeocode(lat, lng);
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!mapboxToken) {
      toast.error('Token Mapbox não configurado');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${selectedLng},${selectedLat}.json?access_token=${mapboxToken}&language=pt`
      );
      const data = await response.json();
      let address = '';
      if (data.features && data.features.length > 0) {
        address = data.features[0].place_name;
      }
      onLocationSelect(selectedLat, selectedLng, address);
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar localização:', error);
      onLocationSelect(selectedLat, selectedLng, '');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 bg-background rounded-lg shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Selecionar Localização
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 border-b space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
              className="flex-1"
            />
            <Button onClick={searchLocation} disabled={loading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Clique no mapa ou arraste o marcador para selecionar a localização
          </p>
        </div>

        <div ref={mapContainer} className="flex-1" />

        <div className="p-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            Confirmar Localização
          </Button>
        </div>
      </div>
    </div>
  );
}
