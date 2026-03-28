import { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Mail, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone } from '@/lib/utils';
import { toast } from 'sonner';

interface CustomerDataStepProps {
  customerName: string;
  onNameChange: (name: string) => void;
  customerPhone: string;
  onPhoneChange: (phone: string) => void;
  customerEmail: string;
  onEmailChange: (email: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  primaryColor?: string;
  secondaryColor?: string;
  storeId: string;
  onCustomerIdentified?: (customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    token: string;
  }) => void;
}

export const CustomerDataStep = ({
  customerName,
  onNameChange,
  customerPhone,
  onPhoneChange,
  customerEmail,
  onEmailChange,
  notes,
  onNotesChange,
  primaryColor = '#FF9500',
  secondaryColor,
  storeId,
  onCustomerIdentified,
}: CustomerDataStepProps) => {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedName, setIdentifiedName] = useState<string | null>(null);
  const lastCheckedPhone = useRef('');

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const identifyByPhone = useCallback(async (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) return;

    // Evitar buscas duplicadas
    const normalized = normalizePhone(rawPhone);
    if (normalized === lastCheckedPhone.current) return;
    lastCheckedPhone.current = normalized;

    setIsIdentifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-auth-v2', {
        body: {
          action: 'identify-by-phone',
          phone: normalized,
          store_id: storeId,
        },
      });

      if (error || data?.error) {
        console.warn('[CustomerDataStep] Erro ao identificar:', error || data?.error);
        setIdentifiedName(null);
        return;
      }

      // Cliente encontrado (existente)
      if (data?.customer && !data.is_new) {
        const c = data.customer;
        setIdentifiedName(c.name);

        // Auto-preencher campos
        if (c.name) onNameChange(c.name);
        if (c.email) onEmailChange(c.email);

        // Salvar token no localStorage
        const profile = {
          customer_id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          latitude: c.latitude,
          longitude: c.longitude,
          token: data.token,
          expires_at: data.expires_at,
          saved_at: new Date().toISOString(),
        };
        localStorage.setItem(`customer_${storeId}`, JSON.stringify(profile));

        // Notificar CheckoutDialog sobre dados recuperados
        onCustomerIdentified?.({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          latitude: c.latitude,
          longitude: c.longitude,
          token: data.token,
        });

        toast.success(`Olá ${c.name}! 👋`, {
          description: 'Recuperamos seus dados de entrega!',
          duration: 3000,
        });
      } else if (data?.customer && data.is_new) {
        // Cliente novo criado - salvar token silenciosamente
        setIdentifiedName(null);
        const profile = {
          customer_id: data.customer.id,
          name: data.customer.name,
          phone: data.customer.phone,
          token: data.token,
          expires_at: data.expires_at,
          saved_at: new Date().toISOString(),
        };
        localStorage.setItem(`customer_${storeId}`, JSON.stringify(profile));

        onCustomerIdentified?.({
          id: data.customer.id,
          name: data.customer.name,
          phone: data.customer.phone,
          token: data.token,
        });
      }
    } catch (err) {
      console.error('[CustomerDataStep] Erro inesperado:', err);
    } finally {
      setIsIdentifying(false);
    }
  }, [storeId, onNameChange, onEmailChange, onCustomerIdentified]);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    onPhoneChange(formatted);

    // Auto-identificar quando atingir 10-11 dígitos
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 11) {
      identifyByPhone(value);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Seus dados</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Precisamos de algumas informações para finalizar o pedido
        </p>
      </div>

      {/* Mensagem de identificação */}
      {identifiedName && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
            border: `1px solid ${primaryColor}30`,
          }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Olá {identifiedName}, recuperamos seus dados!
        </div>
      )}

      <div className="space-y-4">
        {/* Telefone (PRIMEIRO - é a chave mestra) */}
        <div className="space-y-2">
          <Label htmlFor="customer-phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" style={{ color: primaryColor }} />
            Telefone/WhatsApp *
          </Label>
          <div className="relative">
            <Input
              id="customer-phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={customerPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => identifyByPhone(customerPhone)}
              maxLength={15}
              required
              className="h-12"
            />
            {isIdentifying && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="customer-name" className="flex items-center gap-2">
            <User className="w-4 h-4" style={{ color: primaryColor }} />
            Nome completo *
          </Label>
          <Input
            id="customer-name"
            type="text"
            placeholder="Digite seu nome completo"
            value={customerName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={120}
            required
            className="h-12"
          />
        </div>

        {/* Email (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="customer-email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" style={{ color: primaryColor }} />
            E-mail (opcional)
          </Label>
          <Input
            id="customer-email"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={customerEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            maxLength={255}
            className="h-12"
          />
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} />
            Observações do pedido (opcional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Ex: Sem cebola, ponto da carne mal passada, etc."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            maxLength={500}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {notes.length}/500
          </p>
        </div>
      </div>
    </div>
  );
};
