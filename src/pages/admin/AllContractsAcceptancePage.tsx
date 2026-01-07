import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Check, ExternalLink, Shield, Calendar, Globe, Monitor, Search, Store, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContractorInfoCard from '@/components/admin/ContractorInfoCard';

interface MerchantAcceptance {
  id: string;
  user_id: string;
  contract_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  verification_hash: string | null;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
  store?: {
    name: string | null;
  };
}

interface SalespersonContract {
  id: string;
  salesperson_id: string;
  version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  verification_hash: string | null;
  salesperson?: {
    full_name: string | null;
    email: string | null;
    company_name: string | null;
  };
}

const AllContractsAcceptancePage = () => {
  const [merchantAcceptances, setMerchantAcceptances] = useState<MerchantAcceptance[]>([]);
  const [salespersonContracts, setSalespersonContracts] = useState<SalespersonContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantAcceptance | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState<SalespersonContract | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch merchant contract acceptances (sem embedding - busca separada)
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchant_contract_acceptance')
        .select('*')
        .order('accepted_at', { ascending: false });

      if (merchantError) throw merchantError;

      // Buscar profiles separadamente
      let enrichedMerchantData: MerchantAcceptance[] = [];
      if (merchantData && merchantData.length > 0) {
        const userIds = merchantData.map(m => m.user_id).filter(Boolean);
        const storeIds = merchantData.map(m => m.store_id).filter(Boolean);

        // Buscar profiles com user_type para filtrar master_admin
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, user_type')
          .in('id', userIds);

        // Buscar stores
        let stores: { id: string; name: string }[] = [];
        if (storeIds.length > 0) {
          const { data: storesData } = await supabase.from('stores').select('id, name').in('id', storeIds);
          stores = storesData || [];
        }

        // Buscar IDs de vendedores para filtrar da lista de lojistas
        const { data: salespeople } = await supabase
          .from('salespeople')
          .select('user_id');
        
        const salespeopleUserIds = new Set(salespeople?.map(s => s.user_id).filter(Boolean) || []);

        // Mapear por ID
        const profileMap = new Map<string, { id: string; full_name: string | null; email: string | null; user_type: string | null }>();
        profiles?.forEach(p => profileMap.set(p.id, p));
        
        const storeMap = new Map<string, { id: string; name: string }>();
        stores.forEach(s => storeMap.set(s.id, s));

        // Enriquecer os dados e filtrar master_admin e vendedores
        enrichedMerchantData = merchantData
          .filter(m => {
            const profile = profileMap.get(m.user_id);
            // Filtrar master_admin - não deve aparecer como lojista
            if (profile?.user_type === 'master_admin') return false;
            // Filtrar vendedores - não devem aparecer como lojistas
            if (salespeopleUserIds.has(m.user_id)) return false;
            return true;
          })
          .map(m => ({
            ...m,
            profile: profileMap.get(m.user_id) || null,
            store: m.store_id ? storeMap.get(m.store_id) || null : null
          })) as MerchantAcceptance[];
      }

      setMerchantAcceptances(enrichedMerchantData);

      // Fetch salesperson contracts
      const { data: salespersonData, error: salespersonError } = await supabase
        .from('salesperson_contracts')
        .select(`
          *,
          salesperson:salesperson_id (full_name, email, company_name)
        `)
        .order('accepted_at', { ascending: false });

      if (salespersonError) throw salespersonError;
      setSalespersonContracts((salespersonData || []) as unknown as SalespersonContract[]);

      if (enrichedMerchantData.length > 0) {
        setSelectedMerchant(enrichedMerchantData[0]);
      }
    } catch (error) {
      console.error('Error fetching contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationUrl = (hash: string | null, type: 'merchant' | 'salesperson') => {
    if (!hash) return null;
    return `${window.location.origin}/verificar-contrato?hash=${hash}&type=${type}`;
  };

  const filteredMerchants = merchantAcceptances.filter(m => {
    const name = m.profile?.full_name?.toLowerCase() || '';
    const email = m.profile?.email?.toLowerCase() || '';
    const storeName = m.store?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search) || storeName.includes(search);
  });

  const filteredSalespeople = salespersonContracts.filter(s => {
    const name = s.salesperson?.full_name?.toLowerCase() || '';
    const email = s.salesperson?.email?.toLowerCase() || '';
    const company = s.salesperson?.company_name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search) || company.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dados da Contratada */}
      <ContractorInfoCard />

      <div>
        <h1 className="text-2xl font-bold">Aceites de Contratos</h1>
        <p className="text-muted-foreground">
          Visualize todos os contratos aceitos por lojistas e vendedores
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">
            <Store className="h-3 w-3 mr-1" />
            {merchantAcceptances.length} lojistas
          </Badge>
          <Badge variant="secondary">
            <User className="h-3 w-3 mr-1" />
            {salespersonContracts.length} vendedores
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="merchants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="merchants" className="gap-2">
            <Store className="h-4 w-4" />
            Lojistas ({filteredMerchants.length})
          </TabsTrigger>
          <TabsTrigger value="salespeople" className="gap-2">
            <User className="h-4 w-4" />
            Vendedores ({filteredSalespeople.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="merchants">
          {filteredMerchants.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhum contrato encontrado</h3>
                <p className="text-muted-foreground">
                  Nenhum lojista aceitou contratos ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Contratos de Lojistas</CardTitle>
                  <CardDescription>
                    {filteredMerchants.length} contrato(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredMerchants.map((acceptance) => (
                        <div
                          key={acceptance.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedMerchant?.id === acceptance.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedMerchant(acceptance)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {acceptance.profile?.full_name || 'Nome não disponível'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {acceptance.store?.name || acceptance.profile?.email}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                v{acceptance.contract_version} • {format(new Date(acceptance.accepted_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                              <Check className="h-3 w-3" />
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {selectedMerchant && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {selectedMerchant.profile?.full_name || 'Lojista'}
                        </CardTitle>
                        <CardDescription>
                          Contrato v{selectedMerchant.contract_version}
                        </CardDescription>
                      </div>
                      {selectedMerchant.verification_hash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = getVerificationUrl(selectedMerchant.verification_hash, 'merchant');
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Verificar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Data do Aceite</p>
                          <p className="font-medium">
                            {format(new Date(selectedMerchant.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Globe className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Endereço IP</p>
                          <p className="font-medium font-mono text-sm">
                            {selectedMerchant.ip_address || 'Não registrado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedMerchant.user_agent && (
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Monitor className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Navegador/Dispositivo</p>
                          <p className="text-sm font-mono break-all">
                            {selectedMerchant.user_agent}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedMerchant.verification_hash && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800 dark:text-green-300">
                            Hash de Verificação
                          </span>
                        </div>
                        <p className="font-mono text-xs break-all text-green-700 dark:text-green-400">
                          {selectedMerchant.verification_hash}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="salespeople">
          {filteredSalespeople.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhum contrato encontrado</h3>
                <p className="text-muted-foreground">
                  Nenhum vendedor aceitou contratos ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Contratos de Vendedores</CardTitle>
                  <CardDescription>
                    {filteredSalespeople.length} contrato(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredSalespeople.map((contract) => (
                        <div
                          key={contract.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedSalesperson?.id === contract.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedSalesperson(contract)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {contract.salesperson?.full_name || 'Nome não disponível'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {contract.salesperson?.company_name || contract.salesperson?.email}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                v{contract.version} • {format(new Date(contract.accepted_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                              <Check className="h-3 w-3" />
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {selectedSalesperson && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {selectedSalesperson.salesperson?.full_name || 'Vendedor'}
                        </CardTitle>
                        <CardDescription>
                          Contrato v{selectedSalesperson.version}
                        </CardDescription>
                      </div>
                      {selectedSalesperson.verification_hash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = getVerificationUrl(selectedSalesperson.verification_hash, 'salesperson');
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Verificar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Data do Aceite</p>
                          <p className="font-medium">
                            {format(new Date(selectedSalesperson.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Globe className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Endereço IP</p>
                          <p className="font-medium font-mono text-sm">
                            {selectedSalesperson.ip_address || 'Não registrado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedSalesperson.user_agent && (
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Monitor className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Navegador/Dispositivo</p>
                          <p className="text-sm font-mono break-all">
                            {selectedSalesperson.user_agent}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedSalesperson.verification_hash && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800 dark:text-green-300">
                            Hash de Verificação
                          </span>
                        </div>
                        <p className="font-mono text-xs break-all text-green-700 dark:text-green-400">
                          {selectedSalesperson.verification_hash}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AllContractsAcceptancePage;
