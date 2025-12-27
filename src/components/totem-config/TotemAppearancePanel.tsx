import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { Monitor, Smartphone } from 'lucide-react';

interface TotemAppearancePanelProps {
  config: Partial<TotemConfig>;
  onChange: (updates: Partial<TotemConfig>) => void;
}

export function TotemAppearancePanel({ config, onChange }: TotemAppearancePanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Orientação do Totem</Label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => onChange({ orientation: 'vertical' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
              config.orientation === 'vertical'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Smartphone className="h-8 w-8" />
            <span className="text-sm font-medium">Vertical (9:16)</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ orientation: 'horizontal' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
              config.orientation === 'horizontal'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Monitor className="h-8 w-8" />
            <span className="text-sm font-medium">Horizontal (16:9)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="theme_color">Cor Principal</Label>
          <div className="flex gap-2">
            <Input
              id="theme_color"
              type="color"
              value={config.theme_color || '#f97316'}
              onChange={(e) => onChange({ theme_color: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={config.theme_color || '#f97316'}
              onChange={(e) => onChange({ theme_color: e.target.value })}
              className="flex-1"
              placeholder="#f97316"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background_color">Cor de Fundo</Label>
          <div className="flex gap-2">
            <Input
              id="background_color"
              type="color"
              value={config.background_color || '#ffffff'}
              onChange={(e) => onChange({ background_color: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={config.background_color || '#ffffff'}
              onChange={(e) => onChange({ background_color: e.target.value })}
              className="flex-1"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Modo Escuro</Label>
          <p className="text-sm text-muted-foreground">Usar tema escuro no totem</p>
        </div>
        <Switch
          checked={config.dark_mode || false}
          onCheckedChange={(checked) => onChange({ dark_mode: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Exibir Logo</Label>
          <p className="text-sm text-muted-foreground">Mostrar logo da loja no totem</p>
        </div>
        <Switch
          checked={config.show_logo ?? true}
          onCheckedChange={(checked) => onChange({ show_logo: checked })}
        />
      </div>

      {config.show_logo && (
        <div className="space-y-2">
          <Label>Tamanho do Logo</Label>
          <Select
            value={config.logo_size || 'medium'}
            onValueChange={(value) => onChange({ logo_size: value as 'small' | 'medium' | 'large' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
