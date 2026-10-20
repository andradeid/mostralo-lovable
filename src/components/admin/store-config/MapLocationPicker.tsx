import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { getMapboxToken, searchAddresses, reverseGeocode, type AddressSuggestion } from '@/lib/mapbox';

interface MapLocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  /** Endereço já cadastrado: vem preenchido na busca e é pesquisado ao abrir (se ainda não há coordenadas). */
  initialQuery?: string;
  onClose: () => void;
}

export function MapLocationPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  initialQuery,
  onClose,
}: MapLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [selectedLat, setSelectedLat] = useState(initialLat || -15.7801);
  const [selectedLng, setSelectedLng] = useState(initialLng || -47.9292);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  // Endereço escolhido na lista de sugestões (vale mais que o reverse geocoding do ponto)
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const autoSearched = useRef(false);

  useEffect(() => {
    getMapboxToken()
      .then(setMapboxToken)
      .catch((error) => {
        console.error('Erro ao buscar token:', error);
        toast.error('Erro ao carregar o mapa. Tente novamente.');
      });
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [selectedLng, selectedLat],
      zoom: initialLat ? 16 : 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    // O mapa abre dentro de uma janela que ainda está animando: sem isso ele fica cinza
    map.current.on('load', () => map.current?.resize());
    setTimeout(() => map.current?.resize(), 300);

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
      setPickedLabel(null);
    });

    map.current.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      setSelectedLat(lat);
      setSelectedLng(lng);
      setPickedLabel(null);
      marker.current?.setLngLat([lng, lat]);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const goTo = (s: AddressSuggestion) => {
    setSelectedLat(s.latitude);
    setSelectedLng(s.longitude);
    setPickedLabel(s.label);
    setSuggestions([]);
    marker.current?.setLngLat([s.longitude, s.latitude]);
    map.current?.flyTo({ center: [s.longitude, s.latitude], zoom: 16 });
  };

  const searchLocation = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;

    setLoading(true);
    try {
      // Prioriza resultados perto do ponto atual (loja / Brasília) em vez do Brasil inteiro
      const results = await searchAddresses(searchQuery, mapboxToken, { latitude: selectedLat, longitude: selectedLng });
      if (results.length === 0) {
        toast.error('Endereço não encontrado. Tente com quadra e bairro, ou clique no mapa.');
      } else if (results.length === 1) {
        goTo(results[0]);
      } else {
        setSuggestions(results);
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loja ainda sem coordenadas, mas com endereço digitado: já busca ao abrir
  useEffect(() => {
    if (!mapboxToken || autoSearched.current || initialLat || !initialQuery?.trim()) return;
    autoSearched.current = true;
    searchLocation();
  }, [mapboxToken]);

  const handleConfirm = async () => {
    if (!mapboxToken) {
      toast.error('Token Mapbox não configurado');
      return;
    }
    setLoading(true);
    try {
      const address = pickedLabel || (await reverseGeocode(selectedLat, selectedLng, mapboxToken)) || '';
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
          {suggestions.length > 0 && (
            <div className="border rounded-md divide-y max-h-56 overflow-y-auto bg-background">
              {suggestions.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => goTo(sug)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-start gap-2"
                >
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Busque o endereço e escolha na lista, ou clique no mapa e arraste o marcador até a porta da loja
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
