import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Plus, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPhone } from '@/lib/utils';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface CustomerSelectorProps {
  storeId: string;
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  onCreateNew: () => void;
}

export function CustomerSelector({ 
  storeId, 
  selectedCustomer, 
  onSelect,
  onCreateNew 
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [storeId]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Buscar clientes através de customer_stores
      const { data, error } = await supabase
        .from('customer_stores')
        .select(`
          customer_id,
          customers!inner (
            id,
            name,
            phone,
            email,
            address,
            latitude,
            longitude
          )
        `)
        .eq('store_id', storeId)
        .order('customer_id');

      if (error) throw error;
      
      // Extrair dados dos clientes
      const customersData = data?.map(cs => cs.customers).filter(Boolean) || [];
      setCustomers(customersData as Customer[]);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <Label>Cliente *</Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            disabled={loading}
          >
            {selectedCustomer ? (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {selectedCustomer.name}
              </span>
            ) : (
              "Selecione um cliente"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    onSelect={() => handleSelect(customer)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatPhone(customer.phone)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={onCreateNew}
      >
        <Plus className="h-4 w-4 mr-2" />
        Novo Cliente
      </Button>
      
      {selectedCustomer && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{selectedCustomer.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatPhone(selectedCustomer.phone)}
            </p>
            {selectedCustomer.email && (
              <p className="text-sm text-muted-foreground">
                {selectedCustomer.email}
              </p>
            )}
            {selectedCustomer.address && (
              <p className="text-sm text-muted-foreground">
                📍 {selectedCustomer.address}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
