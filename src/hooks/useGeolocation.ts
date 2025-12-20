import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  loading: boolean;
  error: string | null;
}

interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: (mapboxToken: string) => Promise<void>;
  setLocation: (lat: number, lng: number, addr: string) => void;
  clearLocation: () => void;
  hasLocation: boolean;
}

export function useGeolocation(initialState?: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
}): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: initialState?.latitude ?? null,
    longitude: initialState?.longitude ?? null,
    address: initialState?.address ?? '',
    loading: false,
    error: null,
  });

  const reverseGeocode = async (lat: number, lng: number, token: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=pt-BR`
      );
      const data = await response.json();
      if (data.features?.[0]?.place_name) {
        return data.features[0].place_name;
      }
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Erro no geocoding reverso:', error);
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  const getCurrentLocation = useCallback(async (mapboxToken: string) => {
    if (!navigator.geolocation) {
      toast.error('Seu navegador não suporta geolocalização');
      setState(prev => ({ ...prev, error: 'Geolocalização não suportada' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const address = await reverseGeocode(latitude, longitude, mapboxToken);

      setState({
        latitude,
        longitude,
        address,
        loading: false,
        error: null,
      });

      toast.success('Localização capturada com sucesso!');
    } catch (error: any) {
      let errorMessage = 'Não foi possível obter sua localização';
      
      if (error.code === 1) {
        errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à sua localização.';
      } else if (error.code === 2) {
        errorMessage = 'Localização indisponível. Verifique se o GPS está ativado.';
      } else if (error.code === 3) {
        errorMessage = 'Tempo limite excedido. Tente novamente.';
      }

      toast.error(errorMessage);
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const setLocation = useCallback((lat: number, lng: number, addr: string) => {
    setState({
      latitude: lat,
      longitude: lng,
      address: addr,
      loading: false,
      error: null,
    });
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      address: '',
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    getCurrentLocation,
    setLocation,
    clearLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}
