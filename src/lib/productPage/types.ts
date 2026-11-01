// Tipos da página do produto na loja (/produto/<slug>).

export interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  slug: string;
  phone?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  theme_colors: any;
  configuration?: any;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image_gallery?: string[];
  category_id?: string;
  button_text?: string;
  slug: string;
  is_on_offer?: boolean;
  original_price?: number;
  offer_price?: number;
  category?: {
    name: string;
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
  is_default: boolean;
}

export interface Addon {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  addon_category: {
    id: string;
    name: string;
    description?: string;
    min_selections: number;
    max_selections: number;
    is_required: boolean;
  };
}

export interface AddonCategory {
  id: string;
  name: string;
  description?: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  addons: Addon[];
}

/** Adicionais escolhidos: categoria → adicional → quantidade. */
export type SelectedAddons = {[categoryId: string]: {[addonId: string]: number}};

/** O que a página usa da pizza de vários sabores (usePizzaFlavors). */
export interface PizzaFlavorsPricing {
  active: boolean;
  complete: boolean;
  price: number | null;
  mainPrice: number | null;
  label: string;
  otherIds: string[];
}
