import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { Bell, User, Store, Briefcase, Package, CreditCard, AlertTriangle, BarChart3, Save, Loader2 } from "lucide-react";
import { formatBrazilianPhone, formatInternationalPhone } from "@/lib/utils";
import { toast } from "sonner";
import type { MasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";

interface NotificationOption {
  key: keyof MasterWhatsAppConfig;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
}

const notificationOptions: NotificationOption[] = [
  {
    key: 'notify_new_lead',
    label: 'Novo Lead',
    description: 'Quando um lead se cadastrar',
    icon: <User className="h-4 w-4 text-green-500" />,
    defaultEnabled: true
  },
  {
    key: 'notify_new_store',
    label: 'Lojista Assinou',
    description: 'Novo lojista assinou plano',
    icon: <Store className="h-4 w-4 text-blue-500" />,
    defaultEnabled: true
  },
  {
    key: 'notify_new_seller',
    label: 'Vendedor Cadastrou',
    description: 'Vendedor se cadastrou',
    icon: <Briefcase className="h-4 w-4 text-purple-500" />,
    defaultEnabled: true
  },
  {
    key: 'notify_new_order',
    label: 'Novo Pedido',
    description: 'Pedido nos cardápios',
    icon: <Package className="h-4 w-4 text-orange-500" />,
    defaultEnabled: false
  },
  {
    key: 'notify_payment_received',
    label: 'Pagamento Recebido',
    description: 'Pagamento processado',
    icon: <CreditCard className="h-4 w-4 text-emerald-500" />,
    defaultEnabled: false
  },
  {
    key: 'notify_instance_disconnected',
    label: 'Instância Desconectou',
    description: 'WhatsApp desconectou',
    icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
    defaultEnabled: true
  },
  {
    key: 'notify_daily_summary',
    label: 'Resumo Diário',
    description: 'Enviado às 9h',
    icon: <BarChart3 className="h-4 w-4 text-cyan-500" />,
    defaultEnabled: false
  }
];

interface MasterNotificationsCardProps {
  config: MasterWhatsAppConfig | null;
  updateConfig: (updates: Partial<MasterWhatsAppConfig>) => Promise<boolean>;
  instanceStatus: string;
}

export function MasterNotificationsCard({ config, updateConfig, instanceStatus }: MasterNotificationsCardProps) {
  const [countryCode, setCountryCode] = useState(config?.notification_country_code || '+55');
  const [phone, setPhone] = useState(config?.notification_phone || '');
  const [saving, setSaving] = useState(false);

  const handleSavePhone = async () => {
    if (!phone.trim()) {
      toast.error('Digite o número de WhatsApp');
      return;
    }

    setSaving(true);
    try {
      const success = await updateConfig({
        notification_phone: phone.replace(/\D/g, ''),
        notification_country_code: countryCode
      } as Partial<MasterWhatsAppConfig>);

      if (success) {
        toast.success('Número de notificações salvo!');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key: keyof MasterWhatsAppConfig, enabled: boolean) => {
    await updateConfig({ [key]: enabled } as Partial<MasterWhatsAppConfig>);
  };

  const isConnected = instanceStatus === 'connected' || instanceStatus === 'open';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-5 h-5 text-primary" />
          Notificações
        </CardTitle>
        <CardDescription className="text-xs">
          Receba alertas importantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo de número */}
        <div className="space-y-2">
          <Label className="text-xs">Número para Notificações</Label>
          <div className="flex gap-1">
            <CountryCodeSelect
              value={countryCode}
              onChange={setCountryCode}
              disabled={!isConnected}
            />
            <Input
              className="flex-1 text-sm"
              placeholder={countryCode === '+55' ? "(00) 00000-0000" : "Número"}
              value={phone}
              onChange={(e) => {
                const formatted = countryCode === '+55'
                  ? formatBrazilianPhone(e.target.value)
                  : formatInternationalPhone(e.target.value);
                setPhone(formatted);
              }}
              maxLength={countryCode === '+55' ? 16 : 20}
              disabled={!isConnected}
            />
          </div>
          <Button 
            size="sm" 
            className="w-full mt-2"
            onClick={handleSavePhone}
            disabled={!isConnected || saving}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Salvar Número
          </Button>
        </div>

        {/* Divisor */}
        <div className="border-t" />

        {/* Lista de notificações */}
        <div className="space-y-3">
          {notificationOptions.map((option) => {
            const currentValue = config?.[option.key] as boolean | undefined;
            const isEnabled = currentValue ?? option.defaultEnabled;
            
            return (
              <div key={option.key} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {option.icon}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{option.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{option.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggleNotification(option.key, checked)}
                  disabled={!isConnected}
                />
              </div>
            );
          })}
        </div>

        {!isConnected && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Conecte o WhatsApp para ativar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
