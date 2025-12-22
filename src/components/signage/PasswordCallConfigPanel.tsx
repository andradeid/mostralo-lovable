import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Bell, Loader2, Palette, Layout, Clock, History, Volume2 } from 'lucide-react';
import { PasswordCallConfig } from '@/hooks/usePasswordCallConfig';

interface PasswordCallConfigPanelProps {
  config: PasswordCallConfig | null;
  onSave: (updates: Partial<PasswordCallConfig>) => Promise<boolean>;
}

const templates = [
  { value: 'classic', label: 'Clássico', description: 'Fundo escuro, número grande' },
  { value: 'modern', label: 'Moderno', description: 'Gradiente com efeito pulse' },
  { value: 'minimalist', label: 'Minimalista', description: 'Discreto e elegante' },
  { value: 'festive', label: 'Festivo', description: 'Com animação de confetti' },
  { value: 'corporate', label: 'Corporativo', description: 'Profissional com logo' },
];

const callTypes = [
  { value: 'password', label: 'Senha' },
  { value: 'order', label: 'Pedido' },
  { value: 'table', label: 'Mesa' },
];

export function PasswordCallConfigPanel({ config, onSave }: PasswordCallConfigPanelProps) {
  const [saving, setSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(config?.is_enabled ?? false);
  const [callType, setCallType] = useState(config?.call_type ?? 'password');
  const [template, setTemplate] = useState(config?.template ?? 'classic');
  const [showHistory, setShowHistory] = useState(config?.show_history ?? true);
  const [historyCount, setHistoryCount] = useState(config?.history_count ?? 7);
  const [highlightDuration, setHighlightDuration] = useState((config?.highlight_duration_ms ?? 5000) / 1000);
  const [soundEnabled, setSoundEnabled] = useState(config?.sound_enabled ?? true);
  const [primaryColor, setPrimaryColor] = useState(config?.primary_color ?? '#f97316');

  // Sync com config externo
  useEffect(() => {
    if (config) {
      setIsEnabled(config.is_enabled);
      setCallType(config.call_type);
      setTemplate(config.template);
      setShowHistory(config.show_history);
      setHistoryCount(config.history_count);
      setHighlightDuration(config.highlight_duration_ms / 1000);
      setSoundEnabled(config.sound_enabled);
      setPrimaryColor(config.primary_color);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      is_enabled: isEnabled,
      call_type: callType as 'password' | 'order' | 'table',
      template: template as 'classic' | 'modern' | 'minimalist' | 'festive' | 'corporate',
      show_history: showHistory,
      history_count: historyCount,
      highlight_duration_ms: highlightDuration * 1000,
      sound_enabled: soundEnabled,
      primary_color: primaryColor,
    });
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Chamada de Senhas</CardTitle>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
        <CardDescription>
          Configure como as senhas aparecem no painel público
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Chamada */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Tipo de Chamada
          </Label>
          <Select value={callType} onValueChange={(val) => setCallType(val as 'password' | 'order' | 'table')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {callTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Visual */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Template Visual
          </Label>
          <Select value={template} onValueChange={(val) => setTemplate(val as 'classic' | 'modern' | 'minimalist' | 'festive' | 'corporate')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div>
                    <p className="font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Histórico */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Mostrar Histórico
            </Label>
            <Switch
              checked={showHistory}
              onCheckedChange={setShowHistory}
            />
          </div>

          {showHistory && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantidade no histórico</span>
                <span className="font-medium">{historyCount}</span>
              </div>
              <Slider
                value={[historyCount]}
                onValueChange={([val]) => setHistoryCount(val)}
                min={1}
                max={10}
                step={1}
              />
            </div>
          )}
        </div>

        {/* Duração do Destaque */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duração do Pop-up
            </Label>
            <span className="font-medium">{highlightDuration}s</span>
          </div>
          <Slider
            value={[highlightDuration]}
            onValueChange={([val]) => setHighlightDuration(val)}
            min={3}
            max={15}
            step={1}
          />
        </div>

        {/* Som */}
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Som de Notificação
          </Label>
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>

        {/* Cor Principal */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cor Principal
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1"
              placeholder="#f97316"
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <Button 
          className="w-full" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
