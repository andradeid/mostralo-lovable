/** Representa um info card na página legacy */
export interface LegacyInfoCard {
  icon: string;
  label: string;
  value: string;
}

/** Representa um botão de ação na página legacy */
export interface LegacyActionButton {
  type: 'primary' | 'whatsapp' | 'secondary' | 'embed';
  label: string;
  url: string;
  color: string;
  embed_html?: string;
  embed_bg_color?: string;
  embed_text_color?: string;
  embed_font_size?: string;
  embed_padding?: string;
  embed_border_radius?: string;
  embed_button_text?: string;
}

/** Dados completos de uma página legacy */
export interface LegacyPageData {
  id: string;
  store_id: string;
  slug: string;
  is_active: boolean;
  store_name: string;
  subtitle: string;
  logo_url: string;
  background_gradient: string;
  card_border_color: string;
  logo_border_color: string;
  info_cards: LegacyInfoCard[];
  action_buttons: LegacyActionButton[];
  confetti_enabled: boolean;
  particles_enabled: boolean;
  bubbles_enabled: boolean;
  snow_enabled: boolean;
  animated_gradient_enabled: boolean;
  og_title: string;
  og_description: string;
  og_image: string;
  footer_text: string;
  created_at: string;
  updated_at: string;
}

/** Dados para criação/atualização */
export type LegacyPageInput = Omit<LegacyPageData, 'id' | 'created_at' | 'updated_at'>;
