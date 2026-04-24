import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon, MonitorSmartphone, RefreshCw } from 'lucide-react';
import { FONT_OPTIONS, RADIUS_OPTIONS } from '@/lib/colorUtils';
import { BookingThemePreview } from './BookingThemePreview';
import { BookingEmbedSnippet } from './BookingEmbedSnippet';
import { BookingThemePresets } from './BookingThemePresets';
import type { BookingThemePreset } from '@/lib/bookingThemePresets';

interface BookingAppearanceValue {
  theme_primary_color?: string;
  theme_background_color?: string;
  theme_text_color?: string;
  theme_mode?: string;
  theme_font_family?: string;
  theme_radius?: string;
  embed_hide_header?: boolean;
}

interface BookingAppearancePanelProps {
  value: BookingAppearanceValue;
  onChange: (updates: Partial<BookingAppearanceValue>) => void;
  storePrimaryColor?: string | null;
  storeName?: string;
  storeSlug?: string;
}

const MODE_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'auto', label: 'Automático', icon: MonitorSmartphone },
];

export function BookingAppearancePanel({
  value,
  onChange,
  storePrimaryColor,
  storeName,
  storeSlug,
}: BookingAppearancePanelProps) {
  const primary = value.theme_primary_color || '#f97316';
  const background = value.theme_background_color || '#ffffff';
  const text = value.theme_text_color || '#0f172a';
  const mode = value.theme_mode || 'light';

  const isSyncedWithStore = !!storePrimaryColor && primary === storePrimaryColor;

  const handleSyncWithStore = () => {
    if (!storePrimaryColor) return;
    onChange({ theme_primary_color: storePrimaryColor });
  };

  const applyDarkPreset = () => {
    onChange({
      theme_mode: 'dark',
      theme_background_color: '#0b0b0d',
      theme_text_color: '#f5f5f5',
    });
  };

  const applyLightPreset = () => {
    onChange({
      theme_mode: 'light',
      theme_background_color: '#ffffff',
      theme_text_color: '#0f172a',
    });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-6">
        {storePrimaryColor && (
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div>
              <p className="text-sm font-medium">Cores da loja</p>
              <p className="text-xs text-muted-foreground">
                {isSyncedWithStore
                  ? 'Cor principal sincronizada com a personalização da loja.'
                  : 'Aplicar a cor principal já configurada na loja.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full border shadow-sm"
                style={{ backgroundColor: storePrimaryColor }}
              />
              <Button
                type="button"
                size="sm"
                variant={isSyncedWithStore ? 'secondary' : 'outline'}
                onClick={handleSyncWithStore}
                disabled={isSyncedWithStore}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {isSyncedWithStore ? 'Sincronizado' : 'Sincronizar'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Modo</Label>
          <div className="grid grid-cols-3 gap-2">
            {MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (opt.value === 'dark') applyDarkPreset();
                    else if (opt.value === 'light') applyLightPreset();
                    else onChange({ theme_mode: 'auto' });
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors ${
                    active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ColorField
            id="theme_primary_color"
            label="Cor principal"
            value={primary}
            fallback="#f97316"
            onChange={(v) => onChange({ theme_primary_color: v })}
          />
          <ColorField
            id="theme_background_color"
            label="Cor de fundo"
            value={background}
            fallback="#ffffff"
            onChange={(v) => onChange({ theme_background_color: v })}
          />
          <ColorField
            id="theme_text_color"
            label="Cor do texto"
            value={text}
            fallback="#0f172a"
            onChange={(v) => onChange({ theme_text_color: v })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Família de fonte</Label>
            <Select
              value={value.theme_font_family || 'inter'}
              onValueChange={(v) => onChange({ theme_font_family: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Raio dos cantos</Label>
            <Select
              value={value.theme_radius || '0.5rem'}
              onValueChange={(v) => onChange({ theme_radius: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="space-y-0.5">
            <Label className="text-sm">Esconder cabeçalho no embed</Label>
            <p className="text-xs text-muted-foreground">
              Quando o iframe for incorporado no site (?embed=1), o cabeçalho da loja é oculto.
            </p>
          </div>
          <Switch
            checked={value.embed_hide_header ?? true}
            onCheckedChange={(c) => onChange({ embed_hide_header: c })}
          />
        </div>

        <BookingEmbedSnippet storeSlug={storeSlug || ''} />
      </div>

      <div className="space-y-3">
        <BookingThemePreview theme={value} storeName={storeName} />
        <p className="text-xs text-muted-foreground text-center">
          Pré-visualização aproximada do passo "Escolha o serviço".
        </p>
      </div>
    </div>
  );
}

function ColorField({
  id, label, value, fallback, onChange,
}: { id: string; label: string; value: string; fallback: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1 cursor-pointer"
        />
        <Input
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          className="flex-1 font-mono text-xs"
        />
      </div>
    </div>
  );
}
