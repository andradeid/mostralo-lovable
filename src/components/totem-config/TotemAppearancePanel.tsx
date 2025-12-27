import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';

interface TotemAppearancePanelProps {
  config: Partial<TotemConfig>;
  onChange: (updates: Partial<TotemConfig>) => void;
  storePrimaryColor?: string | null;
  storeSecondaryColor?: string | null;
}

export function TotemAppearancePanel({ config, onChange, storePrimaryColor, storeSecondaryColor }: TotemAppearancePanelProps) {
  const hasStoreColors = !!storePrimaryColor;
  
  const handleSyncWithStoreColors = () => {
    onChange({
      theme_color: storePrimaryColor || '#f97316',
      background_color: '#ffffff'
    });
  };

  // Verificar se as cores estão sincronizadas com a loja
  const isSynced = storePrimaryColor && config.theme_color === storePrimaryColor;

  return (
    <div className="space-y-6">
      {/* Botão de sincronização com cores da loja */}
      {hasStoreColors && (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Cores da Loja</p>
            <p className="text-xs text-muted-foreground">
              {isSynced ? 'Cores sincronizadas com a personalização da loja' : 'Use as cores configuradas na personalização da loja'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {storePrimaryColor && (
              <div 
                className="w-6 h-6 rounded-full border shadow-sm" 
                style={{ backgroundColor: storePrimaryColor }}
                title={`Cor principal: ${storePrimaryColor}`}
              />
            )}
            <Button
              type="button"
              variant={isSynced ? "secondary" : "outline"}
              size="sm"
              onClick={handleSyncWithStoreColors}
              disabled={isSynced}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {isSynced ? 'Sincronizado' : 'Sincronizar'}
            </Button>
          </div>
        </div>
      )}

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
