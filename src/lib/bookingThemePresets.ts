/**
 * Catálogo de temas prontos para a página pública de agendamento.
 * Cada preset preenche os campos da tabela booking_settings (theme_*).
 * Para adicionar um novo tema (ex.: infantil, médico, fitness), basta
 * incluir um novo objeto neste array — sem mudanças no resto do sistema.
 */

export interface BookingThemePreset {
  id: string;
  name: string;
  description: string;
  category: 'premium' | 'clean' | 'colorful' | 'niche';
  theme_primary_color: string;
  theme_background_color: string;
  theme_text_color: string;
  theme_mode: 'light' | 'dark';
  theme_font_family: string;
  theme_radius: string;
}

export const BOOKING_THEME_PRESETS: BookingThemePreset[] = [
  {
    id: 'stark-premium',
    name: 'Stark Premium',
    description: 'Dark dourado, estilo barbearia premium.',
    category: 'premium',
    theme_primary_color: '#d4a24c',
    theme_background_color: '#0b0b0d',
    theme_text_color: '#f5f5f5',
    theme_mode: 'dark',
    theme_font_family: 'serif',
    theme_radius: '0.75rem',
  },
  {
    id: 'clean-light',
    name: 'Clean Light',
    description: 'Branco minimalista com laranja vibrante.',
    category: 'clean',
    theme_primary_color: '#f97316',
    theme_background_color: '#ffffff',
    theme_text_color: '#0f172a',
    theme_mode: 'light',
    theme_font_family: 'inter',
    theme_radius: '0.5rem',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Azul corporativo, ótimo para clínicas e consultórios.',
    category: 'clean',
    theme_primary_color: '#0ea5e9',
    theme_background_color: '#f8fafc',
    theme_text_color: '#0c4a6e',
    theme_mode: 'light',
    theme_font_family: 'modern',
    theme_radius: '0.75rem',
  },
  {
    id: 'rose-boutique',
    name: 'Rose Boutique',
    description: 'Rosé suave para salões de beleza e estética.',
    category: 'colorful',
    theme_primary_color: '#e11d74',
    theme_background_color: '#fff5f7',
    theme_text_color: '#3f1d2c',
    theme_mode: 'light',
    theme_font_family: 'serif',
    theme_radius: '1.5rem',
  },
  {
    id: 'forest-spa',
    name: 'Forest Spa',
    description: 'Verde natural para spas, terapias e bem-estar.',
    category: 'colorful',
    theme_primary_color: '#16a34a',
    theme_background_color: '#f7fbf7',
    theme_text_color: '#14532d',
    theme_mode: 'light',
    theme_font_family: 'modern',
    theme_radius: '0.75rem',
  },
  {
    id: 'midnight-tech',
    name: 'Midnight Tech',
    description: 'Dark roxo neon para serviços de tecnologia.',
    category: 'premium',
    theme_primary_color: '#a855f7',
    theme_background_color: '#0a0a18',
    theme_text_color: '#ededff',
    theme_mode: 'dark',
    theme_font_family: 'modern',
    theme_radius: '0.5rem',
  },
  {
    id: 'kids-fun',
    name: 'Kids Fun',
    description: 'Amarelo alegre para serviços infantis e festas.',
    category: 'niche',
    theme_primary_color: '#facc15',
    theme_background_color: '#fffbea',
    theme_text_color: '#713f12',
    theme_mode: 'light',
    theme_font_family: 'modern',
    theme_radius: '1.5rem',
  },
  {
    id: 'medical-care',
    name: 'Medical Care',
    description: 'Turquesa e branco para área da saúde.',
    category: 'niche',
    theme_primary_color: '#0d9488',
    theme_background_color: '#ffffff',
    theme_text_color: '#134e4a',
    theme_mode: 'light',
    theme_font_family: 'inter',
    theme_radius: '0.375rem',
  },
];

/** Detecta se um conjunto de configurações corresponde a um preset. */
export function findMatchingPreset(theme: {
  theme_primary_color?: string;
  theme_background_color?: string;
  theme_text_color?: string;
  theme_mode?: string;
}): BookingThemePreset | undefined {
  return BOOKING_THEME_PRESETS.find(
    (p) =>
      p.theme_primary_color.toLowerCase() === (theme.theme_primary_color || '').toLowerCase() &&
      p.theme_background_color.toLowerCase() === (theme.theme_background_color || '').toLowerCase() &&
      p.theme_text_color.toLowerCase() === (theme.theme_text_color || '').toLowerCase() &&
      p.theme_mode === theme.theme_mode,
  );
}
