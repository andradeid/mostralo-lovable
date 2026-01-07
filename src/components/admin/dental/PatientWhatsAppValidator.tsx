import { Smartphone, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { formatBrazilianPhone, formatInternationalPhone, cn } from '@/lib/utils';

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

  const getStatusIcon = () => {
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
