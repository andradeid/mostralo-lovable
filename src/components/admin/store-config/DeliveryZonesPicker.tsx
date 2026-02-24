import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Circle, Pencil, Save, X, Clock, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export interface TimeFee {
  id: string;
  startTime: string;
  endTime: string;
  fee: number;
  label?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  type: 'radius' | 'polygon';
  radius?: number;
  center?: { lat: number; lng: number };
  coordinates?: Array<{ lat: number; lng: number }>;
  deliveryFee: number;
  isActive: boolean;
  color?: string;
  timeFees?: TimeFee[];
}

interface DeliveryZonesPickerProps {
  storeLat: number;
  storeLng: number;
  existingZones: DeliveryZone[];
  onClose: () => void;
  onSave: (zones: DeliveryZone[]) => void;
}

// Paleta de cores para as zonas de entrega
const ZONE_COLORS = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Laranja
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#f97316', // Laranja escuro
];

// Função para normalizar zonas vindas do banco de dados
const normalizeZones = (rawZones: DeliveryZone[]): DeliveryZone[] => {
  console.log('🗺️ Admin - Zonas RAW:', rawZones);
  
  const normalized = rawZones.map(zone => {
    // Se center é um array [lat, lng], converter para objeto
    if (zone.type === 'radius' && zone.center && Array.isArray(zone.center)) {
      const normalizedZone = {
        ...zone,
        center: { lat: (zone.center as any)[0], lng: (zone.center as any)[1] }
      };
      console.log(`🔵 Círculo normalizado: ${zone.name}`, normalizedZone);
      return normalizedZone;
    }
    
    // Se coordinates é um array de arrays [[lng, lat], ...], converter para array de objetos
    if (zone.type === 'polygon' && zone.coordinates && Array.isArray(zone.coordinates)) {
      const normalizedZone = {
        ...zone,
        coordinates: zone.coordinates.map((coord: any) => 
          Array.isArray(coord) 
            ? { lat: coord[1], lng: coord[0] } // GeoJSON é [lng, lat]
            : coord // Já está no formato correto
        )
      };
      console.log(`🔴 Polígono normalizado: ${zone.name}`, normalizedZone);
      return normalizedZone;
    }
    
    console.log(`✅ Zona já no formato correto: ${zone.name}`, zone);
    return zone;
  });

  console.log('✅ Admin - Zonas normalizadas:', normalized);
  return normalized;
};

