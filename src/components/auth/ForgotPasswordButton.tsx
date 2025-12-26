import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizePhone } from '@/lib/utils';

interface ForgotPasswordButtonProps {
  phone: string;
  disabled?: boolean;
}

export function ForgotPasswordButton({ phone, disabled }: ForgotPasswordButtonProps) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleForgotPassword = async () => {
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone || normalizedPhone.length < 10) {
      toast.error('Digite seu telefone primeiro');
      return;
    }

    setIsRecovering(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-password-recovery', {
        body: { phone: normalizedPhone }
      });

      if (error || !data?.success) {
        const errorMessage = data?.error || 'Erro ao enviar recuperação';
        toast.error(errorMessage);
        return;
      }

      setRecoverySent(true);
      toast.success('Senha enviada! Verifique seu WhatsApp.');
      
      // Reset após 10 segundos
      setTimeout(() => setRecoverySent(false), 10000);
    } catch (err) {
      console.error('Erro na recuperação:', err);
      toast.error('Erro ao enviar recuperação de senha');
    } finally {
      setIsRecovering(false);
    }
  };

  if (recoverySent) {
    return (
      <div className="flex items-center justify-end gap-1 text-xs text-emerald-600">
        <Check className="h-3 w-3" />
        <span>Senha enviada por WhatsApp!</span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto p-0 text-xs text-muted-foreground hover:text-primary justify-end w-full"
      onClick={handleForgotPassword}
      disabled={disabled || isRecovering}
    >
      {isRecovering ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <MessageCircle className="h-3 w-3 mr-1" />
          Esqueci minha senha
        </>
      )}
    </Button>
  );
}
