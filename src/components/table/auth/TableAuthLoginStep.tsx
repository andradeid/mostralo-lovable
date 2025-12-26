import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TableAuthLoginStepProps {
  phone: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  showForgotPassword?: boolean;
}

export function TableAuthLoginStep({
  phone,
  password,
  onPasswordChange,
  onSubmit,
  onBack,
  isLoading,
  showForgotPassword = false
}: TableAuthLoginStepProps) {
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleForgotPassword = async () => {
    if (isSendingRecovery || recoverySent) return;
    
    setIsSendingRecovery(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-recovery', {
        body: { phone: phone.replace(/\D/g, '') }
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Erro ao enviar senha. Tente novamente.');
        return;
      }

      setRecoverySent(true);
      toast.success('Senha enviada! Verifique seu WhatsApp.');
    } catch (err) {
      console.error('Erro ao recuperar senha:', err);
      toast.error('Erro ao enviar senha. Tente novamente.');
    } finally {
      setIsSendingRecovery(false);
    }
  };

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

      {showForgotPassword && (
        <div className="text-center">
          {recoverySent ? (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" />
              Senha enviada para seu WhatsApp!
            </p>
          ) : (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleForgotPassword}
              disabled={isSendingRecovery}
              className="text-muted-foreground hover:text-primary"
            >
              {isSendingRecovery ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Esqueci minha senha'
              )}
            </Button>
          )}
        </div>
      )}

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