export function DeliveryZonesPicker({
  storeLat,
  storeLng,
  existingZones,
  onClose,
  onSave,
}: DeliveryZonesPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [zones, setZones] = useState<DeliveryZone[]>(normalizeZones(existingZones));
  const [mode, setMode] = useState<'radius' | 'polygon'>('radius');
  const [currentRadius, setCurrentRadius] = useState(500); // Em metros
  const [zoneName, setZoneName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [interactionState, setInteractionState] = useState<'idle' | 'editing' | 'dragging'>('idle');
  const [enableTimeFees, setEnableTimeFees] = useState(false);
  const [timeFees, setTimeFees] = useState<TimeFee[]>([]);

  // Atualizar zonas quando existingZones mudar
  useEffect(() => {
    setZones(normalizeZones(existingZones));
  }, [existingZones]);

  useEffect(() => {
    const loadMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) {
          toast.error('Erro ao carregar mapa');
          return;
        }
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
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
      center: [storeLng, storeLat],
      zoom: 13,
    });

    // Adicionar marcador da loja
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([storeLng, storeLat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Seu Estabelecimento</strong>'))
      .addTo(map.current);

    // Configurar ferramenta de desenho com styles customizadas
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'simple_select',
      styles: [
        // Polygon fill
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': ['coalesce', ['get', 'user_color'], '#3b82f6'],
            'fill-opacity': 0.3,
          },
        },
        // Polygon outline
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': ['coalesce', ['get', 'user_color'], '#3b82f6'],
            'line-width': 2,
          },
        },
        // Vertex points
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#10b981',
          },
        },
      ],
    });

    map.current.addControl(draw.current);

    // Carregar zonas existentes
    map.current.on('load', () => {
      loadExistingZones();
      setupMapInteractions();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, storeLat, storeLng]);

  const setupMapInteractions = () => {
    if (!map.current) return;

    // Cursor interativo para zonas de raio
    map.current.on('mouseenter', 'zone-layer', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'zone-layer', () => {
      if (map.current && interactionState === 'idle') {
        map.current.getCanvas().style.cursor = '';
      }
    });

    // Eventos de clique e arrastar
    let startPoint: [number, number] | null = null;

    map.current.on('mousedown', (e) => {
      // Permitir interação tanto em modo idle quanto em modo editing
      if (interactionState !== 'idle' && interactionState !== 'editing') return;

      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: zones.filter(z => z.type === 'radius').map(z => z.id),
      });

      if (features && features.length > 0) {
        const zoneId = features[0].layer.id;
        const zone = zones.find(z => z.id === zoneId);
        
        if (zone && zone.type === 'radius') {
          // Se já está editando outra zona, mudar para esta
          if (!editingZone || editingZone.id !== zone.id) {
            startEditingZone(zone);
          }
          startPoint = [e.lngLat.lng, e.lngLat.lat];
          setIsDragging(true);
          setInteractionState('dragging');
          if (map.current) map.current.getCanvas().style.cursor = 'grabbing';
        }
      }
    });

    map.current.on('mousemove', (e) => {
      // Simplificar: verificar apenas isDragging
      if (!isDragging || !editingZone || !editingZone.center) return;

      const currentPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const newRadiusKm = calculateDistance(
        editingZone.center.lat,
        editingZone.center.lng,
        currentPoint[1],
        currentPoint[0]
      );
      
      const newRadiusMeters = Math.round(newRadiusKm * 1000);

      if (newRadiusMeters >= 0 && newRadiusMeters <= 50000) {
        setCurrentRadius(newRadiusMeters);
        updateZoneRadius(editingZone.id, newRadiusMeters);
      }
    });

    map.current.on('mouseup', () => {
      if (isDragging) {
        setIsDragging(false);
        setInteractionState('editing');
        if (map.current) map.current.getCanvas().style.cursor = 'grab';
        toast.success('Arraste novamente para ajustar ou clique em "Salvar Alterações"');
      }
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startEditingZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setInteractionState('editing');
    setZoneName(zone.name);
    setDeliveryFee(zone.deliveryFee);
    setTimeFees(zone.timeFees || []);
    
    if (zone.type === 'radius' && zone.radius) {
      setCurrentRadius(zone.radius);
      setMode('radius');
      highlightZone(zone.id, true);
    } else if (zone.type === 'polygon' && draw.current) {
      setMode('polygon');
      // Habilitar edição direta do polígono
      draw.current.changeMode('direct_select', { featureId: zone.id });
    }
    
    // Adicionar feedback visual extra para zona editável
    if (map.current && zone.type === 'radius') {
      map.current.setPaintProperty(zone.id, 'fill-opacity', 0.5);
      map.current.setPaintProperty(`${zone.id}-outline`, 'line-width', 4);
      
      // Configurar cursor para grab quando sobre a zona em edição
      const zoneLayerId = zone.id;
      map.current.on('mouseenter', zoneLayerId, () => {
        if (map.current && interactionState === 'editing') {
          map.current.getCanvas().style.cursor = 'grab';
        }
      });
      
      map.current.on('mouseleave', zoneLayerId, () => {
        if (map.current && interactionState === 'editing' && !isDragging) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    }
    
    toast.info(`Editando: ${zone.name} - Clique e arraste o círculo para ajustar`);
  };

  const updateZoneRadius = (zoneId: string, newRadius: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone || zone.type !== 'radius' || !zone.center) return;

    const updatedZone = { ...zone, radius: newRadius };
    setZones(zones.map(z => z.id === zoneId ? updatedZone : z));
    addRadiusCircle(zone.center, newRadius, zoneId, zone.color);
  };

  const highlightZone = (zoneId: string, highlight: boolean) => {
    if (!map.current) return;

    const zone = zones.find(z => z.id === zoneId);
    if (!zone || zone.type !== 'radius') return;

    const baseColor = zone.color || '#3b82f6';

    if (map.current.getLayer(zoneId)) {
      map.current.setPaintProperty(zoneId, 'fill-color', highlight ? '#10b981' : baseColor);
      map.current.setPaintProperty(zoneId, 'fill-opacity', highlight ? 0.4 : 0.3);
      map.current.setPaintProperty(`${zoneId}-outline`, 'line-color', highlight ? '#10b981' : baseColor);
      map.current.setPaintProperty(`${zoneId}-outline`, 'line-width', highlight ? 3 : 2);
    }
  };

  const saveEditedZone = () => {
    if (!editingZone || !zoneName.trim() || !deliveryFee) {
      toast.error('Preencha todos os campos');
      return;
    }

    const fee = deliveryFee;
    if (fee < 0) {
      toast.error('Taxa de entrega inválida');
      return;
    }

    let updatedZone: DeliveryZone = {
      ...editingZone,
      name: zoneName,
      deliveryFee: fee,
      timeFees: enableTimeFees ? timeFees : undefined,
    };

    if (editingZone.type === 'radius') {
      updatedZone.radius = currentRadius;
      highlightZone(editingZone.id, false);
    } else if (editingZone.type === 'polygon' && draw.current) {
      // Capturar coordenadas atualizadas do Draw e converter para { lat, lng }
      const feature = draw.current.get(editingZone.id);
      if (feature && feature.geometry.type === 'Polygon') {
        const geoJsonCoords = feature.geometry.coordinates[0] as number[][];
        updatedZone.coordinates = geoJsonCoords.map(coord => ({ lat: coord[1], lng: coord[0] }));
      }
      draw.current.changeMode('simple_select');
    }

    setZones(zones.map(z => z.id === editingZone.id ? updatedZone : z));
    setEditingZone(null);
    setInteractionState('idle');
    setZoneName('');
    setDeliveryFee('');
    setTimeFees([]);
    setEnableTimeFees(false);
  };

  const cancelEdit = () => {
    if (editingZone) {
      if (editingZone.type === 'radius') {
        highlightZone(editingZone.id, false);
        // Restaurar valores originais
        if (editingZone.center && editingZone.radius) {
          addRadiusCircle(editingZone.center, editingZone.radius, editingZone.id, editingZone.color);
          setCurrentRadius(editingZone.radius);
        }
      } else if (editingZone.type === 'polygon' && draw.current && editingZone.coordinates) {
        // Restaurar geometria original do polígono - converter { lat, lng } para GeoJSON [lng, lat]
        const geoJsonCoords = editingZone.coordinates.map(coord => [coord.lng, coord.lat]);
        draw.current.delete(editingZone.id);
        draw.current.add({
          type: 'Feature',
          id: editingZone.id,
          geometry: {
            type: 'Polygon',
            coordinates: [geoJsonCoords],
          },
          properties: {
            user_color: editingZone.color || ZONE_COLORS[0],
          },
        });
        draw.current.changeMode('simple_select');
      }
    }
    setEditingZone(null);
    setInteractionState('idle');
    setIsDragging(false);
    setZoneName('');
    setDeliveryFee('');
    setTimeFees([]);
    setEnableTimeFees(false);
  };

  const loadExistingZones = () => {
    if (!map.current) return;

    console.group('🎨 Admin - Carregando Zonas Existentes no Mapa');
    console.log('Total de zonas:', zones.length);
    console.log('Zonas:', zones);

    zones.forEach((zone, index) => {
      if (zone.type === 'radius' && zone.center && zone.radius) {
        console.log(`🔵 Renderizando círculo ${index}:`, {
          name: zone.name,
          center: zone.center,
          radius: zone.radius,
          color: zone.color
        });
        addRadiusCircle(zone.center, zone.radius, zone.id, zone.color);
        console.log(`✅ Círculo ${index} renderizado`);
      } else if (zone.type === 'polygon' && zone.coordinates && zone.coordinates.length >= 3) {
        if (draw.current) {
          console.log(`🔴 Renderizando polígono ${index}:`, {
            name: zone.name,
            coordinates: zone.coordinates,
            color: zone.color
          });
          // Adicionar polígono com cor customizada - converter { lat, lng } para GeoJSON [lng, lat]
          const zoneColor = zone.color || ZONE_COLORS[zones.indexOf(zone) % ZONE_COLORS.length];
          const geoJsonCoords = zone.coordinates.map(coord => [coord.lng, coord.lat]);
          draw.current.add({
            type: 'Feature',
            id: zone.id,
            geometry: {
              type: 'Polygon',
              coordinates: [geoJsonCoords],
            },
            properties: {
              user_color: zoneColor,
            },
          });
          console.log(`✅ Polígono ${index} renderizado`);
        }
      } else {
        console.warn(`⚠️ Zona ${index} com dados inválidos:`, zone);
      }
    });

    console.groupEnd();
  };

  const addRadiusCircle = (center: { lat: number; lng: number }, radiusMeters: number, id: string, color?: string) => {
    if (!map.current) return;

    const radiusKm = radiusMeters / 1000; // Converter metros para km
    const steps = 64;
    const coordinates: number[][] = [];
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const dx = radiusKm * Math.cos(angle) / 111; // Aproximação para km em graus
      const dy = radiusKm * Math.sin(angle) / (111 * Math.cos(center.lat * Math.PI / 180));
      coordinates.push([center.lng + dy, center.lat + dx]);
    }
    coordinates.push(coordinates[0]); // Fechar o polígono

    const zoneColor = color || '#3b82f6';

    if (map.current.getSource(id)) {
      (map.current.getSource(id) as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        properties: {},
      });
    } else {
      map.current.addSource(id, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
          properties: {},
        },
      });

      map.current.addLayer({
        id: id,
        type: 'fill',
        source: id,
        paint: {
          'fill-color': zoneColor,
          'fill-opacity': 0.3,
        },
      });

      map.current.addLayer({
        id: `${id}-outline`,
        type: 'line',
        source: id,
        paint: {
          'line-color': zoneColor,
          'line-width': 2,
        },
      });
    }
  };

  const handleAddOrUpdateZone = () => {
    if (editingZone) {
      saveEditedZone();
      return;
    }

    if (!zoneName.trim() || !deliveryFee) {
      toast.error('Preencha nome e taxa de entrega');
      return;
    }

    const fee = parseFloat(deliveryFee);
    if (isNaN(fee) || fee < 0) {
      toast.error('Taxa de entrega inválida');
      return;
    }

    if (mode === 'radius') {
      // Selecionar cor baseada no índice da zona
      const zoneColor = ZONE_COLORS[zones.length % ZONE_COLORS.length];
      
      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}`,
        name: zoneName,
        type: 'radius',
        radius: currentRadius,
        center: { lat: storeLat, lng: storeLng },
        deliveryFee: fee,
        isActive: true,
        color: zoneColor,
        timeFees: enableTimeFees ? timeFees : undefined,
      };

      setZones([...zones, newZone]);
      addRadiusCircle({ lat: storeLat, lng: storeLng }, currentRadius, newZone.id, zoneColor);
      toast.success('Zona de raio adicionada');
    } else {
      if (!draw.current) return;
      
      const data = draw.current.getAll();
      if (data.features.length === 0) {
        toast.error('Desenhe um polígono no mapa');
        return;
      }

      const feature = data.features[data.features.length - 1];
      if (feature.geometry.type !== 'Polygon') {
        toast.error('Desenhe um polígono válido');
        return;
      }

      // Selecionar cor baseada no índice da zona
      const zoneColor = ZONE_COLORS[zones.length % ZONE_COLORS.length];

      // Converter GeoJSON [lng, lat] para { lat, lng }
      const geoJsonCoords = feature.geometry.coordinates[0] as number[][];
      const formattedCoords = geoJsonCoords.map(coord => ({ lat: coord[1], lng: coord[0] }));

      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}`,
        name: zoneName,
        type: 'polygon',
        coordinates: formattedCoords,
        deliveryFee: fee,
        isActive: true,
        color: zoneColor,
        timeFees: enableTimeFees ? timeFees : undefined,
      };

      // Remover feature antigo e re-adicionar com ID e cor da zona
      draw.current.deleteAll();
      draw.current.add({
        type: 'Feature',
        id: newZone.id,
        geometry: {
          type: 'Polygon',
          coordinates: [geoJsonCoords], // Manter GeoJSON para o mapa
        },
        properties: {
          user_color: zoneColor,
        },
      });

      setZones([...zones, newZone]);
      toast.success('Zona personalizada adicionada');
    }

    // Limpar campos
    setZoneName('');
    setDeliveryFee('');
    setTimeFees([]);
    setEnableTimeFees(false);
  };

  const handleRemoveZone = (zoneId: string) => {
    if (editingZone && editingZone.id === zoneId) {
      cancelEdit();
    }

    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;

    if (zone.type === 'radius' && map.current) {
      if (map.current.getLayer(zoneId)) {
        map.current.removeLayer(zoneId);
        map.current.removeLayer(`${zoneId}-outline`);
        map.current.removeSource(zoneId);
      }
    } else if (zone.type === 'polygon' && draw.current) {
      draw.current.delete(zoneId);
    }

    setZones(zones.filter((z) => z.id !== zoneId));
    toast.success('Zona removida');
  };

  const handleSave = () => {
    if (zones.length === 0) {
      toast.error('Adicione pelo menos uma zona de entrega');
      return;
    }
    onSave(zones);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Configurar Áreas de Entrega
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-4 p-6 pt-0 overflow-hidden">
          {/* Painel de Controle */}
          <div className="w-full md:w-80 space-y-4 overflow-y-auto">
            {editingZone && (
              <div className="p-3 bg-primary/10 border border-primary rounded-lg">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  Editando: {editingZone.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {editingZone.type === 'radius' 
                    ? 'Arraste a borda do círculo no mapa para ajustar o raio'
                    : 'Edite as informações abaixo'}
                </p>
              </div>
            )}

            {!editingZone && (
              <div className="space-y-3">
                <Label>Tipo de Zona</Label>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'radius' | 'polygon')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="radius" id="mode-radius" />
                    <Label htmlFor="mode-radius" className="flex items-center gap-2 cursor-pointer">
                      <Circle className="w-4 h-4" />
                      Raio Circular
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="polygon" id="mode-polygon" />
                    <Label htmlFor="mode-polygon" className="flex items-center gap-2 cursor-pointer">
                      <Pencil className="w-4 h-4" />
                      Área Personalizada
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {(mode === 'radius' || (editingZone && editingZone.type === 'radius')) && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <Label>Raio</Label>
                  <span className="text-sm font-medium">
                    {currentRadius < 1000 
                      ? `${currentRadius} m` 
                      : `${(currentRadius / 1000).toFixed(1)} km`}
                  </span>
                </div>
                <Slider
                  value={[currentRadius]}
                  onValueChange={(v) => {
                    setCurrentRadius(v[0]);
                    if (editingZone && editingZone.type === 'radius') {
                      updateZoneRadius(editingZone.id, v[0]);
                    }
                  }}
                  min={0}
                  max={50000}
                  step={50}
                  className="w-full"
                />
                <div className="space-y-2">
                  <Label htmlFor="radius-input">Valor Exato</Label>
                  <div className="flex gap-2">
                    <Input
                      id="radius-input"
                      type="number"
                      value={currentRadius}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (value >= 0 && value <= 50000) {
                          setCurrentRadius(value);
                          if (editingZone && editingZone.type === 'radius') {
                            updateZoneRadius(editingZone.id, value);
                          }
                        }
                      }}
                      min={0}
                      max={50000}
                      className="flex-1"
                    />
                    <div className="px-3 py-2 bg-secondary rounded-md text-sm font-medium flex items-center">
                      metros
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mode === 'polygon' && (
              <p className="text-sm text-muted-foreground border-l-4 border-primary pl-3">
                Use a ferramenta de polígono no mapa para desenhar a área de entrega personalizada.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="zone-name">Nome da Zona</Label>
              <Input
                id="zone-name"
                placeholder="Ex: Centro, Zona Sul..."
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-fee">Taxa de Entrega (R$)</Label>
              <Input
                id="delivery-fee"
                type="number"
                placeholder="0.00"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Taxa por horário */}
            <div className="space-y-3 border rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-time-fees"
                  checked={enableTimeFees}
                  onCheckedChange={(checked) => {
                    setEnableTimeFees(!!checked);
                    if (!checked) setTimeFees([]);
                  }}
                />
                <Label htmlFor="enable-time-fees" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Clock className="w-4 h-4" />
                  Habilitar taxa por horário
                </Label>
              </div>

              {enableTimeFees && (
                <div className="space-y-3">
                  {timeFees.map((tf, idx) => (
                    <div key={tf.id} className="space-y-2 p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Faixa {idx + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setTimeFees(timeFees.filter(t => t.id !== tf.id))}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Início</Label>
                          <Input
                            type="time"
                            value={tf.startTime}
                            onChange={(e) => setTimeFees(timeFees.map(t => t.id === tf.id ? { ...t, startTime: e.target.value } : t))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fim</Label>
                          <Input
                            type="time"
                            value={tf.endTime}
                            onChange={(e) => setTimeFees(timeFees.map(t => t.id === tf.id ? { ...t, endTime: e.target.value } : t))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Taxa (R$)</Label>
                          <Input
                            type="number"
                            value={tf.fee}
                            onChange={(e) => setTimeFees(timeFees.map(t => t.id === tf.id ? { ...t, fee: parseFloat(e.target.value) || 0 } : t))}
                            min="0"
                            step="0.01"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Rótulo</Label>
                          <Input
                            value={tf.label || ''}
                            onChange={(e) => setTimeFees(timeFees.map(t => t.id === tf.id ? { ...t, label: e.target.value } : t))}
                            placeholder="Ex: Noturna"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setTimeFees([...timeFees, { id: `tf-${Date.now()}`, startTime: '22:00', endTime: '06:00', fee: 0, label: 'Taxa noturna' }])}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar faixa de horário
                  </Button>
                </div>
              )}
            </div>

            {editingZone ? (
              <div className="flex gap-2">
                <Button onClick={saveEditedZone} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
                <Button onClick={cancelEdit} variant="outline">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleAddOrUpdateZone} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Adicionar Zona
              </Button>
            )}

            {/* Lista de Zonas */}
            <div className="space-y-2">
              <Label>Zonas Criadas ({zones.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${
                      editingZone?.id === zone.id 
                        ? 'bg-primary/20 border border-primary' 
                        : 'bg-secondary'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {zone.type === 'radius' 
                          ? `${zone.radius! < 1000 ? `${zone.radius} m` : `${(zone.radius! / 1000).toFixed(1)} km`}` 
                          : 'Área personalizada'} • R$ {zone.deliveryFee.toFixed(2)}
                      </div>
                      {zone.timeFees && zone.timeFees.length > 0 && (
                        <div className="text-xs text-primary flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {zone.timeFees.length} faixa(s) de horário
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingZone(zone)}
                        disabled={editingZone !== null}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveZone(zone.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {zones.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma zona criada ainda
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="flex-1 relative rounded-lg overflow-hidden border min-h-[400px]">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
          </div>
        </div>

        <DialogFooter className="p-6 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
