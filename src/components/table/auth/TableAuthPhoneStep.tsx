import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, ArrowRight } from 'lucide-react';

interface TableAuthPhoneStepProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function TableAuthPhoneStep({ phone, onPhoneChange, onSubmit, isLoading }: TableAuthPhoneStepProps) {
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const isValid = phone.replace(/\D/g, '').length >= 10;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" /> Telefone
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={(e) => onPhoneChange(formatPhone(e.target.value))}
          className="text-lg h-12"
          autoFocus
        />
      </div>
      <Button 
        onClick={onSubmit} 
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
