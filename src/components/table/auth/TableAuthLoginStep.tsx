import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, ArrowLeft, MessageCircle, AlertCircle } from 'lucide-react';
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
  loginError?: string | null;
}

export function TableAuthLoginStep({
  phone,
  password,
  onPasswordChange,
  onSubmit,
  onBack,
  isLoading,
  showForgotPassword = true,
  loginError
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

  // Check if there's a login error (password incorrect)
  const hasLoginError = loginError && loginError.toLowerCase().includes('senha');

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
          className={`text-lg h-12 tracking-widest ${hasLoginError ? 'border-destructive' : ''}`}
          autoFocus
        />
      </div>

      {/* Show error alert with recovery suggestion when password is wrong */}
      {hasLoginError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-1">
            <span>Senha incorreta.</span>
            {!recoverySent && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleForgotPassword}
                disabled={isSendingRecovery}
                className="text-destructive-foreground underline p-0 h-auto justify-start"
              >
                {isSendingRecovery ? 'Enviando...' : 'Receber senha por WhatsApp'}
              </Button>
            )}
            {recoverySent && (
              <span className="text-xs flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Senha enviada para seu WhatsApp!
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Standard forgot password button (when no error) */}
      {showForgotPassword && !hasLoginError && (
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
