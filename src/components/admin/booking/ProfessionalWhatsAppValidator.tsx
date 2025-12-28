import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { formatBrazilianPhone, formatInternationalPhone, cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export type WhatsAppValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

interface ProfessionalWhatsAppValidatorProps {
  phone: string;
  countryCode: string;
  onPhoneChange: (phone: string) => void;
  onCountryCodeChange: (code: string) => void;
  onStatusChange: (status: WhatsAppValidationStatus) => void;
  status: WhatsAppValidationStatus;
  disabled?: boolean;
}

export function ProfessionalWhatsAppValidator({
  phone,
  countryCode,
  onPhoneChange,
  onCountryCodeChange,
  onStatusChange,
  status,
  disabled
}: ProfessionalWhatsAppValidatorProps) {
  
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
        WhatsApp
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

// Componente de animação para o modal de validação
interface WhatsAppValidationOverlayProps {
  status: WhatsAppValidationStatus;
  phone: string;
  professionalName: string;
  storeName?: string;
  onComplete: () => void;
}

export function WhatsAppValidationOverlay({
  status,
  phone,
  professionalName,
  storeName,
  onComplete
}: WhatsAppValidationOverlayProps) {
  useEffect(() => {
    if (status === 'valid' || status === 'invalid') {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);

  const statusConfig = {
    validating: {
      icon: Smartphone,
      title: 'Verificando WhatsApp...',
      subtitle: 'Quase lá!',
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      iconAnimation: 'animate-bounce'
    },
    valid: {
      icon: CheckCircle2,
      title: 'WhatsApp verificado!',
      subtitle: phone,
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      iconAnimation: 'animate-scale-in'
    },
    invalid: {
      icon: AlertCircle,
      title: 'WhatsApp não encontrado',
      subtitle: 'Mas o cadastro será realizado normalmente',
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      iconAnimation: 'animate-scale-in'
    },
    idle: {
      icon: Smartphone,
      title: '',
      subtitle: '',
      bgColor: 'bg-muted',
      iconColor: 'text-muted-foreground',
      iconAnimation: ''
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="relative">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
            config.bgColor
          )}>
            <Icon className={cn(
              "h-12 w-12 transition-all duration-300",
              config.iconColor,
              config.iconAnimation
            )} />
          </div>
          {status === 'validating' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-28 h-28 rounded-full border-2 border-amber-500/20 animate-ping" style={{ animationDuration: '1.2s' }} />
            </div>
          )}
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold animate-fade-in">{config.title}</h3>
          <p className="text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
            {config.subtitle}
          </p>
          {status === 'valid' && (
            <p className="text-emerald-500 text-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
              ✨ Mensagem de boas-vindas será enviada!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Função para validar e enviar mensagem de boas-vindas
export async function validateAndWelcomeProfessional(
  phone: string,
  countryCode: string,
  professionalName: string,
  storeName: string,
  storeId: string,
  onStatusChange: (status: WhatsAppValidationStatus) => void
): Promise<boolean> {
  if (!phone) {
    return true; // Skip validation if no phone
  }

  onStatusChange('validating');
  
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = `${countryCode.replace('+', '')}${cleanPhone}`;

  try {
    // Validate WhatsApp number
    const { data: validationData, error: validationError } = await supabase.functions.invoke(
      'validate-whatsapp-number',
      {
        body: {
          phone: fullPhone,
          storeId
        }
      }
    );

    if (validationError) throw validationError;

    const isValid = validationData?.valid || validationData?.exists;

    if (isValid) {
      onStatusChange('valid');
      // Mensagem de boas-vindas será enviada pela edge function create-professional-account
      return true;
    } else {
      onStatusChange('invalid');
      return false;
    }
  } catch (error) {
    console.error('Error validating WhatsApp:', error);
    onStatusChange('invalid');
    return false;
  }
}
