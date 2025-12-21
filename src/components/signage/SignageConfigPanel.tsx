import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Save, Loader2, Monitor, Smartphone } from 'lucide-react';
import { SignageConfig } from '@/hooks/useSignage';

interface SignageConfigPanelProps {
  config: SignageConfig | null;
  onSave: (updates: Partial<SignageConfig>) => Promise<boolean>;
}

export function SignageConfigPanel({ config, onSave }: SignageConfigPanelProps) {
  const [formData, setFormData] = useState({
    is_enabled: true,
    transition_type: 'fade' as SignageConfig['transition_type'],
    transition_duration_ms: 500,
    show_clock: false,
    background_color: '#000000',
    orientation: 'horizontal' as SignageConfig['orientation']
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        is_enabled: config.is_enabled,
        transition_type: config.transition_type,
        transition_duration_ms: config.transition_duration_ms,
        show_clock: config.show_clock,
        background_color: config.background_color,
        orientation: config.orientation || 'horizontal'
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Configurações do Painel
        </CardTitle>
        <CardDescription>
          Personalize a exibição do seu painel digital
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ativar Painel */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_enabled">Painel Ativo</Label>
            <p className="text-sm text-muted-foreground">
              Ativar exibição pública do painel
            </p>
          </div>
          <Switch
            id="is_enabled"
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
          />
        </div>

        {/* Orientação da Tela */}
        <div className="space-y-2">
          <Label>Orientação da Tela</Label>
          <Select
            value={formData.orientation}
            onValueChange={(value: SignageConfig['orientation']) => 
              setFormData(prev => ({ ...prev, orientation: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>Horizontal (Paisagem)</span>
                </div>
              </SelectItem>
              <SelectItem value="vertical">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Vertical (Retrato)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {formData.orientation === 'horizontal' 
              ? 'Para TVs convencionais e monitores de mesa (16:9)' 
              : 'Para totens, vitrines e TVs rotacionadas (9:16)'}
          </p>
          {/* Preview visual */}
          <div className="flex gap-4 mt-2">
            <div 
              className={`border-2 rounded transition-colors ${
                formData.orientation === 'horizontal' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted'
              }`}
              style={{ width: 64, height: 36 }}
            />
            <div 
              className={`border-2 rounded transition-colors ${
                formData.orientation === 'vertical' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted'
              }`}
              style={{ width: 36, height: 64 }}
            />
          </div>
        </div>

        {/* Tipo de Transição */}
        <div className="space-y-2">
          <Label>Tipo de Transição</Label>
          <Select
            value={formData.transition_type}
            onValueChange={(value: SignageConfig['transition_type']) => 
              setFormData(prev => ({ ...prev, transition_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fade">Fade (Desvanecer)</SelectItem>
              <SelectItem value="slide">Slide (Deslizar)</SelectItem>
              <SelectItem value="none">Nenhuma</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duração da Transição */}
        <div className="space-y-2">
          <Label htmlFor="transition_duration">Duração da Transição (ms)</Label>
          <Input
            id="transition_duration"
            type="number"
            value={formData.transition_duration_ms}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              transition_duration_ms: Number(e.target.value) 
            }))}
            min={100}
            max={2000}
            step={100}
          />
        </div>

        {/* Mostrar Relógio */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="show_clock">Mostrar Relógio</Label>
            <p className="text-sm text-muted-foreground">
              Exibir hora atual no canto da tela
            </p>
          </div>
          <Switch
            id="show_clock"
            checked={formData.show_clock}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_clock: checked }))}
          />
        </div>

        {/* Cor de Fundo */}
        <div className="space-y-2">
          <Label htmlFor="background_color">Cor de Fundo</Label>
          <div className="flex items-center gap-2">
            <Input
              id="background_color"
              type="color"
              value={formData.background_color}
              onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.background_color}
              onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Salvar */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
