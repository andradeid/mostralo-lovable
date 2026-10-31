// Tipos da página pública da loja (src/pages/Store.tsx e suas peças).

export interface StorePageStore {
  id: string;
  min_order_value?: number | null;
  name: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  phone?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  theme_colors: any;
  latitude?: number;
  longitude?: number;
  segment?: string;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
    product_display_layout?: string;
    gtm_id?: string | null;
    google_ads_id?: string | null;
    custom_scripts?: {
      head_scripts?: string;
      body_start_scripts?: string;
      body_end_scripts?: string;
    };
  };
}

export interface StorePageCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
}

export interface StorePageProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id?: string;
  display_order: number;
  button_text?: string;
  image_gallery?: string[];
  slug: string;
  is_on_offer?: boolean;
  original_price?: number;
  offer_price?: number;
  is_featured?: boolean;
}

export interface StorePageBanner {
  id: string;
  title: string;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  video_url: string | null;
}

/** Produtos carregados por página (lista geral, categoria e "carregar mais"). */
export const PRODUCTS_PER_PAGE = 50;
