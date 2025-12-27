import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { TotemConfig } from '@/hooks/useTotemConfig';

interface TotemBehaviorPanelProps {
  config: Partial<TotemConfig>;
  onChange: (updates: Partial<TotemConfig>) => void;
}

export function TotemBehaviorPanel({ config, onChange }: TotemBehaviorPanelProps) {
  const inactivityTimeout = config.inactivity_timeout_seconds || 60;
  const passwordDuration = config.password_display_duration_seconds || 15;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Tempo de Inatividade</Label>
          <span className="text-sm font-medium">{inactivityTimeout} segundos</span>
        </div>
        <Slider
          value={[inactivityTimeout]}
          onValueChange={([value]) => onChange({ inactivity_timeout_seconds: value })}
          min={30}
          max={180}
          step={10}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          Tempo sem interação até voltar para a tela inicial
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Tempo de Exibição da Senha</Label>
          <span className="text-sm font-medium">{passwordDuration} segundos</span>
        </div>
        <Slider
          value={[passwordDuration]}
          onValueChange={([value]) => onChange({ password_display_duration_seconds: value })}
          min={5}
          max={60}
          step={5}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          Quanto tempo a senha fica visível após confirmação do pedido
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Exibir Resumo do Pedido</Label>
          <p className="text-sm text-muted-foreground">Mostrar resumo na confirmação</p>
        </div>
        <Switch
          checked={config.show_order_summary_on_confirmation ?? true}
          onCheckedChange={(checked) => onChange({ show_order_summary_on_confirmation: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Imprimir Recibo Automaticamente</Label>
          <p className="text-sm text-muted-foreground">Imprimir após confirmação do pagamento</p>
        </div>
        <Switch
          checked={config.auto_print_receipt || false}
          onCheckedChange={(checked) => onChange({ auto_print_receipt: checked })}
        />
      </div>
    </div>
  );
}
