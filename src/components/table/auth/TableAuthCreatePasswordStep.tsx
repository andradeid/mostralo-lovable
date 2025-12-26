import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';

interface TableAuthCreatePasswordStepProps {
  customerName: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function TableAuthCreatePasswordStep({
  customerName,
  password,
  onPasswordChange,
  onSubmit,
  onBack,
  isLoading
}: TableAuthCreatePasswordStepProps) {
  const isValid = password.length >= 4;

  return (
    <>
      <div className="p-3 rounded-lg bg-primary/5 text-sm text-center mb-4">
        Olá, <strong>{customerName}</strong>! Crie uma senha para facilitar seus próximos acessos.
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" /> Nova Senha (4-6 dígitos)
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••"
          maxLength={6}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value.replace(/\D/g, ''))}
          className="text-lg h-12 tracking-widest"
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="h-12">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button 
          onClick={onSubmit} 
          className="flex-1 h-12 text-lg"
          disabled={isLoading || !isValid}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Criar e Continuar'
          )}
        </Button>
      </div>
    </>
  );
}
