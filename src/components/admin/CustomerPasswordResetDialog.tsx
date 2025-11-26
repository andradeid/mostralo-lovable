import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock } from 'lucide-react';

interface CustomerPasswordResetDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  customerPhone: string;
}

export const CustomerPasswordResetDialog = ({
  open,
  onClose,
  customerId,
  customerName,
  customerPhone,
}: CustomerPasswordResetDialogProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setPassword('');
    setConfirmPassword('');
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Buscar o auth_user_id do cliente
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('auth_user_id')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      if (!customer?.auth_user_id) {
        toast.error('Cliente não possui conta de autenticação');
        setLoading(false);
        return;
      }

      // Chamar a edge function para redefinir a senha
      const { data, error } = await supabase.functions.invoke('reset-customer-password', {
        body: {
          auth_user_id: customer.auth_user_id,
          new_password: password,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Senha redefinida com sucesso!');
        handleReset();
        onClose();
      } else {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Redefinir Senha do Cliente
          </DialogTitle>
          <DialogDescription>
            Defina uma nova senha para o cliente <strong>{customerName}</strong>
            <br />
            <span className="text-xs text-muted-foreground">
              Telefone: {customerPhone}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite a nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 6 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleResetPassword} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redefinindo...
              </>
            ) : (
              'Redefinir Senha'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
