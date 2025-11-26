import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateDeliveryLocation, type DeliveryZone, type ZoneValidationResult } from '@/utils/deliveryZoneValidation';
import * as turf from '@turf/turf';

interface CustomerLocationPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (data: { 
    address: string; 
    latitude: number; 
    longitude: number;
    zoneInfo?: ZoneValidationResult;
  }) => void;
  initialCoords?: { latitude: number; longitude: number };
  storeId: string;
}

export const CustomerLocationPicker = ({ 
  open, 
  onClose, 
  onLocationSelect, 
  initialCoords,
  storeId 
}: CustomerLocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoords || { latitude: -23.5505, longitude: -46.6333 }
  );
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [acceptOutsideZone, setAcceptOutsideZone] = useState(false);
  const [zoneValidation, setZoneValidation] = useState<ZoneValidationResult | null>(null);
  const [zonesLoaded, setZonesLoaded] = useState(false);
  const [storeConfigError, setStoreConfigError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  // Buscar token do Mapbox
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Erro ao buscar token do Mapbox:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o mapa',
          variant: 'destructive',
        });
      }
    };
    
    if (open) {
      fetchToken();
    }
  }, [open]);

  // Função para normalizar zonas vindas do banco de dados
  const normalizeDeliveryZones = (rawZones: any[]): DeliveryZone[] => {
    console.log('🗺️ Zonas RAW do banco:', rawZones);
    
    return rawZones.map(zone => {
      // Se center é um array [lat, lng], converter para objeto
      if (zone.type === 'radius' && Array.isArray(zone.center)) {
        return {
          ...zone,
          center: { lat: zone.center[0], lng: zone.center[1] }
        };
      }
      
      // Se coordinates é um array de arrays [[lng, lat], ...], converter para array de objetos
      if (zone.type === 'polygon' && Array.isArray(zone.coordinates)) {
        return {
          ...zone,
          coordinates: zone.coordinates.map((coord: any) => 
            Array.isArray(coord) 
              ? { lat: coord[1], lng: coord[0] } // GeoJSON é [lng, lat]
              : coord // Já está no formato correto
          )
        };
      }
      
      return zone;
    });
  };

  // Buscar configurações de entrega da loja
  useEffect(() => {
    const fetchDeliveryConfig = async () => {
      console.log('🔍 [CustomerLocationPicker] Iniciando fetchDeliveryConfig...');
      console.log('📍 storeId recebido:', storeId);
      console.log('🚪 Dialog open:', open);
      
      if (!open) {
        console.log('⏸️ Dialog fechado, não buscar zonas');
        return;
      }
      
      if (!storeId || storeId.trim() === '') {
        console.warn('⚠️ storeId vazio:', storeId);
        setStoreConfigError('ID da loja inválido');
        setZonesLoaded(false);
        return;
      }

      try {
        // 1️⃣ Tentar buscar da view pública primeiro
        console.log('🔍 Tentando view pública (public_store_config)...');
    const { data: publicConfig, error: publicErr } = await supabase
      .from('public_store_config')
      .select('delivery_zones, accept_outside_delivery_zone')
      .eq('store_id', storeId)
      .maybeSingle();

        if (publicErr) {
          console.warn('⚠️ Erro na view pública:', publicErr);
        }

        if (publicConfig?.delivery_zones && Array.isArray(publicConfig.delivery_zones) && publicConfig.delivery_zones.length > 0) {
          console.log('✅ Zonas encontradas na view pública:', publicConfig.delivery_zones);
          const normalizedZones = normalizeDeliveryZones(publicConfig.delivery_zones as any[]);
          console.log('✅ Zonas normalizadas (view pública):', normalizedZones);
          setDeliveryZones(normalizedZones);
          setAcceptOutsideZone(!!publicConfig.accept_outside_delivery_zone);
          setStoreConfigError(null);
          setZonesLoaded(true);
          return;
        }

        // 2️⃣ Fallback para tabela store_configurations
        console.log('🔍 Tentando tabela store_configurations (fallback)...');
        const { data: storeConfig, error } = await supabase
          .from('store_configurations')
          .select('delivery_zones, accept_outside_delivery_zone')
          .eq('store_id', storeId)
          .maybeSingle();

        if (error) {
          console.error('❌ Erro ao buscar configuração:', error);
          setStoreConfigError('Erro ao carregar configuração de entrega');
          setDeliveryZones([]);
          setZonesLoaded(false);
          return;
        }

        if (storeConfig?.delivery_zones && Array.isArray(storeConfig.delivery_zones) && storeConfig.delivery_zones.length > 0) {
          console.log('✅ Zonas encontradas na tabela:', storeConfig.delivery_zones);
          const normalizedZones = normalizeDeliveryZones(storeConfig.delivery_zones as any[]);
          console.log('✅ Zonas normalizadas (tabela):', normalizedZones);
          setDeliveryZones(normalizedZones);
          setAcceptOutsideZone(!!storeConfig.accept_outside_delivery_zone);
          setStoreConfigError(null);
          setZonesLoaded(true);
          return;
        }

        // 3️⃣ Nenhuma das duas fontes retornou dados
        console.warn('⚠️ Nenhuma zona de entrega encontrada');
        setStoreConfigError('Nenhuma área de entrega configurada');
        setDeliveryZones([]);
        setZonesLoaded(false);
      } catch (error) {
        console.error('❌ Erro ao processar zonas de entrega:', error);
        setStoreConfigError('Erro ao carregar zonas de entrega');
        setDeliveryZones([]);
        setZonesLoaded(false);
      }
    };

    fetchDeliveryConfig();
  }, [open, storeId]);

  // Validar coordenadas quando mudarem
  useEffect(() => {
    if (!selectedCoords || deliveryZones.length === 0) {
      setZoneValidation(null);
      return;
    }

    console.log('📍 Validando coordenadas:', selectedCoords);
    const validation = validateDeliveryLocation(
      selectedCoords.latitude,
      selectedCoords.longitude,
      deliveryZones,
      acceptOutsideZone,
      0
    );
    console.log('✅ Resultado validação:', validation);
    setZoneValidation(validation);
  }, [selectedCoords, deliveryZones, acceptOutsideZone]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !open) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [selectedCoords.longitude, selectedCoords.latitude],
      zoom: 13,
    });

    // Criar marcador arrastável com cor dinâmica
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.width = '30px';
    markerElement.style.height = '30px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.border = '3px solid white';
    markerElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    markerElement.style.transition = 'background-color 0.3s';
    markerElement.style.backgroundColor = '#3B82F6';
    
    marker.current = new mapboxgl.Marker({
      draggable: true,
      element: markerElement,
    })
      .setLngLat([selectedCoords.longitude, selectedCoords.latitude])
      .addTo(map.current);

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    setMapReady(true);

    // Evento de clique no mapa
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedCoords({ latitude: lat, longitude: lng });
      marker.current?.setLngLat([lng, lat]);
    });

    // Evento de arrastar marcador
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        setSelectedCoords({ latitude: lngLat.lat, longitude: lngLat.lng });
      }
    });

    return () => {
      setMapReady(false);
      map.current?.remove();
    };
  }, [mapboxToken, open]);

  // Renderizar zonas de entrega no mapa
  useEffect(() => {
    console.log('🎨 [Render Effect] Tentando renderizar zonas...');
    console.log('🗺️ deliveryZones.length:', deliveryZones.length);
    console.log('🌍 map.current existe:', !!map.current);
    console.log('📍 zonesLoaded:', zonesLoaded);
    
    if (!map.current || !mapReady || deliveryZones.length === 0) {
      console.log('⏸️ Não renderizar: mapa não pronto ou zonas não disponíveis');
      return;
    }

    console.group('🗺️ Renderizando Zonas no Mapa do Cliente');
    console.log('Total de zonas:', deliveryZones.length);
    console.log('Zonas:', deliveryZones);
    console.groupEnd();

    // Aguardar o mapa estar totalmente carregado
    if (!map.current.isStyleLoaded()) {
      console.log('⏳ Aguardando style.load...');
      map.current.once('style.load', () => {
        console.log('✅ Style carregado, renderizando zonas...');
        renderDeliveryZones();
      });
    } else {
      console.log('✅ Style já carregado, renderizando zonas...');
      renderDeliveryZones();
    }

    function renderDeliveryZones() {
      if (!map.current || !map.current.getStyle()) {
        console.warn('⚠️ Mapa não está pronto para renderização');
        return;
      }

      console.log('🎨 Iniciando renderização das zonas...');
      console.log('📊 Número de zonas a renderizar:', deliveryZones.length);

      // Limpar camadas anteriores com validação robusta
      try {
        deliveryZones.forEach((_, index) => {
          try {
            if (map.current?.getLayer(`zone-${index}`)) {
              map.current.removeLayer(`zone-${index}`);
            }
            if (map.current?.getLayer(`zone-${index}-border`)) {
              map.current.removeLayer(`zone-${index}-border`);
            }
            if (map.current?.getSource(`zone-${index}`)) {
              map.current.removeSource(`zone-${index}`);
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao limpar zona ${index}:`, error);
          }
        });
      } catch (error) {
        console.error('❌ Erro geral ao limpar camadas:', error);
      }

      // Adicionar novas zonas
      console.log('➕ Adicionando zonas ao mapa...');
      deliveryZones.forEach((zone, index) => {
        console.log(`🔵 Renderizando zona ${index}:`, zone.name, zone.type);
        if (!map.current) return;

        try {
          if (zone.type === 'radius' && zone.center && zone.radius) {
            console.log(`🔵 Desenhando círculo ${index}:`, { 
              name: zone.name, 
              center: zone.center, 
              radius: zone.radius,
              color: zone.color 
            });

            // Desenhar círculo
            const center = [zone.center.lng, zone.center.lat];
            const radiusInKm = zone.radius / 1000;
            const circle = turf.circle(center, radiusInKm, { units: 'kilometers' });
            
            map.current.addSource(`zone-${index}`, {
              type: 'geojson',
              data: circle as any
            });

            map.current.addLayer({
              id: `zone-${index}`,
              type: 'fill',
              source: `zone-${index}`,
              paint: {
                'fill-color': zone.color || '#3b82f6',
                'fill-opacity': 0.2
              }
            });

            map.current.addLayer({
              id: `zone-${index}-border`,
              type: 'line',
              source: `zone-${index}`,
              paint: {
                'line-color': zone.color || '#3b82f6',
                'line-width': 2
              }
            });

            console.log(`✅ Círculo ${index} renderizado com sucesso`);
          } else if (zone.type === 'polygon' && zone.coordinates && zone.coordinates.length >= 3) {
            console.log(`🔴 Desenhando polígono ${index}:`, { 
              name: zone.name, 
              coordinates: zone.coordinates,
              color: zone.color 
            });

            // Desenhar polígono
            const coords = zone.coordinates.map(c => [c.lng, c.lat]);
            coords.push(coords[0]); // Fechar polígono

            map.current.addSource(`zone-${index}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [coords]
                }
              } as any
            });

            map.current.addLayer({
              id: `zone-${index}`,
              type: 'fill',
              source: `zone-${index}`,
              paint: {
                'fill-color': zone.color || '#ef4444',
                'fill-opacity': 0.2
              }
            });

            map.current.addLayer({
              id: `zone-${index}-border`,
              type: 'line',
              source: `zone-${index}`,
              paint: {
                'line-color': zone.color || '#ef4444',
                'line-width': 2
              }
            });

            console.log(`✅ Polígono ${index} renderizado com sucesso`);
          }
        } catch (error) {
          console.error(`❌ Erro ao renderizar zona ${index}:`, error);
        }
      });

      console.log('✅🎨 Renderização das zonas concluída!');
    }

    return () => {
      // Limpar ao desmontar com verificações robustas
      if (!map.current || !map.current.getStyle()) {
        console.log('🧹 Mapa já destruído, pulando cleanup das zonas');
        return;
      }

      console.log('🧹 Limpando zonas ao desmontar componente...');
      
      try {
        deliveryZones.forEach((_, index) => {
          try {
            if (map.current?.getLayer(`zone-${index}`)) {
              map.current.removeLayer(`zone-${index}`);
            }
            if (map.current?.getLayer(`zone-${index}-border`)) {
              map.current.removeLayer(`zone-${index}-border`);
            }
            if (map.current?.getSource(`zone-${index}`)) {
              map.current.removeSource(`zone-${index}`);
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao remover zona ${index} no cleanup:`, error);
          }
        });
        console.log('✅ Cleanup das zonas concluído');
      } catch (error) {
        console.error('❌ Erro geral no cleanup das zonas:', error);
      }
    };
  }, [deliveryZones, zonesLoaded, mapReady]);

  // Atualizar cor do marcador baseado na validação
  useEffect(() => {
    if (!marker.current) return;
    
    const markerElement = marker.current.getElement().querySelector('.custom-marker') as HTMLElement;
    if (!markerElement) return;

    if (!zoneValidation) {
      markerElement.style.backgroundColor = '#3B82F6'; // Azul padrão
    } else if (zoneValidation.isInZone) {
      markerElement.style.backgroundColor = '#10B981'; // Verde
    } else if (acceptOutsideZone) {
      markerElement.style.backgroundColor = '#F59E0B'; // Amarelo
    } else {
      markerElement.style.backgroundColor = '#EF4444'; // Vermelho
    }
  }, [zoneValidation, acceptOutsideZone]);

  // Reverse geocoding
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=pt`
      );
      const data = await response.json();
      return data.features[0]?.place_name || 'Endereço não encontrado';
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
      return 'Endereço não encontrado';
    }
  };

  // Obter localização atual do usuário
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocalização não suportada',
        description: 'Seu navegador não suporta geolocalização',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedCoords({ latitude, longitude });
        marker.current?.setLngLat([longitude, latitude]);
        map.current?.flyTo({ 
          center: [longitude, latitude], 
          zoom: 15,
          duration: 1500 
        });
        setLoading(false);
        toast({
          title: 'Localização obtida',
          description: 'Sua localização atual foi detectada com sucesso',
        });
      },
      (error) => {
        setLoading(false);
        let errorMessage = 'Não foi possível obter sua localização';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Você negou a permissão de localização. Ative nas configurações do navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível no momento';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao obter localização';
            break;
        }
        
        toast({
          title: 'Erro ao obter localização',
          description: errorMessage,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Buscar localização
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${mapboxToken}&country=BR&language=pt`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setSelectedCoords({ latitude: lat, longitude: lng });
        marker.current?.setLngLat([lng, lat]);
        map.current?.flyTo({ center: [lng, lat], zoom: 15 });
      } else {
        toast({
          title: 'Localização não encontrada',
          description: 'Tente outro endereço',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível buscar o endereço',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Confirmar localização
  const handleConfirm = async () => {
    // Bloquear se fora da área e loja não aceita
    if (zoneValidation && !zoneValidation.isInZone && !acceptOutsideZone) {
      toast({
        title: 'Localização inválida',
        description: 'Esta localização está fora da área de entrega',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const address = await reverseGeocode(selectedCoords.latitude, selectedCoords.longitude);
      onLocationSelect({
        address,
        latitude: selectedCoords.latitude,
        longitude: selectedCoords.longitude,
        zoneInfo: zoneValidation || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar localização:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar a localização',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecione sua localização</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                className="pl-10"
              />
            </div>
            <Button onClick={searchLocation} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
            <Button 
              onClick={getCurrentLocation} 
              disabled={loading} 
              variant="outline"
              className="flex items-center gap-2 px-3"
              title="Usar minha localização atual"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden md:inline">Minha Localização</span>
            </Button>
          </div>

          <div className="flex-1 rounded-lg overflow-hidden border relative">
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Erro de configuração - fixo no topo */}
            {storeConfigError && (
              <div className="absolute top-4 left-4 right-4 z-10">
                <Alert variant="destructive">
                  <AlertDescription>
                    {storeConfigError}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Status da zona - fixo no fundo */}
            {zoneValidation && (
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <Alert className={`${
                  zoneValidation.isInZone 
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                    : acceptOutsideZone
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                }`}>
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {zoneValidation.isInZone ? (
                        <>
                          <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                          <div>
                            <div className="font-medium text-green-900 dark:text-green-100">
                              {zoneValidation.message}
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                              Taxa: R$ {zoneValidation.deliveryFee.toFixed(2)}
                            </div>
                          </div>
                        </>
                      ) : acceptOutsideZone ? (
                        <>
                          <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                          <div className="font-medium text-yellow-900 dark:text-yellow-100">
                            {zoneValidation.message}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-red-600 dark:text-red-400 text-lg">❌</span>
                          <div className="font-medium text-red-900 dark:text-red-100">
                            {zoneValidation.message}
                          </div>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              Clique no mapa ou arraste o marcador para selecionar sua localização
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || (zoneValidation && !zoneValidation.isInZone && !acceptOutsideZone)} 
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar Localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};