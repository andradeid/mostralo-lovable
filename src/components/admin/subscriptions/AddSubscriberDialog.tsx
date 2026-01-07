import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useClientSubscriptions } from '@/hooks/useClientSubscriptions';
import { useClientSubscriptionPlans } from '@/hooks/useClientSubscriptionPlans';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface AddSubscriberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  onSuccess: () => void;
}

export function AddSubscriberDialog({ open, onOpenChange, storeId, onSuccess }: AddSubscriberDialogProps) {
  const { createSubscription } = useClientSubscriptions(storeId);
  const { plans, fetchPlans } = useClientSubscriptionPlans(storeId);
  
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Fetch plans when dialog opens
  useEffect(() => {
    if (open && storeId) {
      fetchPlans();
    }
  }, [open, storeId, fetchPlans]);

  // Search customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (!storeId || customerSearch.length < 2) {
        setCustomers([]);
        return;
      }

      setSearchingCustomers(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, phone, email')
          .or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
          .limit(10);

        if (error) throw error;
        setCustomers(data || []);
      } catch (err) {
        console.error('Error searching customers:', err);
      } finally {
        setSearchingCustomers(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [storeId, customerSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedPlanId) return;

    setLoading(true);
    try {
      await createSubscription(selectedCustomer.id, selectedPlanId, { notes: notes || undefined });
      onSuccess();
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedPlanId('');
    setNotes('');
    setCustomerSearch('');
    setCustomers([]);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const activePlans = plans.filter(p => p.is_active);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Assinante</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Search */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchingCustomers && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </div>
                )}
                {customers.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {customers.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full p-2 text-left hover:bg-muted border-b last:border-b-0"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch('');
                          setCustomers([]);
                        }}
                      >
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
                {customerSearch.length >= 2 && !searchingCustomers && customers.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                )}
              </div>
            )}
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Plano *</Label>
            {activePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum plano ativo. Crie um plano primeiro.
              </p>
            ) : (
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{plan.name}</span>
                        <span className="text-muted-foreground">
                          R$ {plan.price.toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações opcionais..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedCustomer || !selectedPlanId}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar Assinante
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
