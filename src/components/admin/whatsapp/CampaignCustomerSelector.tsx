import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Search, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Users,
  Phone,
  Shield,
  UserCheck,
  UserX,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp_valid: boolean | null;
  whatsapp_validated_at: string | null;
  total_orders?: number;
  last_order_at?: string;
}

interface CampaignCustomerSelectorProps {
  storeId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  customers?: Customer[];
  onValidate?: (customerIds: string[]) => Promise<void>;
  validating?: boolean;
}

export function CampaignCustomerSelector({
  storeId,
  selectedIds,
  onSelectionChange,
  customers: externalCustomers,
  onValidate,
  validating = false,
}: CampaignCustomerSelectorProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalCustomers) {
      setCustomers(externalCustomers);
    } else if (storeId) {
      fetchCustomers();
    }
  }, [storeId, externalCustomers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_stores')
        .select(`
          customer:customers(
            id, 
            name, 
            phone, 
            whatsapp_valid, 
            whatsapp_validated_at,
            total_orders,
            last_order_at
          )
        `)
        .eq('store_id', storeId);

      if (error) throw error;

      const customerList = data
        ?.map(cs => cs.customer)
        .filter(Boolean)
        .filter(c => c?.phone) as Customer[];

      setCustomers(customerList || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const search = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(search) ||
      c.phone?.includes(search)
    );
  }, [customers, searchTerm]);

  const stats = useMemo(() => {
    const valid = customers.filter(c => c.whatsapp_valid === true).length;
    const invalid = customers.filter(c => c.whatsapp_valid === false).length;
    const pending = customers.filter(c => c.whatsapp_valid === null).length;
    return { valid, invalid, pending, total: customers.length };
  }, [customers]);

  const pendingCustomerIds = useMemo(() => 
    customers.filter(c => c.whatsapp_valid === null).map(c => c.id),
  [customers]);

  const toggleCustomer = (customerId: string) => {
    if (selectedIds.includes(customerId)) {
      onSelectionChange(selectedIds.filter(id => id !== customerId));
    } else {
      onSelectionChange([...selectedIds, customerId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(filteredCustomers.map(c => c.id));
  };

  const selectValid = () => {
    onSelectionChange(customers.filter(c => c.whatsapp_valid === true).map(c => c.id));
  };

  const selectPending = () => {
    onSelectionChange(customers.filter(c => c.whatsapp_valid === null).map(c => c.id));
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getValidationBadge = (customer: Customer) => {
    if (customer.whatsapp_valid === true) {
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5">
          <CheckCircle className="w-3 h-3 mr-0.5" />
          Válido
        </Badge>
      );
    }
    if (customer.whatsapp_valid === false) {
      return (
        <Badge variant="destructive" className="text-[10px] px-1.5">
          <XCircle className="w-3 h-3 mr-0.5" />
          Inválido
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5">
        <HelpCircle className="w-3 h-3 mr-0.5" />
        Pendente
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-2">
          <p className="text-lg font-bold text-green-600">{stats.valid}</p>
          <p className="text-[10px] text-muted-foreground">Válidos</p>
        </div>
        <div className="bg-destructive/10 rounded-lg p-2">
          <p className="text-lg font-bold text-destructive">{stats.invalid}</p>
          <p className="text-[10px] text-muted-foreground">Inválidos</p>
        </div>
        <div className="bg-secondary rounded-lg p-2">
          <p className="text-lg font-bold">{stats.pending}</p>
          <p className="text-[10px] text-muted-foreground">Pendentes</p>
        </div>
      </div>

      {/* Validate Button */}
      {pendingCustomerIds.length > 0 && onValidate && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => onValidate(pendingCustomerIds)}
          disabled={validating}
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Validar {pendingCustomerIds.length} Números Pendentes
            </>
          )}
        </Button>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={selectAll}>
          <Users className="h-3 w-3 mr-1" />
          Todos ({filteredCustomers.length})
        </Button>
        <Button variant="outline" size="sm" onClick={selectValid}>
          <UserCheck className="h-3 w-3 mr-1" />
          Válidos ({stats.valid})
        </Button>
        <Button variant="outline" size="sm" onClick={selectPending}>
          <HelpCircle className="h-3 w-3 mr-1" />
          Pendentes ({stats.pending})
        </Button>
        {selectedIds.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <UserX className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={fetchCustomers}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Selection count */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-center">
          <span className="text-sm font-medium">{selectedIds.length}</span>
          <span className="text-sm text-muted-foreground"> clientes selecionados</span>
        </div>
      )}

      {/* Customer List */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-2 space-y-1">
          {filteredCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
          ) : (
            filteredCustomers.map(customer => (
              <div 
                key={customer.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  selectedIds.includes(customer.id) 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => toggleCustomer(customer.id)}
              >
                <Checkbox 
                  checked={selectedIds.includes(customer.id)}
                  onCheckedChange={() => toggleCustomer(customer.id)}
                  className="pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {formatPhone(customer.phone)}
                  </p>
                </div>
                {getValidationBadge(customer)}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
