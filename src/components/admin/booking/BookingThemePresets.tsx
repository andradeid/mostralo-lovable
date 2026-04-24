import { Check, Sparkles } from 'lucide-react';
import { BOOKING_THEME_PRESETS, findMatchingPreset, type BookingThemePreset } from '@/lib/bookingThemePresets';
import { cn } from '@/lib/utils';

interface BookingThemePresetsProps {
  currentTheme: {
    theme_primary_color?: string;
    theme_background_color?: string;
    theme_text_color?: string;
    theme_mode?: string;
  };
  onSelect: (preset: BookingThemePreset) => void;
}

const CATEGORY_LABELS: Record<BookingThemePreset['category'], string> = {
  premium: 'Premium',
  clean: 'Clean',
  colorful: 'Coloridos',
  niche: 'Por nicho',
};

export function BookingThemePresets({ currentTheme, onSelect }: BookingThemePresetsProps) {
  const active = findMatchingPreset(currentTheme);

  const grouped = BOOKING_THEME_PRESETS.reduce<Record<string, BookingThemePreset[]>>((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Temas prontos</h3>
        <span className="text-xs text-muted-foreground">
          Clique para aplicar — você pode editar depois.
        </span>
      </div>

      {Object.entries(grouped).map(([cat, presets]) => (
        <div key={cat} className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {CATEGORY_LABELS[cat as BookingThemePreset['category']]}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {presets.map((p) => {
              const isActive = active?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p)}
                  className={cn(
                    'group relative rounded-lg border-2 overflow-hidden text-left transition-all hover:shadow-md',
                    isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50',
                  )}
                >
                  {/* Mini preview */}
                  <div
                    className="p-3 h-24 flex flex-col justify-between"
                    style={{
                      background: p.theme_background_color,
                      color: p.theme_text_color,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ background: p.theme_primary_color }}
                      />
                      <div
                        className="h-1.5 flex-1 rounded-full opacity-30"
                        style={{ background: p.theme_text_color }}
                      />
                    </div>
                    <div
                      className="self-end text-[10px] font-bold px-2 py-1 rounded"
                      style={{
                        background: p.theme_primary_color,
                        color: p.theme_background_color,
                        borderRadius: p.theme_radius,
                      }}
                    >
                      Continuar
                    </div>
                  </div>

                  <div className="p-2 bg-card border-t">
                    <p className="text-xs font-semibold truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{p.description}</p>
                  </div>

                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
