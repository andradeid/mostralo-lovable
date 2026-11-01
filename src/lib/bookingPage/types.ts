// Tipos da página pública de agendamento (/agendar/<loja>).

export interface Professional {
  id: string;
  name: string;
  slug: string | null;
  photo_url: string | null;
  specialty: string | null;
}

export interface BookingService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes?: number;
  price: number;
  price_type: 'fixed' | 'from';
  category_id?: string | null;
  image_url?: string | null;
}

export interface StoreInfo {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  cover_url: string | null;
  instagram: string | null;
  google_maps_link: string | null;
  segment: string | null;
  latitude: number | null;
  longitude: number | null;
  business_hours: any;
}

export interface ProfessionalServiceLink {
  professional_id: string;
  service_id: string;
}

// Steps
export type Step = 'service' | 'professional' | 'datetime' | 'confirm';
