import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, KeyRound, Phone, Mail, MapPin, Calendar, ShoppingBag, Users, UserPlus, Loader2, Eye, Pencil, MoreHorizontal, ChevronLeft, ChevronRight, Filter, Download, UserCheck, UserX, CalendarCheck } from 'lucide-react';
import { formatPhone } from '@/lib/utils';
import { useCustomerLabels, useCustomerLabelAssignments } from '@/hooks/useCustomerLabels';
import { CustomerLabelBadge } from '@/components/customers/CustomerLabelBadge';
import { LabelFilterDropdown } from '@/components/customers/LabelFilterDropdown';
import { LeadsList } from '@/components/customers/LeadsList';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useAuth } from '@/hooks/use-auth';
import { CustomerDetailsModal } from '@/components/admin/CustomerDetailsModal';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  auth_user_id: string | null;
  created_at: string;
  order_count?: number;
  booking_count?: number;
}

// ========== Metric Card ==========
function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${color || 'bg-muted'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Pagination Component ==========
function CustomerPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push('ellipsis');
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push('ellipsis');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{startItem}–{endItem}</span> de{' '}
        <span className="font-medium text-foreground">{totalItems}</span> clientes
      </p>

      <div className="flex items-center gap-3">
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-[120px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / pág</SelectItem>
            <SelectItem value="20">20 / pág</SelectItem>
            <SelectItem value="50">50 / pág</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getPageNumbers().map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9 text-sm"
                onClick={() => onPageChange(page)}
              >
                {page + 1}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ========== Customer Row Card ==========
function CustomerRowCard({
  customer,
  labels,
  onViewDetails,
  onResetPassword,
}: {
  customer: Customer;
  labels: { id: string; name: string; color: string }[];
  onViewDetails: () => void;
  onResetPassword: () => void;
}) {
  return (
    <Card className="border border-border/60 shadow-sm hover:shadow-md transition-all group">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Col 1: Identity */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">{customer.name}</h3>
              {customer.auth_user_id ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 font-medium">
                  Com senha
                </Badge>
              ) : (
                <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0 font-medium">
                  Sem senha
                </Badge>
              )}
              {(customer.booking_count ?? 0) > 0 && (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 font-medium">
                  Agendamento
                </Badge>
              )}
              {(customer.order_count ?? 0) >= 3 && (
                <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] px-1.5 py-0 font-medium">
                  Recorrente
                </Badge>
              )}
            </div>

            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {labels.map((label) => (
                  <CustomerLabelBadge key={label.id} name={label.name} color={label.color} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {formatPhone(customer.phone)}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </span>
              )}
            </div>
          </div>

          {/* Col 2: Relationship info */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" />
              {customer.order_count ?? 0} {(customer.order_count ?? 0) === 1 ? 'pedido' : 'pedidos'}
            </span>
            {(customer.booking_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <CalendarCheck className="h-3 w-3" />
                {customer.booking_count} {customer.booking_count === 1 ? 'agendamento' : 'agendamentos'}
              </span>
            )}
          </div>

          {/* Col 3: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={onViewDetails}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Ver / Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Editar cliente
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onResetPassword}
                  disabled={!customer.auth_user_id}
                >
                  <KeyRound className="h-3.5 w-3.5 mr-2" />
                  Resetar senha
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Customer List with Labels ==========
function CustomerList({
  customers,
  storeId,
  onResetPassword,
  onViewDetails,
}: {
  customers: Customer[];
  storeId?: string | null;
  onResetPassword: (customer: Customer) => void;
  onViewDetails: (customer: Customer) => void;
}) {
  const customerIds = useMemo(() => customers.map(c => c.id), [customers]);
  const { assignments } = useCustomerLabelAssignments(customerIds, storeId);

  if (customers.length === 0) return null;

  return (
    <div className="space-y-2">
      {customers.map((customer) => {
        const customerLabels = assignments[customer.id] || [];
        return (
          <CustomerRowCard
            key={customer.id}
            customer={customer}
            labels={customerLabels}
            onViewDetails={() => onViewDetails(customer)}
            onResetPassword={() => onResetPassword(customer)}
          />
        );
      })}
    </div>
  );
}

// ========== Main Page ==========
export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [detailsCustomerId, setDetailsCustomerId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { storeId: validatedStoreId, isLoading: storeAccessLoading } = useStoreAccess();
  const { profile } = useAuth();

  const { labels: availableLabels } = useCustomerLabels(validatedStoreId);
  const customerIds = useMemo(() => customers.map(c => c.id), [customers]);
  const { assignments: allAssignments } = useCustomerLabelAssignments(customerIds, validatedStoreId);

  useEffect(() => {
    if (!storeAccessLoading) {
      fetchCustomers();
    }
  }, [storeAccessLoading, validatedStoreId]);

  useEffect(() => {
    let result = customers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(term)
      );
    }

    if (selectedLabelIds.length > 0) {
      result = result.filter(customer => {
        const customerLabels = allAssignments[customer.id] || [];
        return selectedLabelIds.some(labelId =>
          customerLabels.some(l => l.id === labelId)
        );
      });
    }

    setFilteredCustomers(result);
    setCurrentPage(0); // Reset page on filter change
  }, [searchTerm, customers, selectedLabelIds, allAssignments]);

  // Paginated customers
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = useMemo(
    () => filteredCustomers.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [filteredCustomers, currentPage, pageSize]
  );

  // ===== fetchCustomers (unchanged logic) =====
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando clientes...', { validatedStoreId, userType: profile?.user_type });
      const userType = profile?.user_type;

      if (userType === 'master_admin') {
        console.log('👑 Master admin - buscando TODOS os clientes');
        const { data, error } = await supabase
          .from('customers')
          .select(`id, name, phone, email, address, auth_user_id, created_at`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const customersWithOrders = await Promise.all(
          (data || []).map(async (customer) => {
            const [orderCountResult, lastOrderResult] = await Promise.all([
              supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
              !customer.address
                ? supabase.from('orders').select('customer_address').eq('customer_id', customer.id).not('customer_address', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle()
                : Promise.resolve({ data: null })
            ]);
            return {
              ...customer,
              address: customer.address || (lastOrderResult.data as any)?.customer_address || null,
              order_count: orderCountResult.count || 0
            };
          })
        );
        console.log('✅ Total de clientes:', customersWithOrders.length);
        setCustomers(customersWithOrders);
        setFilteredCustomers(customersWithOrders);
        return;
      }

      if (!validatedStoreId) {
        console.error('❌ Loja não identificada');
        toast.error('Loja não identificada');
        return;
      }

      console.log('🏪 Store admin - buscando clientes da loja:', validatedStoreId);

      const { data: orders, error: ordersError } = await supabase
        .from('orders').select('customer_id').eq('store_id', validatedStoreId);
      if (ordersError) throw ordersError;

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings').select('customer_id').eq('store_id', validatedStoreId).not('customer_id', 'is', null);
      if (bookingsError) throw bookingsError;

      const orderCustomerIds = orders?.map(o => o.customer_id).filter(Boolean) || [];
      const bookingCustomerIds = bookings?.map(b => b.customer_id).filter(Boolean) || [];
      const uniqueCustomerIds = [...new Set([...orderCustomerIds, ...bookingCustomerIds])];

      if (uniqueCustomerIds.length === 0) {
        setCustomers([]); setFilteredCustomers([]);
        toast.info('Nenhum cliente encontrado para esta loja');
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .select(`id, name, phone, email, address, auth_user_id, created_at`)
        .in('id', uniqueCustomerIds)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const customersWithCounts = await Promise.all(
        (data || []).map(async (customer) => {
          const [ordersResult, bookingsResult, lastOrderResult] = await Promise.all([
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id).eq('store_id', validatedStoreId),
            supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id).eq('store_id', validatedStoreId),
            !customer.address
              ? supabase.from('orders').select('customer_address').eq('customer_id', customer.id).eq('store_id', validatedStoreId).not('customer_address', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle()
              : Promise.resolve({ data: null })
          ]);
          return {
            ...customer,
            address: customer.address || (lastOrderResult.data as any)?.customer_address || null,
            order_count: ordersResult.count || 0,
            booking_count: bookingsResult.count || 0
          };
        })
      );
      setCustomers(customersWithCounts);
      setFilteredCustomers(customersWithCounts);
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // ===== handleResetPassword (unchanged logic) =====
  const handleResetPassword = async () => {
    if (!selectedCustomer || !newPassword) { toast.error('Preencha a nova senha'); return; }
    if (newPassword.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    setResetting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { toast.error('Você precisa estar logado para resetar senhas.'); return; }
      const { data, error } = await supabase.functions.invoke('reset-customer-password', {
        body: { customerId: selectedCustomer.id, newPassword }
      });
      if (error) {
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error('Não autorizado.');
        } else { toast.error(error.message || 'Erro ao resetar senha.'); }
        return;
      }
      if (data?.error) { toast.error(data.error); return; }
      toast.success(data.message || 'Senha resetada com sucesso!');
      setResetDialogOpen(false); setNewPassword(''); setSelectedCustomer(null);
    } catch (error: any) {
      toast.error('Erro inesperado ao resetar senha.');
    } finally { setResetting(false); }
  };

  const openResetDialog = (customer: Customer) => {
    if (!customer.auth_user_id) {
      toast.error('Este cliente não possui autenticação configurada.');
      return;
    }
    setSelectedCustomer(customer);
    setNewPassword('');
    setResetDialogOpen(true);
  };

  // ===== Metrics =====
  const withAuth = customers.filter(c => c.auth_user_id).length;
  const withoutAuth = customers.filter(c => !c.auth_user_id).length;
  const withBookings = customers.filter(c => (c.booking_count ?? 0) > 0).length;
  const withOrders = customers.filter(c => (c.order_count ?? 0) > 0).length;

  if (loading || storeAccessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciamento de Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visualize e gerencie clientes e leads da sua loja</p>
        </div>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs h-10">
          <TabsTrigger value="customers" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Clientes ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2 text-sm">
            <UserPlus className="h-4 w-4" />
            Leads
          </TabsTrigger>
        </TabsList>

        {/* ===== Tab: Clientes ===== */}
        <TabsContent value="customers" className="space-y-5 mt-5">
          {/* Search & Filters bar */}
          <Card className="border border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <LabelFilterDropdown
                    labels={availableLabels}
                    selectedLabelIds={selectedLabelIds}
                    onSelectionChange={setSelectedLabelIds}
                  />
                  {(searchTerm || selectedLabelIds.length > 0) && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearchTerm(''); setSelectedLabelIds([]); }}>
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard icon={Users} label="Total de Clientes" value={customers.length} color="bg-primary/10 text-primary" />
            <MetricCard icon={UserCheck} label="Com Autenticação" value={withAuth} color="bg-emerald-100 text-emerald-700" />
            <MetricCard icon={UserX} label="Sem Autenticação" value={withoutAuth} color="bg-orange-100 text-orange-700" />
            <MetricCard icon={CalendarCheck} label="Com Agendamento" value={withBookings} color="bg-blue-100 text-blue-700" />
            <MetricCard icon={ShoppingBag} label="Com Pedidos" value={withOrders} color="bg-violet-100 text-violet-700" />
          </div>

          {/* Customer list */}
          <CustomerList
            customers={paginatedCustomers}
            storeId={validatedStoreId}
            onResetPassword={openResetDialog}
            onViewDetails={(customer) => {
              setDetailsCustomerId(customer.id);
              setDetailsModalOpen(true);
            }}
          />

          {filteredCustomers.length === 0 && (
            <Card className="border border-border/60">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium">Nenhum cliente encontrado</p>
                <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          <CustomerPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(0); }}
          />
        </TabsContent>

        {/* ===== Tab: Leads ===== */}
        <TabsContent value="leads" className="mt-5">
          <LeadsList storeId={validatedStoreId} />
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha do Cliente</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="text"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                O cliente poderá fazer login com esta senha
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetting}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={resetting || !newPassword || newPassword.length < 6}>
              {resetting ? 'Resetando...' : 'Resetar Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Details Modal */}
      {detailsCustomerId && (
        <CustomerDetailsModal
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setDetailsCustomerId(null);
            if (validatedStoreId) fetchCustomers();
          }}
          customerId={detailsCustomerId}
        />
      )}
    </div>
  );
}
