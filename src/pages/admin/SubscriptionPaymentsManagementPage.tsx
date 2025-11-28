import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Receipt, Check, X, Eye, Search, Filter, Plus, Pencil, Trash2, UserPlus, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";

interface Invoice {
  id: string;
  store_id: string;
  plan_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  payment_status: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  notes: string | null;
  approved_at: string | null;
  stores: {
    name: string;
    profiles: {
      full_name: string;
      email: string;
    };
  };
  plans: {
    name: string;
  };
}

interface Store {
  id: string;
  name: string;
  custom_monthly_price: number | null;
  discount_reason: string | null;
  plan_id: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface PaymentApproval {
  id: string;
  user_id: string;
  store_id: string;
  plan_id: string;
  status: string;
  payment_amount: number;
  payment_proof_url: string | null;
  company_name: string;
  company_document: string;
  phone: string;
  address: any;
  created_at: string;
  rejection_reason: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
  plans?: {
    name: string;
  };
}

export default function SubscriptionPaymentsManagementPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para criar/editar fatura
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    store_id: "",
    plan_id: "",
    amount: "",
    due_date: "",
    notes: "",
    discount_reason: ""
  });
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [originalPlanPrice, setOriginalPlanPrice] = useState<number>(0);
  const [selectedStoreData, setSelectedStoreData] = useState<Store | null>(null);

  // Estados para aprovações de novos assinantes
  const [pendingApprovals, setPendingApprovals] = useState<PaymentApproval[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<PaymentApproval | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingApproval, setProcessingApproval] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchStores();
    fetchPlans();
    fetchPendingApprovals();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [statusFilter, searchTerm, invoices]);

  const fetchPendingApprovals = async () => {
    setLoadingApprovals(true);
    try {
      // Query sem joins - buscar dados separadamente
      const { data, error } = await (supabase as any)
        .from('payment_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

      if (error) {
        console.error('❌ Erro na query de aprovações:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('✅ Query OK, mas nenhuma aprovação pendente');
        setPendingApprovals([]);
        setLoadingApprovals(false);
        return;
      }

      console.log('✅ Aprovações base carregadas:', data.length, 'registros');

      // Buscar dados relacionados manualmente
      const enrichedData = await Promise.all(
        data.map(async (approval: any) => {
          // Buscar profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', approval.user_id)
            .single();

          // Buscar store
          const { data: store } = await supabase
            .from('stores')
            .select('name')
            .eq('id', approval.store_id)
            .single();

          // Buscar plan
          const { data: plan } = await supabase
            .from('plans')
            .select('name')
            .eq('id', approval.plan_id)
            .single();

          return {
            ...approval,
            profiles: profile,
            stores: store,
            plans: plan,
          };
        })
      );

      console.log('✅ Dados enriquecidos:', enrichedData);
      setPendingApprovals(enrichedData as any);
    } catch (error: any) {
      console.error('❌ ERRO ao buscar aprovações:', error);
      toast.error('Erro ao carregar novos assinantes');
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!selectedApproval || !user) return;

    setProcessingApproval(true);
    try {
      // 1. Aprovar via RPC (atualiza approval_status, ativa loja, etc)
      const { error: approvalError } = await (supabase as any).rpc('approve_payment', {
        approval_id: selectedApproval.id,
        admin_user_id: user.id
      });

      if (approvalError) throw approvalError;

      // 2. Criar invoice na tabela subscription_invoices
      const { error: invoiceError } = await supabase
        .from('subscription_invoices')
        .insert({
          store_id: selectedApproval.store_id,
          plan_id: selectedApproval.plan_id,
          amount: selectedApproval.payment_amount,
          due_date: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          payment_status: 'paid',
          payment_method: (selectedApproval as any).payment_method || 'pix',
          payment_proof_url: (selectedApproval as any).payment_proof_url,
          pix_key: (selectedApproval as any).pix_key,
          notes: 'Pagamento inicial aprovado pelo admin',
          approved_at: new Date().toISOString(),
        });

      if (invoiceError) {
        console.error('Erro ao criar invoice:', invoiceError);
        // Não falha a operação, apenas loga o erro
      }

      toast.success('✅ Pagamento aprovado! Loja ativada com sucesso!');
      setShowApprovalDialog(false);
      setSelectedApproval(null);
      
      // 3. Recarregar AMBAS as listas
      fetchPendingApprovals();
      fetchInvoices();
    } catch (error: any) {
      console.error('❌ Erro ao aprovar:', error);
      toast.error(error.message || 'Erro ao aprovar pagamento');
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedApproval || !user) return;

    // Validar se motivo foi informado
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      toast.error('Por favor, informe um motivo detalhado para a rejeição (mínimo 10 caracteres)');
      return;
    }

    setProcessingApproval(true);
    try {
      const { error } = await (supabase as any).rpc('reject_payment', {
        approval_id: selectedApproval.id,
        admin_user_id: user.id,
        reason: rejectionReason.trim()
      });

      if (error) throw error;

      toast.success('❌ Pagamento rejeitado. O usuário foi notificado.');
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedApproval(null);
      fetchPendingApprovals();
    } catch (error: any) {
      console.error('❌ Erro ao rejeitar:', error);
      toast.error(error.message || 'Erro ao rejeitar pagamento');
    } finally {
      setProcessingApproval(false);
    }
  };

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('subscription_invoices')
      .select(`
        *,
        stores (
          name,
          profiles:owner_id (
            full_name,
            email
          )
        ),
        plans (name)
      `)
      .order('due_date', { ascending: false });

    if (data) {
      setInvoices(data as any);
    }
    setLoading(false);
  };

  const fetchStores = async () => {
    const { data } = await supabase
      .from('stores')
      .select('id, name, custom_monthly_price, discount_reason, plan_id')
      .order('name');
    
    if (data) {
      setStores(data as Store[]);
    }
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('id, name, price')
      .eq('status', 'active')
      .order('name');
    
    if (data) {
      setPlans(data);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.payment_status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.stores?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.stores?.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    try {
      // 1. Buscar informações da fatura e plano
      const { data: invoice, error: invoiceError } = await supabase
        .from('subscription_invoices')
        .select('store_id, plans(billing_cycle)')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        toast.error("Erro ao buscar informações da fatura");
        console.error(invoiceError);
        return;
      }

      // 2. Buscar data atual de expiração da loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('subscription_expires_at')
        .eq('id', invoice.store_id)
        .single();

      if (storeError) {
        toast.error("Erro ao buscar informações da loja");
        console.error(storeError);
        return;
      }

      // 3. Calcular nova data de expiração
      let newExpirationDate: Date;
      const currentExpiration = store.subscription_expires_at 
        ? new Date(store.subscription_expires_at) 
        : null;

      // Se ainda não expirou, adicionar período à data existente
      // Se já expirou ou não existe, começar de hoje
      if (currentExpiration && currentExpiration > new Date()) {
        newExpirationDate = new Date(currentExpiration);
      } else {
        newExpirationDate = new Date();
      }

      // Adicionar período baseado no billing_cycle
      const billingCycle = invoice.plans?.billing_cycle || 'monthly';
      if (billingCycle === 'monthly') {
        newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
      } else if (billingCycle === 'annual') {
        newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);
      } else if (billingCycle === 'quarterly') {
        newExpirationDate.setMonth(newExpirationDate.getMonth() + 3);
      } else if (billingCycle === 'biannual') {
        newExpirationDate.setMonth(newExpirationDate.getMonth() + 6);
      }

      // 4. Atualizar fatura
      const { error: updateInvoiceError } = await supabase
        .from('subscription_invoices')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateInvoiceError) {
        toast.error("Erro ao aprovar pagamento");
        console.error(updateInvoiceError);
        return;
      }

      // 5. Atualizar loja com nova data de expiração
      const { error: updateStoreError } = await supabase
        .from('stores')
        .update({
          subscription_expires_at: newExpirationDate.toISOString(),
          status: 'active'
        })
        .eq('id', invoice.store_id);

      if (updateStoreError) {
        toast.error("Erro ao atualizar data de expiração da loja");
        console.error(updateStoreError);
        return;
      }

      toast.success(
        `Pagamento aprovado! Nova data de expiração: ${format(newExpirationDate, "dd/MM/yyyy", { locale: ptBR })}`
      );
      fetchInvoices();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error("Erro ao processar aprovação");
      console.error(error);
    }
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('subscription_invoices')
      .update({
        payment_status: 'pending',
        payment_proof_url: null,
      })
      .eq('id', invoiceId);

    if (error) {
      toast.error("Erro ao rejeitar pagamento");
      console.error(error);
    } else {
      toast.success("Pagamento rejeitado. Lojista pode enviar novo comprovante.");
      fetchInvoices();
      setShowDetailDialog(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!formData.store_id || !formData.plan_id || !formData.amount || !formData.due_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await supabase
      .from('subscription_invoices')
      .insert({
        store_id: formData.store_id,
        plan_id: formData.plan_id,
        amount: Number(formData.amount),
        due_date: formData.due_date,
        notes: formData.notes || null,
        payment_status: 'pending'
      });

    if (error) {
      toast.error("Erro ao criar fatura");
      console.error(error);
    } else {
      toast.success("Fatura criada com sucesso!");
      setShowCreateDialog(false);
      resetForm();
      fetchInvoices();
    }
  };

  const handleEditInvoice = async () => {
    if (!selectedInvoice || !formData.amount || !formData.due_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await supabase
      .from('subscription_invoices')
      .update({
        amount: Number(formData.amount),
        due_date: formData.due_date,
        notes: formData.notes || null
      })
      .eq('id', selectedInvoice.id);

    if (error) {
      toast.error("Erro ao editar fatura");
      console.error(error);
    } else {
      toast.success("Fatura editada com sucesso!");
      setShowEditDialog(false);
      resetForm();
      fetchInvoices();
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    const { error } = await supabase
      .from('subscription_invoices')
      .delete()
      .eq('id', selectedInvoice.id);

    if (error) {
      toast.error("Erro ao excluir fatura");
      console.error(error);
    } else {
      toast.success("Fatura excluída com sucesso!");
      setShowDeleteDialog(false);
      setSelectedInvoice(null);
      fetchInvoices();
    }
  };

  const resetForm = () => {
    setFormData({
      store_id: "",
      plan_id: "",
      amount: "",
      due_date: "",
      notes: "",
      discount_reason: ""
    });
    setUseCustomPrice(false);
    setOriginalPlanPrice(0);
    setSelectedStoreData(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      store_id: invoice.store_id,
      plan_id: invoice.plan_id,
      amount: invoice.amount.toString(),
      due_date: format(new Date(invoice.due_date), "yyyy-MM-dd"),
      notes: invoice.notes || "",
      discount_reason: ""
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteDialog(true);
  };

  const getStatusBadge = (status: string, paidAt: string | null) => {
    if (status === 'paid') {
      return <Badge variant="default" className="bg-green-500">✅ Paga</Badge>;
    }
    if (status === 'overdue') {
      return <Badge variant="destructive">❌ Vencida</Badge>;
    }
    if (paidAt === null && status === 'pending') {
      return <Badge variant="secondary" className="bg-yellow-500">⏳ Pendente</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary">🕐 Aguardando Aprovação</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.payment_status === 'paid').length,
    pending: invoices.filter(i => i.payment_status === 'pending' && i.payment_proof_url).length,
    overdue: invoices.filter(i => i.payment_status === 'overdue').length,
    totalRevenue: invoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0),
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestão de Pagamentos de Assinaturas</h1>
          <p className="text-muted-foreground">Visualize e aprove pagamentos dos lojistas</p>
        </div>
        <div className="flex gap-2">
          {loadingApprovals ? (
            <Badge variant="secondary" className="bg-gray-500 text-white">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Carregando...
            </Badge>
          ) : pendingApprovals.length > 0 && (
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              {pendingApprovals.length} Novo{pendingApprovals.length > 1 ? 's' : ''} Assinante{pendingApprovals.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Seção de Novos Assinantes Pendentes */}
      <Card className="border-yellow-500/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Novos Assinantes Pendentes de Aprovação</span>
          </CardTitle>
          <CardDescription>
            Analise os comprovantes e aprove ou rejeite os pagamentos
          </CardDescription>
        </CardHeader>
        
        {loadingApprovals ? (
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Carregando aprovações...</span>
            </div>
          </CardContent>
        ) : pendingApprovals.length === 0 ? (
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>Nenhuma aprovação pendente no momento</p>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{approval.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{approval.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{approval.company_name}</p>
                        <p className="text-xs text-muted-foreground">{approval.company_document}</p>
                      </div>
                    </TableCell>
                    <TableCell>{approval.plans?.name}</TableCell>
                    <TableCell className="font-bold text-primary">
                      R$ {approval.payment_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(approval.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {approval.payment_proof_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProofUrl(approval.payment_proof_url);
                            setShowProofDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      ) : (
                        <Badge variant="secondary">Sem comprovante</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowApprovalDialog(true);
                          }}
                          disabled={!approval.payment_proof_url}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowRejectDialog(true);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {/* Restante do código continua aqui com a lista de faturas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fatura
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{stats.paid}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Todas as Faturas
          </CardTitle>
          <CardDescription>Filtre e gerencie os pagamentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por loja, nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Lojista</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma fatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.stores?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{invoice.stores?.profiles?.full_name || '-'}</p>
                          <p className="text-muted-foreground">{invoice.stores?.profiles?.email || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.plans?.name || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                       </TableCell>
                       <TableCell className="font-medium">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                       </TableCell>
                       <TableCell>
                        {getStatusBadge(invoice.payment_status, invoice.paid_at)}
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(invoice)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(invoice)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Fatura</DialogTitle>
            <DialogDescription>
              Revise os detalhes e aprove ou rejeite o pagamento
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loja</p>
                  <p className="font-medium">{selectedInvoice.stores?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lojista</p>
                  <p className="font-medium">{selectedInvoice.stores?.profiles?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-medium">{selectedInvoice.plans?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="font-medium">
                    {format(new Date(selectedInvoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedInvoice.payment_status, selectedInvoice.paid_at)}
                  </div>
                </div>
              </div>

              {selectedInvoice.payment_proof_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Comprovante de Pagamento</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProofUrl(selectedInvoice.payment_proof_url!);
                      setShowProofDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Comprovante
                  </Button>
                </div>
              )}

              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}

          {selectedInvoice && selectedInvoice.payment_proof_url && selectedInvoice.payment_status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => handleRejectInvoice(selectedInvoice.id)}
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                onClick={() => handleApproveInvoice(selectedInvoice.id)}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar Pagamento
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização do Comprovante */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              Visualize o comprovante enviado pelo lojista
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center bg-muted rounded-lg p-4 overflow-auto max-h-[70vh]">
            <img
              src={selectedProofUrl}
              alt="Comprovante de Pagamento"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criar Fatura */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Nova Fatura</DialogTitle>
            <DialogDescription>
              Crie uma nova fatura de assinatura manualmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="store">Loja *</Label>
              <Select 
                value={formData.store_id} 
                onValueChange={(value) => {
                  const store = stores.find(s => s.id === value);
                  setSelectedStoreData(store || null);
                  
                  // Se a loja tem custom_monthly_price, carregar automaticamente
                  if (store?.custom_monthly_price) {
                    setUseCustomPrice(true);
                    setFormData({
                      ...formData, 
                      store_id: value,
                      amount: store.custom_monthly_price.toString(),
                      discount_reason: store.discount_reason || ""
                    });
                    
                    // Buscar preço original do plano da loja
                    if (store.plan_id) {
                      const plan = plans.find(p => p.id === store.plan_id);
                      if (plan) {
                        setOriginalPlanPrice(plan.price);
                        if (!formData.plan_id) {
                          setFormData(prev => ({...prev, plan_id: store.plan_id!}));
                        }
                      }
                    }
                  } else {
                    setUseCustomPrice(false);
                    setFormData({...formData, store_id: value, discount_reason: ""});
                    setOriginalPlanPrice(0);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plan">Plano *</Label>
              <Select 
                value={formData.plan_id} 
                onValueChange={(value) => {
                  const plan = plans.find(p => p.id === value);
                  if (plan) {
                    setOriginalPlanPrice(plan.price);
                    
                    // Se não está usando preço personalizado, usar preço do plano
                    if (!useCustomPrice) {
                      setFormData({
                        ...formData, 
                        plan_id: value,
                        amount: plan.price.toString()
                      });
                    } else {
                      setFormData({
                        ...formData, 
                        plan_id: value
                      });
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seção de Preço Personalizado */}
            {formData.plan_id && originalPlanPrice > 0 && (
              <Card className="border-orange-500/50 bg-orange-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    💰 Preço Personalizado (Opcional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Preço do plano</p>
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalPlanPrice)}
                      </p>
                    </div>
                    {useCustomPrice && formData.amount && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Desconto</p>
                        <Badge variant="secondary" className="bg-green-500 text-white">
                          -{Math.round(((originalPlanPrice - Number(formData.amount)) / originalPlanPrice) * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-custom-price"
                      checked={useCustomPrice}
                      onChange={(e) => {
                        setUseCustomPrice(e.target.checked);
                        if (!e.target.checked) {
                          setFormData({
                            ...formData, 
                            amount: originalPlanPrice.toString(),
                            discount_reason: ""
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="use-custom-price" className="text-sm font-medium cursor-pointer">
                      Aplicar preço personalizado com desconto
                    </Label>
                  </div>

                  {useCustomPrice && (
                    <>
                      <div>
                        <Label htmlFor="custom-amount">Valor Personalizado *</Label>
                        <Input
                          id="custom-amount"
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          placeholder="0.00"
                          className="font-bold text-lg"
                        />
                      </div>

                      <div>
                        <Label htmlFor="discount-reason">Motivo do Desconto</Label>
                        <Textarea
                          id="discount-reason"
                          value={formData.discount_reason}
                          onChange={(e) => setFormData({...formData, discount_reason: e.target.value})}
                          placeholder="Ex: Cliente antigo, promoção especial, parceria..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {!useCustomPrice && formData.plan_id && (
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  disabled
                />
              </div>
            )}
            <div>
              <Label htmlFor="due_date">Data de Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateInvoice}>
              Criar Fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Fatura */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Fatura</DialogTitle>
            <DialogDescription>
              Edite as informações da fatura
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loja</Label>
              <Input value={selectedInvoice?.stores?.name || ""} disabled />
            </div>
            <div>
              <Label>Plano</Label>
              <Input value={selectedInvoice?.plans?.name || ""} disabled />
            </div>
            <div>
              <Label htmlFor="edit_amount">Valor *</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_due_date">Data de Vencimento *</Label>
              <Input
                id="edit_due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_notes">Observações</Label>
              <Input
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditInvoice}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Excluir Fatura */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <p><strong>Loja:</strong> {selectedInvoice.stores?.name}</p>
              <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.amount)}</p>
              <p><strong>Vencimento:</strong> {format(new Date(selectedInvoice.due_date), "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Aprovação de Pagamento */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Aprovar Pagamento</span>
            </DialogTitle>
            <DialogDescription>
              Confirme a aprovação deste pagamento e ativação da conta
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Usuário:</strong> {selectedApproval.profiles?.full_name}</p>
                <p><strong>Email:</strong> {selectedApproval.profiles?.email}</p>
                <p><strong>Empresa:</strong> {selectedApproval.company_name}</p>
                <p><strong>Documento:</strong> {selectedApproval.company_document}</p>
                <p><strong>Telefone:</strong> {selectedApproval.phone}</p>
                <p><strong>Plano:</strong> {selectedApproval.plans?.name}</p>
                <p><strong>Valor:</strong> R$ {selectedApproval.payment_amount.toFixed(2)}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ Ao aprovar, a conta do usuário será ativada imediatamente e ele terá acesso completo ao sistema.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={processingApproval}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleApprovePayment}
              disabled={processingApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingApproval ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Aprovando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição de Pagamento */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Rejeitar Pagamento</span>
            </DialogTitle>
            <DialogDescription>
              Informe o motivo detalhado da rejeição (obrigatório - mínimo 10 caracteres)
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Usuário:</strong> {selectedApproval.profiles?.full_name}</p>
                <p><strong>Email:</strong> {selectedApproval.profiles?.email}</p>
                <p><strong>Empresa:</strong> {selectedApproval.company_name}</p>
                <p><strong>Valor:</strong> R$ {selectedApproval.payment_amount.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Comprovante ilegível, valor incorreto, dados bancários não conferem, etc."
                  rows={4}
                  required
                  className={rejectionReason.length > 0 && rejectionReason.length < 10 ? 'border-red-500' : ''}
                />
                {rejectionReason.length > 0 && rejectionReason.length < 10 && (
                  <p className="text-sm text-red-500">Mínimo 10 caracteres ({rejectionReason.length}/10)</p>
                )}
              </div>
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  ⚠️ O usuário será notificado sobre a rejeição e poderá enviar um novo comprovante.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={processingApproval}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPayment}
              disabled={processingApproval}
            >
              {processingApproval ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
