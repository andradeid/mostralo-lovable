import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, ArrowRight } from 'lucide-react';
import { CountryCodeSelect } from '@/components/ui/country-code-select';

interface TableAuthPhoneStepProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  onSubmit: (countryCode: string) => void;
  isLoading: boolean;
}

export function TableAuthPhoneStep({ phone, onPhoneChange, onSubmit, isLoading }: TableAuthPhoneStepProps) {
  const [countryCode, setCountryCode] = useState('+55');
  
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    
    // Para Brasil, formatar como (XX) XXXXX-XXXX
    if (countryCode === '+55') {
      if (digits.length <= 2) return digits;
      if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    
    // Para outros países, apenas agrupar
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  // Validação: Brasil precisa de 10-11 dígitos, outros países 7+
  const digits = phone.replace(/\D/g, '');
  const isValid = countryCode === '+55' 
    ? digits.length >= 10 
    : digits.length >= 7;

  const handleSubmit = () => {
    onSubmit(countryCode);
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" /> Telefone
        </Label>
        <div className="flex gap-2">
          <CountryCodeSelect 
            value={countryCode}
            onChange={setCountryCode}
            disabled={isLoading}
          />
          <Input
            id="phone"
            type="tel"
            placeholder={countryCode === '+55' ? '(00) 00000-0000' : 'Número'}
            value={phone}
            onChange={(e) => onPhoneChange(formatPhone(e.target.value))}
            className="flex-1 text-lg h-12"
            autoFocus
          />
        </div>
      </div>
      <Button 
        onClick={handleSubmit} 
        className="w-full h-12 text-lg"
        disabled={isLoading || !isValid}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Continuar <ArrowRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>
    </>
  );
}
