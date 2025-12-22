import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Delete, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePasswordCalls } from '@/hooks/usePasswordCalls';
import { PasswordCallConfig } from '@/hooks/usePasswordCallConfig';

interface PasswordCallKeypadProps {
  storeId: string | null;
  config: PasswordCallConfig | null;
}

type CallType = 'password' | 'order' | 'table';

const callTypeLabels: Record<CallType, string> = {
  password: 'Senha',
  order: 'Pedido',
  table: 'Mesa'
};

export function PasswordCallKeypad({ storeId, config }: PasswordCallKeypadProps) {
  const [number, setNumber] = useState('');
  const [callType, setCallType] = useState<CallType>(config?.call_type || 'password');
  const [calling, setCalling] = useState(false);
  const { createCall, clearHistory, calls, loading } = usePasswordCalls({ 
    storeId, 
    limit: 7,
    realtime: false 
  });

  const handleDigit = useCallback((digit: string) => {
    if (number.length < 6) {
      setNumber(prev => prev + digit);
    }
  }, [number.length]);

  const handleBackspace = useCallback(() => {
    setNumber(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setNumber('');
  }, []);

  const handleCall = useCallback(async () => {
    if (!number.trim()) return;
    
    setCalling(true);
    const success = await createCall(number, callType);
    if (success) {
      setNumber('');
    }
    setCalling(false);
  }, [number, callType, createCall]);

  const handleClearHistory = useCallback(async () => {
    await clearHistory();
  }, [clearHistory]);

  if (!config?.is_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Chamada de Senhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Ative a chamada de senhas nas configurações abaixo para usar este recurso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-sm">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Chamar {callTypeLabels[callType]}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">{calls.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        {/* Toggle de tipo - mais compacto */}
        <div className="flex gap-1">
          {(['password', 'order', 'table'] as CallType[]).map((type) => (
            <Button
              key={type}
              variant={callType === type ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setCallType(type)}
            >
              {callTypeLabels[type]}
            </Button>
          ))}
        </div>

        {/* Display do número - compacto */}
        <div 
          className="text-center py-2 rounded-lg border-2 border-dashed"
          style={{ borderColor: number ? config?.primary_color : undefined }}
        >
          <p className="text-2xl font-bold tracking-widest" style={{ color: number ? config?.primary_color : undefined }}>
            {number || '---'}
          </p>
        </div>

        {/* Teclado numérico - compacto */}
        <div className="grid grid-cols-3 gap-1.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <Button
              key={digit}
              variant="outline"
              className="h-10 text-lg font-semibold"
              onClick={() => handleDigit(digit)}
            >
              {digit}
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-10 text-sm"
            onClick={handleClear}
          >
            C
          </Button>
          <Button
            variant="outline"
            className="h-10 text-lg font-semibold"
            onClick={() => handleDigit('0')}
          >
            0
          </Button>
          <Button
            variant="outline"
            className="h-10"
            onClick={handleBackspace}
          >
            <Delete className="h-4 w-4" />
          </Button>
        </div>

        {/* Botão Chamar - compacto */}
        <Button 
          className="w-full h-11 text-base"
          style={{ backgroundColor: config?.primary_color }}
          onClick={handleCall}
          disabled={!number.trim() || calling}
        >
          {calling ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Megaphone className="h-4 w-4 mr-2" />
          )}
          Chamar {number || ''}
        </Button>

        {/* Limpar histórico - compacto */}
        {calls.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar Histórico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso removerá todas as {calls.length} chamadas do histórico.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                  Limpar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
