/**
 * Helpers de conversão de cor.
 * shadcn/ui usa variáveis CSS no formato HSL "H S% L%" (sem hsl()).
 */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Converte "#rrggbb" / "#rgb" em string "H S% L%" (formato shadcn). */
export function hexToHslString(hex: string): string {
  if (!hex) return '0 0% 0%';
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return '0 0% 0%';

  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hVal = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hVal = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hVal = (b - r) / d + 2; break;
      case b: hVal = (r - g) / d + 4; break;
    }
    hVal /= 6;
  }

  return `${Math.round(hVal * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Retorna "0 0% 100%" ou "0 0% 0%" para contraste com a cor base. */
export function contrastForegroundHsl(hex: string): string {
  if (!hex) return '0 0% 100%';
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return '0 0% 100%';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // luminância relativa simplificada
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '0 0% 10%' : '0 0% 100%';
}

/** Mapeia chave de fonte para font-family CSS. */
export const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  modern: "'Manrope', 'Inter', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  system: "system-ui, -apple-system, sans-serif",
};

export function resolveFontFamily(key?: string): string {
  if (!key) return FONT_FAMILIES.inter;
  return FONT_FAMILIES[key] ?? FONT_FAMILIES.inter;
}

export const RADIUS_OPTIONS: { value: string; label: string }[] = [
  { value: '0rem', label: 'Reto' },
  { value: '0.375rem', label: 'Suave' },
  { value: '0.75rem', label: 'Arredondado' },
  { value: '1.5rem', label: 'Pílula' },
];

export const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'inter', label: 'Padrão (Inter)' },
  { value: 'serif', label: 'Serif elegante' },
  { value: 'modern', label: 'Moderna (Manrope)' },
  { value: 'system', label: 'Sistema' },
  { value: 'mono', label: 'Mono' },
];

export type BookingThemeVars = {
  '--primary'?: string;
  '--primary-foreground'?: string;
  '--background'?: string;
  '--foreground'?: string;
  '--card'?: string;
  '--card-foreground'?: string;
  '--radius'?: string;
  fontFamily?: string;
} & React.CSSProperties;

/** Constrói o objeto de style para aplicar o tema do agendamento no container raiz. */
export function buildBookingThemeStyle(theme: {
  theme_primary_color?: string;
  theme_background_color?: string;
  theme_text_color?: string;
  theme_radius?: string;
  theme_font_family?: string;
}): BookingThemeVars {
  const primary = theme.theme_primary_color || '#f97316';
  const background = theme.theme_background_color || '#ffffff';
  const text = theme.theme_text_color || '#0f172a';

  return {
    '--primary': hexToHslString(primary),
    '--primary-foreground': contrastForegroundHsl(primary),
    '--background': hexToHslString(background),
    '--foreground': hexToHslString(text),
    '--card': hexToHslString(background),
    '--card-foreground': hexToHslString(text),
    '--radius': theme.theme_radius || '0.5rem',
    fontFamily: resolveFontFamily(theme.theme_font_family),
  } as BookingThemeVars;
}
