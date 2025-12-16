import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings2, MapPin, Clock, CreditCard, Truck, DollarSign } from "lucide-react";

interface PromptSettings {
  includeLocation: boolean;
  includeBusinessHours: boolean;
  includePaymentMethods: boolean;
  includeDeliveryFee: boolean;
  includeMinOrder: boolean;
}

interface BotPromptSettingsCardProps {
  settings: PromptSettings;
  onSettingsChange: (settings: PromptSettings) => void;
  disabled?: boolean;
}

export function BotPromptSettingsCard({ 
  settings, 
  onSettingsChange, 
  disabled = false 
}: BotPromptSettingsCardProps) {
  const handleChange = (key: keyof PromptSettings, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const options = [
    {
      key: 'includeLocation' as const,
      label: 'Localização',
      description: 'Link do Google Maps e endereço completo',
      icon: MapPin,
      color: 'text-blue-500'
    },
    {
      key: 'includeBusinessHours' as const,
      label: 'Horário de Funcionamento',
      description: 'Dias e horários de atendimento',
      icon: Clock,
      color: 'text-orange-500'
    },
    {
      key: 'includePaymentMethods' as const,
      label: 'Formas de Pagamento',
      description: 'PIX, cartão, dinheiro',
      icon: CreditCard,
      color: 'text-green-500'
    },
    {
      key: 'includeDeliveryFee' as const,
      label: 'Taxa de Entrega',
      description: 'Valor da taxa de delivery',
      icon: Truck,
      color: 'text-purple-500'
    },
    {
      key: 'includeMinOrder' as const,
      label: 'Pedido Mínimo',
      description: 'Valor mínimo para pedidos',
      icon: DollarSign,
      color: 'text-yellow-500'
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4" />
          Informações no Prompt
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Selecione quais informações o bot deve conhecer e informar aos clientes
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <div 
              key={option.key}
              className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={option.key}
                checked={settings[option.key]}
                onCheckedChange={(checked) => handleChange(option.key, checked as boolean)}
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-0.5">
                <Label 
                  htmlFor={option.key} 
                  className="flex items-center gap-2 cursor-pointer font-medium text-sm"
                >
                  <Icon className={`h-3.5 w-3.5 ${option.color}`} />
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
