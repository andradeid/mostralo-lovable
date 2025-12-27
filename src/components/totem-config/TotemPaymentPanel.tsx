import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { TotemConfig } from '@/hooks/useTotemConfig';

interface TotemPaymentPanelProps {
  config: Partial<TotemConfig>;
  onChange: (updates: Partial<TotemConfig>) => void;
}

const paymentOptions = [
  { id: 'pix', label: 'PIX', description: 'Pagamento instantâneo via QR Code' },
  { id: 'card', label: 'Cartão', description: 'Em breve - Integração com maquininha', disabled: true },
];

export function TotemPaymentPanel({ config, onChange }: TotemPaymentPanelProps) {
  const handlePaymentToggle = (methodId: string, checked: boolean) => {
    const currentMethods = config.payment_methods || ['pix'];
    const newMethods = checked
      ? [...currentMethods, methodId]
      : currentMethods.filter(m => m !== methodId);
    onChange({ payment_methods: newMethods });
  };

  const pixTimeout = config.pix_timeout_seconds || 300;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Métodos de Pagamento</Label>
        <div className="space-y-3">
          {paymentOptions.map((option) => (
            <div
              key={option.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${
                option.disabled ? 'opacity-50' : ''
              }`}
            >
              <Checkbox
                id={`payment-${option.id}`}
                checked={(config.payment_methods || ['pix']).includes(option.id)}
                onCheckedChange={(checked) => handlePaymentToggle(option.id, checked as boolean)}
                disabled={option.disabled}
              />
              <div className="space-y-1">
                <label
                  htmlFor={`payment-${option.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Tempo Limite do QR Code PIX</Label>
          <span className="text-sm font-medium">{Math.floor(pixTimeout / 60)} minutos</span>
        </div>
        <Slider
          value={[pixTimeout]}
          onValueChange={([value]) => onChange({ pix_timeout_seconds: value })}
          min={60}
          max={600}
          step={30}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          Tempo que o cliente tem para realizar o pagamento antes de expirar
        </p>
      </div>
    </div>
  );
}
