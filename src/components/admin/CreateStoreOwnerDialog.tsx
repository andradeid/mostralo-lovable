import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addDays } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateStoreOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export const CreateStoreOwnerDialog = ({ open, onOpenChange, onSuccess }: CreateStoreOwnerDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    ownerEmail: '',
    ownerFullName: '',
    ownerPassword: '',
    storeName: '',
    storeSlug: '',
    storeDescription: '',
    storePhone: '',
    storeAddress: '',
    storeCity: '',
    storeState: '',
    planId: 'none',
    subscriptionExpiresAt: undefined as Date | undefined,
  });

  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('id, name, price')
      .eq('status', 'active')
      .order('price', { ascending: true });

    if (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } else {
      setPlans(data || []);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleStoreNameChange = (name: string) => {
    setFormData({
      ...formData,
      storeName: name,
      storeSlug: generateSlug(name),
    });
  };

  const handlePlanChange = (planId: string) => {
    setFormData({
      ...formData,
      planId,
      subscriptionExpiresAt: planId !== 'none' ? addDays(new Date(), 30) : undefined, // Sugerir +30 dias apenas se tiver plano
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar se o slug já existe
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', formData.storeSlug)
        .single();

      if (existingStore) {
        toast.error('Já existe uma loja com essa URL. Escolha outra.');
        setLoading(false);
        return;
      }

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.ownerEmail,
        password: formData.ownerPassword,
        options: {
          data: {
            full_name: formData.ownerFullName,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (authError) throw new Error(`Erro ao criar usuário: ${authError.message}`);
      if (!authData.user) throw new Error('Usuário não foi criado');

      const userId = authData.user.id;

      // 2. Aguardar um pouco para garantir que o perfil seja criado pelo trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Atualizar perfil do usuário
      // IMPORTANTE: Quando criado pelo super admin, já define como 'approved'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.ownerFullName,
          user_type: 'store_admin',
          approval_status: 'approved', // ✅ JÁ APROVADO quando criado pelo admin
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
      }

      // 4. Criar loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: formData.storeName,
          slug: formData.storeSlug,
          description: formData.storeDescription,
          phone: formData.storePhone,
          address: formData.storeAddress,
          city: formData.storeCity,
          state: formData.storeState,
          owner_id: userId,
          plan_id: formData.planId === 'none' ? null : formData.planId,
          subscription_expires_at: formData.subscriptionExpiresAt?.toISOString() || null,
          status: 'active',
        })
        .select()
        .single();

      if (storeError) throw new Error(`Erro ao criar loja: ${storeError.message}`);

      // 5. Criar role de store_admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'store_admin',
          store_id: storeData.id,
        });

      if (roleError) {
        console.error('Erro ao criar role:', roleError);
      }

      // 6. Criar configuração da loja
      const { error: configError } = await supabase
        .from('store_configurations')
        .insert({
          store_id: storeData.id,
        });

      if (configError) {
        console.error('Erro ao criar configuração:', configError);
      }

      toast.success(`Loja "${formData.storeName}" criada com sucesso!`);
      
      // Reset form
      setFormData({
        ownerEmail: '',
        ownerFullName: '',
        ownerPassword: '',
        storeName: '',
        storeSlug: '',
        storeDescription: '',
        storePhone: '',
        storeAddress: '',
        storeCity: '',
        storeState: '',
        planId: 'none',
        subscriptionExpiresAt: undefined,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar loja:', error);
      toast.error(error.message || 'Erro ao criar loja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Lojista</DialogTitle>
          <DialogDescription>
            Cadastre um novo dono de loja e sua loja simultaneamente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Dono da Loja */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Dados do Dono da Loja</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerFullName">Nome Completo *</Label>
                <Input
                  id="ownerFullName"
                  value={formData.ownerFullName}
                  onChange={(e) => setFormData({ ...formData, ownerFullName: e.target.value })}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  placeholder="joao@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerPassword">Senha Inicial *</Label>
              <Input
                id="ownerPassword"
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                O usuário poderá alterar no primeiro acesso
              </p>
            </div>
          </div>

          {/* Dados da Loja */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Dados da Loja</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da Loja *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  placeholder="Restaurante do João"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeSlug">URL da Loja *</Label>
                <Input
                  id="storeSlug"
                  value={formData.storeSlug}
                  onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })}
                  placeholder="restaurante-do-joao"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  mostralo.com/{formData.storeSlug || 'sua-loja'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeDescription">Descrição</Label>
              <Textarea
                id="storeDescription"
                value={formData.storeDescription}
                onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                placeholder="Descreva a loja..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storePhone">Telefone</Label>
                <Input
                  id="storePhone"
                  value={formData.storePhone}
                  onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeCity">Cidade</Label>
                <Input
                  id="storeCity"
                  value={formData.storeCity}
                  onChange={(e) => setFormData({ ...formData, storeCity: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
            </div>
          </div>

          {/* Plano e Assinatura */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Plano e Assinatura (Opcional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planId">Plano</Label>
                <Select
                  value={formData.planId}
                  onValueChange={handlePlanChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Plano</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - R$ {plan.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Expiração</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.subscriptionExpiresAt && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.subscriptionExpiresAt ? (
                        format(formData.subscriptionExpiresAt, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Sem data definida</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.subscriptionExpiresAt}
                      onSelect={(date) => setFormData({ ...formData, subscriptionExpiresAt: date })}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Lojista'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
