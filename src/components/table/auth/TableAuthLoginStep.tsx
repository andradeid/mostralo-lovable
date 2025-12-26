import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';

interface TableAuthLoginStepProps {
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function TableAuthLoginStep({
  password,
  onPasswordChange,
  onSubmit,
  onBack,
  isLoading
}: TableAuthLoginStepProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" /> Sua Senha
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
          disabled={isLoading || !password}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Entrar'
          )}
        </Button>
      </div>
    </>
  );
}
