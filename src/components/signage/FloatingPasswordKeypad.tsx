import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Megaphone, X, Delete, RotateCcw } from 'lucide-react';
import { PasswordCallConfig } from '@/hooks/usePasswordCallConfig';
import { usePasswordCalls } from '@/hooks/usePasswordCalls';
import { cn } from '@/lib/utils';

type CallType = 'password' | 'order' | 'table';

interface FloatingPasswordKeypadProps {
  storeId: string;
  config: PasswordCallConfig;
}

const callTypeLabels: Record<CallType, string> = {
  password: 'Senha',
  order: 'Pedido',
  table: 'Mesa',
};

export function FloatingPasswordKeypad({ storeId, config }: FloatingPasswordKeypadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [callType, setCallType] = useState<CallType>(config.call_type || 'password');
  const [calling, setCalling] = useState(false);

  const { createCall } = usePasswordCalls({ storeId });

  const handleDigit = useCallback((digit: string) => {
    setNumber(prev => (prev + digit).slice(0, 4));
  }, []);

  const handleBackspace = useCallback(() => {
    setNumber(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setNumber('');
  }, []);

  const handleCall = useCallback(async () => {
    if (!number) return;
    setCalling(true);
    const success = await createCall(number, callType);
    if (success) {
      setNumber('');
    }
    setCalling(false);
  }, [number, callType, createCall]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Painel expandido */}
      {isOpen && (
        <div 
          className={cn(
            "mb-2 bg-background border rounded-xl shadow-2xl overflow-hidden",
            "animate-in slide-in-from-bottom-2 fade-in duration-200",
            "w-[280px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Chamar</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-3 space-y-3">
            {/* Tipo de chamada */}
            <div className="grid grid-cols-3 gap-1">
              {(['password', 'order', 'table'] as CallType[]).map((type) => (
                <Button
                  key={type}
                  variant={callType === type ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setCallType(type)}
                >
                  {callTypeLabels[type]}
                </Button>
              ))}
            </div>

            {/* Display */}
            <div className="bg-muted rounded-lg p-3 text-center">
              <span className="text-3xl font-bold tracking-widest">
                {number || '---'}
              </span>
            </div>

            {/* Teclado numérico */}
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <Button
                  key={digit}
                  variant="outline"
                  className="h-11 text-lg font-semibold"
                  onClick={() => handleDigit(digit.toString())}
                >
                  {digit}
                </Button>
              ))}
              <Button
                variant="outline"
                className="h-11"
                onClick={handleClear}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-11 text-lg font-semibold"
                onClick={() => handleDigit('0')}
              >
                0
              </Button>
              <Button
                variant="outline"
                className="h-11"
                onClick={handleBackspace}
              >
                <Delete className="h-4 w-4" />
              </Button>
            </div>

            {/* Botão chamar */}
            <Button
              className="w-full h-11 text-base font-semibold gap-2"
              disabled={!number || calling}
              onClick={handleCall}
            >
              <Megaphone className="h-4 w-4" />
              {calling ? 'Chamando...' : `Chamar ${callTypeLabels[callType]}`}
            </Button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <Button
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg",
          "hover:scale-105 transition-transform",
          isOpen && "bg-muted text-muted-foreground hover:bg-muted"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Megaphone className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
