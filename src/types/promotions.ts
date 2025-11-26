import { Database } from '@/integrations/supabase/types';

export type Promotion = Database['public']['Tables']['promotions']['Row'];
export type PromotionInsert = Database['public']['Tables']['promotions']['Insert'];
export type PromotionUpdate = Database['public']['Tables']['promotions']['Update'];

export type PromotionType = Database['public']['Enums']['promotion_type'];
export type PromotionScope = Database['public']['Enums']['promotion_scope'];
export type PromotionStatus = Database['public']['Enums']['promotion_status'];

export interface PromotionFormData {
  // Step 1: Básico
  name: string;
  description?: string;
  code?: string;
  
  // Step 2: Tipo
  type: PromotionType;
  discount_percentage?: number;
  discount_amount?: number;
  bogo_buy_quantity?: number;
  bogo_get_quantity?: number;
  
  // Step 3: Escopo
  scope: PromotionScope;
  selectedProducts?: string[];
  selectedCategories?: string[];
  applies_to_delivery: boolean;
  applies_to_pickup: boolean;
  
  // Step 4: Regras
  minimum_order_value?: number;
  first_order_only: boolean;
  max_uses?: number;
  max_uses_per_customer?: number;
  
  // Step 5: Período
  start_date: Date;
  end_date?: Date;
  allowed_days?: string[];
  start_time?: string;
  end_time?: string;
  
  // Metadados
  is_visible_on_store: boolean;
  banner_image_url?: string;
  
  // Configurações de Popup
  show_as_popup?: boolean;
  popup_frequency_type?: 'once_browser' | 'once_session' | 'custom_count';
  popup_max_displays?: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category_id?: string;
}

export interface OrderData {
  items: CartItem[];
  subtotal: number;
  deliveryType: 'delivery' | 'pickup';
  deliveryFee: number;
  customerId?: string;
  storeId: string;
}

export interface PromotionCalculationResult {
  isValid: boolean;
  discount: number;
  message: string;
  promotionApplied?: Promotion;
}

export interface BestDiscountResult {
  finalPrice: number;
  discount: number;
  source: 'product_offer' | 'promotion' | 'none';
  message: string;
}
