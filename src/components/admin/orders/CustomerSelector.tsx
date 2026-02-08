import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, User, X, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPhone } from '@/lib/utils';
import { toast } from 'sonner';

const SEARCH_LIMIT = 20;
const DEBOUNCE_MS = 400;

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
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchCustomers = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Buscar clientes através de customer_stores com busca server-side
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
        .or(`name.ilike.%${term}%,phone.ilike.%${term}%`, { referencedTable: 'customers' })
        .limit(SEARCH_LIMIT);

      if (error) throw error;

      const customersData = data?.map(cs => cs.customers).filter(Boolean) || [];
      setResults(customersData as Customer[]);
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao buscar clientes');
    } finally {
      setIsSearching(false);
    }
  }, [storeId]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchCustomers(value);
    }, DEBOUNCE_MS);
  };

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  const handleClear = () => {
    // Limpar seleção - passa null via onSelect com cast
    onSelect(null as unknown as Customer);
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  const handleBlur = () => {
    // Delay para permitir clique nos resultados
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <Label>Cliente *</Label>
      
      {selectedCustomer ? (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{selectedCustomer.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClear}
                aria-label="Remover cliente selecionado"
              >
                <X className="h-4 w-4" />
              </Button>
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
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome ou telefone do cliente..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setShowResults(true);
              }}
              onBlur={handleBlur}
              className="pl-9 pr-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {showResults && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex flex-col gap-0.5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(customer)}
                >
                  <span className="font-medium text-sm">{customer.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPhone(customer.phone)}
                  </span>
                </button>
              ))}
              {results.length === SEARCH_LIMIT && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando {SEARCH_LIMIT} resultados. Refine sua busca.
                </p>
              )}
            </div>
          )}

          {showResults && searchTerm.length >= 2 && !isSearching && results.length === 0 && (
            <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg p-3">
              <p className="text-sm text-muted-foreground text-center">
                Nenhum cliente encontrado.
              </p>
            </div>
          )}
        </div>
      )}
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={onCreateNew}
      >
        <Plus className="h-4 w-4 mr-2" />
        Novo Cliente
      </Button>
    </div>
  );
}
