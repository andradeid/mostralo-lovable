import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tag, Loader2 } from 'lucide-react';

interface PromotionCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const PromotionCodeInput = ({
  value,
  onChange,
  onApply,
  isLoading = false,
  disabled = false
}: PromotionCodeInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="promotion-code">
        Tem um cupom de desconto?
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="promotion-code"
            placeholder="Digite o código"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            disabled={disabled || isLoading}
            className="pl-10 uppercase"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onApply();
              }
            }}
          />
        </div>
        <Button
          onClick={onApply}
          disabled={!value.trim() || disabled || isLoading}
          variant="secondary"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Aplicando...
            </>
          ) : (
            'Aplicar'
          )}
        </Button>
      </div>
    </div>
  );
};
