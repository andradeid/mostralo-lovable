import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  onSuccess: () => void;
}

export function CreateDriverDialog({ open, onOpenChange, storeId, onSuccess }: CreateDriverDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeId) {
      toast.error('Loja não identificada');
      return;
    }

    if (!formData.full_name || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // Chamar edge function para criar entregador
      const { data, error } = await supabase.functions.invoke('create-delivery-driver', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          store_id: storeId
        }
      });

      if (error) throw error;

      if (!data?.success) {
        const errorMessage = data?.error || 'Erro ao criar entregador';
        
        // Melhorar mensagens de erro específicas
        if (errorMessage.includes('already been registered')) {
          throw new Error('Este email já está cadastrado. Use outro email.');
        }
        
        throw new Error(errorMessage);
      }

      toast.success('Entregador criado com sucesso!');
      
      // Limpar formulário
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: ''
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar entregador:', error);
      toast.error(error.message || 'Erro ao criar entregador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Entregador</DialogTitle>
          <DialogDescription>
            Adicione um novo entregador à sua equipe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="João Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="entregador@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
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
              Criar Entregador
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
