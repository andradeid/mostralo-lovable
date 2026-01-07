import { useState, useCallback } from 'react';
import { Smartphone, CheckCircle2, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { formatBrazilianPhone, formatInternationalPhone, cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WhatsAppValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

interface PatientWhatsAppValidatorProps {
  phone: string;
  countryCode: string;
  onPhoneChange: (phone: string) => void;
  onCountryCodeChange: (code: string) => void;
  onStatusChange: (status: WhatsAppValidationStatus) => void;
  status: WhatsAppValidationStatus;
  disabled?: boolean;
  label?: string;
}

export function PatientWhatsAppValidator({
  phone,
  countryCode,
  onPhoneChange,
  onCountryCodeChange,
  onStatusChange,
  status,
  disabled,
  label = "Telefone / WhatsApp"
}: PatientWhatsAppValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);

  const handlePhoneChange = (value: string) => {
    const formatted = countryCode === '+55'
      ? formatBrazilianPhone(value)
      : formatInternationalPhone(value);
    onPhoneChange(formatted);
    // Reset status when phone changes
    if (status !== 'idle') {
      onStatusChange('idle');
    }
  };

  const handleCountryCodeChange = (code: string) => {
    onCountryCodeChange(code);
    // Reset phone format when country changes
    if (phone) {
      const numbers = phone.replace(/\D/g, '');
      const formatted = code === '+55'
        ? formatBrazilianPhone(numbers)
        : formatInternationalPhone(numbers);
      onPhoneChange(formatted);
    }
  };

  const validateWhatsApp = useCallback(async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Digite um número de telefone válido');
      return;
    }

    setIsValidating(true);
    onStatusChange('validating');

    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { 
          phone: cleanPhone,
          sendWelcome: false
        }
      });

      if (error) {
        console.error('Erro ao validar WhatsApp:', error);
        onStatusChange('invalid');
        toast.error('Erro ao validar WhatsApp');
        return;
      }

      if (data?.valid) {
        onStatusChange('valid');
        toast.success('WhatsApp verificado com sucesso!');
      } else {
        onStatusChange('invalid');
        toast.warning(data?.error || 'WhatsApp não encontrado');
      }
    } catch (err) {
      console.error('Erro na validação:', err);
      onStatusChange('invalid');
      toast.error('Erro ao validar WhatsApp');
    } finally {
      setIsValidating(false);
    }
  }, [phone, onStatusChange]);

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'validating':
        return 'Verificando...';
      case 'valid':
        return 'WhatsApp verificado';
      case 'invalid':
        return 'WhatsApp não encontrado';
      default:
        return '';
    }
  };

  const canValidate = phone.replace(/\D/g, '').length >= 10 && !isValidating && status !== 'valid';

  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-emerald-500" />
        {label}
      </Label>
      <div className="flex gap-2">
        <CountryCodeSelect
          value={countryCode}
          onChange={handleCountryCodeChange}
          disabled={disabled}
        />
        <div className="relative flex-1">
          <Input
            id="phone"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={countryCode === '+55' ? '(11) 99999-9999' : '999 999 9999'}
            disabled={disabled}
            className={cn(
              "pr-8",
              status === 'valid' && 'border-emerald-500 focus-visible:ring-emerald-500',
              status === 'invalid' && 'border-amber-500 focus-visible:ring-amber-500'
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={validateWhatsApp}
          disabled={!canValidate || disabled}
          className="shrink-0"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Validar'
          )}
        </Button>
      </div>
      {status !== 'idle' && (
        <p className={cn(
          "text-xs flex items-center gap-1",
          status === 'validating' && 'text-muted-foreground',
          status === 'valid' && 'text-emerald-500',
          status === 'invalid' && 'text-amber-500'
        )}>
          {status === 'validating' && (
            <span className="animate-pulse">●</span>
          )}
          {getStatusText()}
        </p>
      )}
    </div>
  );
}
