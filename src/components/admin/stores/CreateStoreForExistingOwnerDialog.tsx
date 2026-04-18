import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OwnerOption {
  id: string;
  name: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface CreateStoreForExistingOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateStoreForExistingOwnerDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateStoreForExistingOwnerDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    ownerId: '',
    storeName: '',
    storeSlug: '',
    storeDescription: '',
    storePhone: '',
    storeCity: '',
    storeState: '',
    planId: 'none',
    subscriptionExpiresAt: undefined as Date | undefined,
  });

  useEffect(() => {
    if (open) {
      fetchOwners();
      fetchPlans();
    }
  }, [open]);

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'store_admin');

      if (error) throw error;

      const userIds = [...new Set((roles || []).map((r) => r.user_id))];
      if (userIds.length === 0) {
        setOwners([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const list = (profiles || [])
        .map((p) => ({
          id: p.id,
          name: p.full_name || 'Sem nome',
          email: p.email || '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setOwners(list);
    } catch (err) {
      console.error('Erro ao buscar owners:', err);
      toast.error('Erro ao carregar lista de proprietários');
    } finally {
      setLoadingOwners(false);
    }
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('id, name, price')
      .eq('status', 'active')
      .order('price', { ascending: true });

    if (error) {
      console.error('Erro ao carregar planos:', error);
    } else {
      setPlans(data || []);
    }
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

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
      subscriptionExpiresAt: planId !== 'none' ? addDays(new Date(), 30) : undefined,
    });
  };

  const resetForm = () => {
    setFormData({
      ownerId: '',
      storeName: '',
      storeSlug: '',
      storeDescription: '',
      storePhone: '',
      storeCity: '',
      storeState: '',
      planId: 'none',
      subscriptionExpiresAt: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ownerId) {
      toast.error('Selecione o proprietário da loja');
      return;
    }
    if (!formData.storeName || !formData.storeSlug) {
      toast.error('Preencha nome e slug da loja');
      return;
    }

    setLoading(true);

    try {
      // 1. Validar slug duplicado
      const { data: existing } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', formData.storeSlug)
        .maybeSingle();

      if (existing) {
        toast.error('Já existe uma loja com essa URL. Escolha outra.');
        setLoading(false);
        return;
      }

      // 2. Criar loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: formData.storeName,
          slug: formData.storeSlug,
          description: formData.storeDescription || null,
          phone: formData.storePhone || null,
          city: formData.storeCity || null,
          state: formData.storeState || null,
          owner_id: formData.ownerId,
          plan_id: formData.planId === 'none' ? null : formData.planId,
          subscription_expires_at: formData.subscriptionExpiresAt?.toISOString() || null,
          status: 'active',
        })
        .select()
        .single();

      if (storeError) throw new Error(`Erro ao criar loja: ${storeError.message}`);

      // 3. Vincular role store_admin com a nova loja (multi-loja para o mesmo dono)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: formData.ownerId,
          role: 'store_admin',
          store_id: storeData.id,
        });

      if (roleError) {
        console.error('Erro ao criar role:', roleError);
      }

      // 4. Criar configuração da loja
      const { error: configError } = await supabase
        .from('store_configurations')
        .insert({ store_id: storeData.id });

      if (configError) {
        console.error('Erro ao criar configuração:', configError);
      }

      // 5. Notificar master admin (não bloqueia)
      try {
        await supabase.functions.invoke('send-master-notification', {
          body: {
            type: 'new_store',
            data: {
              name: formData.storeName,
              slug: formData.storeSlug,
              city: formData.storeCity,
              state: formData.storeState,
            },
          },
        });
      } catch (notifyError) {
        console.error('Erro ao enviar notificação master:', notifyError);
      }

      toast.success(`Loja "${formData.storeName}" criada com sucesso!`);
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar loja:', error);
      toast.error(error.message || 'Erro ao criar loja');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    if (!next) resetForm();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Loja
          </DialogTitle>
          <DialogDescription>
            Crie uma loja vazia e atribua a um proprietário (Store Admin) já existente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Proprietário */}
          <div className="space-y-2">
            <Label htmlFor="ownerId" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Proprietário (Store Admin) *
            </Label>
            {loadingOwners ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando proprietários...
              </div>
            ) : (
              <Select
                value={formData.ownerId}
                onValueChange={(v) => setFormData({ ...formData, ownerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o proprietário existente" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              A nova loja será vinculada a este dono. Ele poderá alternar entre lojas no seletor.
            </p>
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
                  placeholder="Ex: Loja Centro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeSlug">URL da Loja *</Label>
                <Input
                  id="storeSlug"
                  value={formData.storeSlug}
                  onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })}
                  placeholder="loja-centro"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="storeState">Estado</Label>
                <Input
                  id="storeState"
                  value={formData.storeState}
                  onChange={(e) => setFormData({ ...formData, storeState: e.target.value })}
                  placeholder="SP"
                  maxLength={2}
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
                <Select value={formData.planId} onValueChange={handlePlanChange}>
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
                      onSelect={(date) =>
                        setFormData({ ...formData, subscriptionExpiresAt: date })
                      }
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
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingOwners}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Loja
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
