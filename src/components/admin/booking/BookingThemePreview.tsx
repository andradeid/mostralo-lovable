import { buildBookingThemeStyle } from '@/lib/colorUtils';
import { Scissors, User, CalendarDays, Check } from 'lucide-react';

interface BookingThemePreviewProps {
  theme: {
    theme_primary_color?: string;
    theme_background_color?: string;
    theme_text_color?: string;
    theme_radius?: string;
    theme_font_family?: string;
    theme_mode?: string;
  };
  storeName?: string;
}

export function BookingThemePreview({ theme, storeName = 'Sua Loja' }: BookingThemePreviewProps) {
  const style = buildBookingThemeStyle(theme);
  const isDark = theme.theme_mode === 'dark';

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm">
      <div className="bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground border-b flex items-center justify-between">
        <span>Pré-visualização ao vivo</span>
        <span className="text-[10px]">/agendar/{storeName.toLowerCase().replace(/\s+/g, '-')}</span>
      </div>

      <div
        style={style}
        className={isDark ? 'dark' : ''}
      >
        <div className="bg-background text-foreground p-5">
          {/* Header mock */}
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              {storeName}
            </h3>
            <p className="text-xs opacity-70">Escolha o serviço</p>
          </div>

          {/* Stepper mock */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {[
              { icon: Scissors, active: true },
              { icon: User, active: false },
              { icon: CalendarDays, active: false },
              { icon: Check, active: false },
            ].map((s, i) => (
              <div
                key={i}
                className="h-8 w-8 flex items-center justify-center transition-colors"
                style={{
                  borderRadius: 'var(--radius)',
                  background: s.active ? 'hsl(var(--primary))' : 'transparent',
                  color: s.active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                  border: s.active ? 'none' : '1px solid hsl(var(--foreground) / 0.2)',
                }}
              >
                <s.icon className="h-3.5 w-3.5" />
              </div>
            ))}
          </div>

          {/* Service card mock */}
          <div className="space-y-2">
            <div
              className="p-3 flex items-center justify-between"
              style={{
                borderRadius: 'var(--radius)',
                border: '2px solid hsl(var(--primary))',
                background: 'hsl(var(--primary) / 0.06)',
              }}
            >
              <div>
                <p className="text-sm font-semibold">Corte Premium</p>
                <p className="text-xs opacity-70">45 min · R$ 80,00</p>
              </div>
              <div
                className="h-5 w-5 flex items-center justify-center"
                style={{
                  borderRadius: '999px',
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                <Check className="h-3 w-3" />
              </div>
            </div>

            <div
              className="p-3"
              style={{
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--foreground) / 0.15)',
              }}
            >
              <p className="text-sm font-semibold">Barba completa</p>
              <p className="text-xs opacity-70">30 min · R$ 50,00</p>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            className="w-full mt-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              borderRadius: 'var(--radius)',
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
