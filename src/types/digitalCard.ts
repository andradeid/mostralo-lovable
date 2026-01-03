export interface CustomLink {
  id: string;
  icon: string;
  label: string;
  url: string;
}

export type CardTheme = 'dark' | 'light' | 'orange' | 'gradient';

export interface DigitalCard {
  id: string;
  owner_id: string;
  owner_type: 'salesperson' | 'admin';
  slug: string;
  photo_url: string | null;
  name: string;
  title: string | null;
  company: string | null;
  headline: string | null;
  bio: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  cta_text: string | null;
  cta_url: string | null;
  custom_links: CustomLink[];
  stats_text: string | null;
  theme: CardTheme;
  accent_color: string | null;
  show_qr_code: boolean;
  show_mostralo_badge: boolean;
  referral_code: string | null;
  views_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DigitalCardClick {
  id: string;
  card_id: string;
  click_type: string;
  link_label: string | null;
  user_agent: string | null;
  referrer: string | null;
  ip_hash: string | null;
  created_at: string;
}

export interface CardFormData {
  name: string;
  title: string;
  company: string;
  headline: string;
  bio: string;
  whatsapp: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  cta_text: string;
  cta_url: string;
  custom_links: CustomLink[];
  stats_text: string;
  theme: CardTheme;
  accent_color: string;
  show_qr_code: boolean;
  show_mostralo_badge: boolean;
  slug: string;
}

export interface CardStats {
  totalViews: number;
  totalClicks: number;
  clicksByType: Record<string, number>;
  viewsOverTime: { date: string; views: number }[];
  conversionRate: number;
}
