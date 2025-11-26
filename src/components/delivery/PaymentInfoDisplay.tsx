import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { maskPixKey, getPixKeyTypeName, type PixKeyType } from '@/utils/pixValidation';

interface PaymentInfoDisplayProps {
  pixKeyType: PixKeyType;
  pixKey: string;
  accountHolderName: string;
  showCopyButton?: boolean;
  variant?: 'card' | 'inline';
}

export function PaymentInfoDisplay({
  pixKeyType,
  pixKey,
  accountHolderName,
  showCopyButton = true,
  variant = 'card'
}: PaymentInfoDisplayProps) {
  const [showFullKey, setShowFullKey] = useState(false);

  const displayKey = showFullKey ? pixKey : maskPixKey(pixKey, pixKeyType);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast.success('Chave PIX copiada!');
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1">
          <CreditCard className="w-3 h-3" />
          {getPixKeyTypeName(pixKeyType)}
        </Badge>
        <span className="text-sm font-mono">{displayKey}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setShowFullKey(!showFullKey)}
        >
          {showFullKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </Button>
        {showCopyButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopyKey}
          >
            <Copy className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Informações de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Tipo de Chave</p>
          <Badge variant="secondary">{getPixKeyTypeName(pixKeyType)}</Badge>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">Chave PIX</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-muted p-2 rounded font-mono">
              {displayKey}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFullKey(!showFullKey)}
            >
              {showFullKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            {showCopyButton && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyKey}
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">Titular</p>
          <p className="text-sm font-medium">{accountHolderName}</p>
        </div>
      </CardContent>
    </Card>
  );
}
