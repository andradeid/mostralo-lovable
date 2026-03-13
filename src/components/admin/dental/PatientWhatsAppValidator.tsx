import { useState, useCallback } from 'react';
import { Smartphone, CheckCircle2, AlertCircle, MessageSquare, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatBrazilianPhone, formatInternationalPhone, cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WhatsAppValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

interface WhatsAppContactInfo {
  pushName: string | null;
  pictureUrl: string | null;
  jid: string | null;
  formattedNumber: string | null;
}

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
  const [contactInfo, setContactInfo] = useState<WhatsAppContactInfo | null>(null);

  const handlePhoneChange = (value: string) => {
    const formatted = countryCode === '+55'
      ? formatBrazilianPhone(value)
      : formatInternationalPhone(value);
    onPhoneChange(formatted);
    if (status !== 'idle') {
      onStatusChange('idle');
      setContactInfo(null);
    }
  };

  const handleCountryCodeChange = (code: string) => {
    onCountryCodeChange(code);
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
    setContactInfo(null);

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
        setContactInfo({
          pushName: data.pushName || null,
          pictureUrl: data.pictureUrl || data.profilePictureUrl || null,
          jid: data.jid || null,
          formattedNumber: data.formattedNumber || null,
        });
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

      {status !== 'idle' && !contactInfo && (
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

      {status === 'invalid' && (
        <p className="text-xs text-amber-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Este número não possui WhatsApp ativo
        </p>
      )}

      {/* Card de contato verificado */}
      {status === 'valid' && contactInfo && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <Avatar className="h-11 w-11 border-2 border-emerald-300 shadow-sm">
            {contactInfo.pictureUrl ? (
              <AvatarImage src={contactInfo.pictureUrl} alt={contactInfo.pushName || 'Contato'} />
            ) : null}
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">
                {contactInfo.pushName || 'Contato WhatsApp'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              +{contactInfo.formattedNumber || phone.replace(/\D/g, '')}
            </p>
            {contactInfo.jid && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                {contactInfo.jid}
              </p>
            )}
          </div>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full shrink-0">
            Verificado
          </span>
        </div>
      )}
    </div>
  );
}
