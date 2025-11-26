import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/utils';

interface EditDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  onSuccess: () => void;
}

export function EditDriverDialog({ open, onOpenChange, driver, onSuccess }: EditDriverDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: driver.full_name,
    email: driver.email,
    phone: driver.phone ? formatPhone(driver.phone) : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar email
      if (formData.email !== driver.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error('Formato de email inválido');
          setLoading(false);
          return;
        }
      }

      // Validar telefone se fornecido
      if (formData.phone) {
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          toast.error('Formato de telefone inválido. Use (XX) XXXXX-XXXX');
          setLoading(false);
          return;
        }
      }

      // Atualizar perfil no profiles
      const profileUpdates: any = { 
        full_name: formData.full_name 
      };
      
      if (formData.phone) {
        profileUpdates.phone = formData.phone.replace(/\D/g, '');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', driver.id);

      if (profileError) throw profileError;

      // Se email foi alterado, usar Admin API do Supabase
      if (formData.email !== driver.email) {
        // Criar token de admin para chamar a função
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('Sessão expirada. Faça login novamente.');
          setLoading(false);
          return;
        }

        // Chamar edge function para atualizar email
        const { data, error: emailError } = await supabase.functions.invoke('update-driver-profile', {
          body: {
            email: formData.email
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (emailError || data?.error) {
          throw new Error(data?.error || emailError?.message || 'Erro ao atualizar email');
        }
      }

      toast.success('Entregador atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar entregador:', error);
      toast.error(error.message || 'Erro ao atualizar entregador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Entregador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              placeholder="Nome do entregador"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="email@exemplo.com"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ O entregador precisará fazer login novamente se o email for alterado
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
              placeholder="(XX) XXXXX-XXXX"
              maxLength={15}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
