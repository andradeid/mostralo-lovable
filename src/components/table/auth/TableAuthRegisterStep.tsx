import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Lock, ArrowLeft } from 'lucide-react';

interface TableAuthRegisterStepProps {
  name: string;
  password: string;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function TableAuthRegisterStep({
  name,
  password,
  onNameChange,
  onPasswordChange,
  onSubmit,
  onBack,
  isLoading
}: TableAuthRegisterStepProps) {
  const isValid = name.trim() && password.length >= 4;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="h-4 w-4" /> Seu Nome
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Como podemos te chamar?"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="text-lg h-12"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" /> Senha (4-6 dígitos)
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••"
          maxLength={6}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value.replace(/\D/g, ''))}
          className="text-lg h-12 tracking-widest"
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
            'Cadastrar e Pedir'
          )}
        </Button>
      </div>
    </>
  );
}
