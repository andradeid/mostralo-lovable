import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Mail, MessageSquare } from 'lucide-react';

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
  secondaryColor
}: CustomerDataStepProps) => {
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Seus dados</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Precisamos de algumas informações para finalizar o pedido
        </p>
      </div>

      <div className="space-y-4">
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

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="customer-phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" style={{ color: primaryColor }} />
            Telefone/WhatsApp *
          </Label>
          <Input
            id="customer-phone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={customerPhone}
            onChange={(e) => onPhoneChange(formatPhone(e.target.value))}
            maxLength={15}
            required
            className="h-12"
          />
        </div>

        {/* Email */}
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
