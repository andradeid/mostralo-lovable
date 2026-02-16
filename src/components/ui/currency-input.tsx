import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Input de moeda brasileira com formatação automática
 * Aceita valor numérico e retorna valor numérico
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    // Converte valor para centavos para manipulação
    const [displayValue, setDisplayValue] = React.useState(() => 
      formatCentsToDisplay(Math.round((value || 0) * 100))
    );

    // Sincroniza quando o valor externo muda
    React.useEffect(() => {
      const externalCents = Math.round((value || 0) * 100);
      const currentCents = parseToCents(displayValue);
      
      if (externalCents !== currentCents) {
        setDisplayValue(formatCentsToDisplay(externalCents));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove tudo que não é número
      const digits = inputValue.replace(/\D/g, '');
      
      // Limita a 10 dígitos (99.999.999,99)
      const limitedDigits = digits.slice(0, 10);
      
      // Converte para centavos
      const cents = parseInt(limitedDigits, 10) || 0;
      
      // Atualiza display
      setDisplayValue(formatCentsToDisplay(cents));
      
      // Notifica o valor em reais
      onChange(cents / 100);
    };

    return (
      <div 
        className="relative"
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={(e) => e.stopPropagation()}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = 'CurrencyInput';

function formatCentsToDisplay(cents: number): string {
  if (cents === 0) return '';
  
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  
  const formattedReais = reais.toLocaleString('pt-BR');
  const formattedCentavos = centavos.toString().padStart(2, '0');
  
  return `${formattedReais},${formattedCentavos}`;
}

function parseToCents(displayValue: string): number {
  const digits = displayValue.replace(/\D/g, '');
  return parseInt(digits, 10) || 0;
}

export { CurrencyInput };
