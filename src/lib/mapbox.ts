import { supabase } from '@/integrations/supabase/client';

/** Token público do Mapbox, buscado uma vez na função get-mapbox-token e reaproveitado. */
let tokenPromise: Promise<string> | null = null;

export function getMapboxToken(): Promise<string> {
  if (!tokenPromise) {
    tokenPromise = supabase.functions
      .invoke('get-mapbox-token')
      .then(({ data, error }) => {
        if (error || !data?.token) throw error || new Error('Token do Mapbox indisponível');
        return data.token as string;
      })
      .catch((err) => {
        tokenPromise = null; // permite tentar de novo
        throw err;
      });
  }
  return tokenPromise;
}

export interface AddressSuggestion {
  id: string;
  /** Nome curto (rua, prédio, estabelecimento) */
  name: string;
  /** Endereço completo para exibir e salvar */
  label: string;
  latitude: number;
  longitude: number;
}

type Proximity = { latitude: number; longitude: number } | null | undefined;

const validProximity = (p: Proximity): p is { latitude: number; longitude: number } =>
  !!p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && !(p.latitude === 0 && p.longitude === 0);

/**
 * Busca endereços priorizando a região da loja.
 * Usa a Search Box API (entende quadras, blocos e pontos de referência como "SQN 308" ou
 * "Conjunto Nacional"); se não achar nada, cai na Geocoding API clássica.
 */
export async function searchAddresses(query: string, token: string, near?: Proximity): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (!q) return [];
  const prox = validProximity(near) ? `&proximity=${near.longitude},${near.latitude}` : '';
  const results: AddressSuggestion[] = [];

  try {
    const res = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/forward?q=${encodeURIComponent(q)}&access_token=${token}&language=pt&country=BR&limit=6${prox}`
    );
    if (res.ok) {
      const data = await res.json();
      for (const f of data.features || []) {
        const [lng, lat] = f.geometry?.coordinates || [];
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const p = f.properties || {};
        const name: string = p.name || '';
        const place: string = p.full_address || p.place_formatted || '';
        const label = p.feature_type === 'poi' && place && !place.startsWith(name) ? `${name} - ${place}` : (place || name);
        results.push({ id: p.mapbox_id || `${lng},${lat}`, name, label, latitude: lat, longitude: lng });
      }
    }
  } catch (err) {
    console.warn('Search Box indisponível, usando geocoding clássico', err);
  }

  if (results.length === 0) {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&country=BR&language=pt&limit=5${prox}`
    );
    if (res.ok) {
      const data = await res.json();
      for (const f of data.features || []) {
        const [lng, lat] = f.center || [];
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        results.push({ id: f.id, name: f.text || '', label: f.place_name || f.text || '', latitude: lat, longitude: lng });
      }
    }
  }

  return results;
}

/** Endereço aproximado de um ponto do mapa. */
export async function reverseGeocode(latitude: number, longitude: number, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&language=pt&types=address,poi,neighborhood,locality,place`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || null;
  } catch (err) {
    console.error('Erro no reverse geocoding:', err);
    return null;
  }
}

/**
 * Monta o endereço final colocando número e complemento logo depois da rua:
 * "Rua X, Cidade - UF, CEP" + "123" + "Apto 101" → "Rua X, 123 - Apto 101, Cidade - UF, CEP".
 */
export function composeAddress(base: string, number: string, complement: string): string {
  const b = base.trim().replace(/,\s*Brasil$/i, '');
  const n = number.trim();
  const c = complement.trim();
  const comma = b.indexOf(',');
  let head = comma > 0 ? b.slice(0, comma) : b;
  const tail = comma > 0 ? b.slice(comma) : '';
  // Não repetir o número se a rua já termina com ele ("Rua X 868" + "868")
  if (n && !new RegExp(`(^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i').test(head)) {
    head = head ? `${head}, ${n}` : n;
  }
  if (c) head = head ? `${head} - ${c}` : c;
  return `${head}${tail}`;
}
