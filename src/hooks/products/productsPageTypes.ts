// Tipos da tela de produtos do painel (src/pages/admin/ProductsPage.tsx e suas peças).

export interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  image_gallery: string[] | null;
  button_text: string | null;
  is_available: boolean;
  is_featured: boolean | null;
  show_in_menu: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  store_id: string;
  category_id: string | null;
  is_on_offer: boolean;
  original_price: number | null;
  offer_price: number | null;
  // Campos de estoque
  track_stock: boolean | null;
  stock_quantity: number | null;
  stock_alert_threshold: number | null;
  // Adicionais associados
  addon_category_names?: string[];
  addon_category_ids?: string[];
}

export interface AddonCategoryInfo {
  id: string;
  name: string;
}

export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  store_id: string;
  products: ProductData[];
}

export type ProductSortMode = 'manual' | 'alphabetical';
