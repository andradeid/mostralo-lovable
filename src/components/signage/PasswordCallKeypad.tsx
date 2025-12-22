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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Chamar {callTypeLabels[callType]}
          </CardTitle>
          <Badge variant="secondary">{calls.length} no histórico</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle de tipo */}
        <div className="flex gap-2">
          {(['password', 'order', 'table'] as CallType[]).map((type) => (
            <Button
              key={type}
              variant={callType === type ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setCallType(type)}
            >
              {callTypeLabels[type]}
            </Button>
          ))}
        </div>

        {/* Display do número */}
        <div 
          className="text-center py-6 rounded-lg border-2 border-dashed"
          style={{ borderColor: number ? config?.primary_color : undefined }}
        >
          <p className="text-4xl font-bold tracking-widest" style={{ color: number ? config?.primary_color : undefined }}>
            {number || '---'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {callTypeLabels[callType]}
          </p>
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <Button
              key={digit}
              variant="outline"
              className="h-14 text-xl font-semibold"
              onClick={() => handleDigit(digit)}
            >
              {digit}
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-14"
            onClick={handleClear}
          >
            C
          </Button>
          <Button
            variant="outline"
            className="h-14 text-xl font-semibold"
            onClick={() => handleDigit('0')}
          >
            0
          </Button>
          <Button
            variant="outline"
            className="h-14"
            onClick={handleBackspace}
          >
            <Delete className="h-5 w-5" />
          </Button>
        </div>

        {/* Botão Chamar */}
        <Button 
          className="w-full h-14 text-lg"
          style={{ backgroundColor: config?.primary_color }}
          onClick={handleCall}
          disabled={!number.trim() || calling}
        >
          {calling ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Megaphone className="h-5 w-5 mr-2" />
          )}
          Chamar {callTypeLabels[callType]} {number || ''}
        </Button>

        {/* Limpar histórico */}
        {calls.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Histórico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso removerá todas as {calls.length} chamadas do histórico. Esta ação não pode ser desfeita.
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
