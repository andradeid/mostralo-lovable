import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Clock, CheckCircle, XCircle, FileText, User, Building2, DollarSign, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PayoutApprovalDialog } from "@/components/admin/salespeople/PayoutApprovalDialog";
import { PayoutEditDialog } from "@/components/admin/salespeople/PayoutEditDialog";
import { PayoutCreateDialog } from "@/components/admin/salespeople/PayoutCreateDialog";

interface PayoutWithSalesperson {
  id: string;
  cycle_month: number;
  cycle_year: number;
  total_sales: number;
  commission_total: number;
  bonus_total: number;
  grand_total: number;
  requested_at: string | null;
  invoice_url: string | null;
  invoice_number: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  status: string;
  rejection_reason: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  created_at: string;
  salesperson: {
    id: string;
    full_name: string;
    email: string;
    salesperson_type: string;
    cpf: string | null;
    cnpj: string | null;
    company_name: string | null;
  };
}

export default function SalespeoplePayoutsPage() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<PayoutWithSalesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutWithSalesperson | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("requested");

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('salesperson_payouts')
        .select(`
          *,
          salesperson:salespeople(
            id,
            full_name,
            email,
            salesperson_type,
            cpf,
            cnpj,
            company_name
          )
        `)
        .order('requested_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setPayouts((data || []) as unknown as PayoutWithSalesperson[]);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os pagamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-[10px] md:text-xs h-5"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'requested':
        return <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px] md:text-xs h-5"><Clock className="w-3 h-3 mr-1" />Solicitado</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-blue-500 text-blue-600 text-[10px] md:text-xs h-5"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'paid':
        return <Badge className="bg-green-500 text-[10px] md:text-xs h-5"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-[10px] md:text-xs h-5"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] md:text-xs h-5">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'affiliate') {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600 text-[10px] md:text-xs h-5">
          <User className="w-3 h-3 mr-1" />
          <span className="hidden md:inline">Afiliado</span>
          <span className="md:hidden">Afil.</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-600 text-[10px] md:text-xs h-5">
        <Building2 className="w-3 h-3 mr-1" />
        <span className="hidden md:inline">Parceiro PJ</span>
        <span className="md:hidden">PJ</span>
      </Badge>
    );
  };

  const filteredPayouts = payouts.filter(p => {
    switch (activeTab) {
      case 'pending':
        return p.status === 'pending';
      case 'requested':
        return p.status === 'requested';
      case 'approved':
        return p.status === 'approved';
      case 'paid':
        return p.status === 'paid';
      case 'rejected':
        return p.status === 'rejected';
      default:
        return true;
    }
  });

  // Estatísticas
  const stats = {
    pending: payouts.filter(p => p.status === 'pending').length,
    totalPending: payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.grand_total), 0),
    requested: payouts.filter(p => p.status === 'requested').length,
    totalRequested: payouts
      .filter(p => p.status === 'requested')
      .reduce((sum, p) => sum + Number(p.grand_total), 0),
    paidThisMonth: payouts
      .filter(p => {
        if (p.status !== 'paid' || !p.paid_at) return false;
        const paidDate = new Date(p.paid_at);
        const now = new Date();
        return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + Number(p.grand_total), 0),
  };

  const handleOpenApproval = (payout: PayoutWithSalesperson) => {
    setSelectedPayout(payout);
    setShowApprovalDialog(true);
  };

  const handleOpenEdit = (payout: PayoutWithSalesperson) => {
    setSelectedPayout(payout);
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Pagamentos</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Gerencie pagamentos de vendedores</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="h-9 md:h-10">
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Criar Payout Manual</span>
          <span className="md:hidden">Novo</span>
        </Button>
      </div>

      {/* Cards de resumo - 2x2 no mobile */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-[10px] md:text-sm font-medium truncate">
              <span className="md:hidden">Pend.</span>
              <span className="hidden md:inline">Pendentes</span>
            </CardTitle>
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg md:text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.pending}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-[10px] md:text-sm font-medium truncate">
              <span className="md:hidden">Solic.</span>
              <span className="hidden md:inline">Aguardando</span>
            </CardTitle>
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg md:text-2xl font-bold text-amber-600">{stats.requested}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              R$ {stats.totalRequested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-[10px] md:text-sm font-medium truncate">
              <span className="md:hidden">Pago</span>
              <span className="hidden md:inline">Pago Este Mês</span>
            </CardTitle>
            <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg md:text-2xl font-bold text-green-600 truncate">
              R$ {stats.paidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {format(new Date(), "MMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-[10px] md:text-sm font-medium truncate">Total</CardTitle>
            <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg md:text-2xl font-bold">{payouts.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              Payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtro */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-lg">Solicitações</CardTitle>
          <CardDescription className="text-xs md:text-sm">Gerencie pagamentos</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tabs com scroll horizontal */}
            <TabsList className="h-auto p-1 w-full overflow-x-auto flex justify-start gap-1">
              <TabsTrigger value="pending" className="shrink-0 text-xs md:text-sm px-2 md:px-3 py-1.5">
                <span className="md:hidden">Pend.</span>
                <span className="hidden md:inline">Pendentes</span>
                {stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[10px] px-1">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requested" className="shrink-0 text-xs md:text-sm px-2 md:px-3 py-1.5">
                <span className="md:hidden">Solic.</span>
                <span className="hidden md:inline">Solicitados</span>
                {stats.requested > 0 && (
                  <Badge className="ml-1 h-4 min-w-4 text-[10px] px-1 bg-amber-500">
                    {stats.requested}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="shrink-0 text-xs md:text-sm px-2 md:px-3 py-1.5">
                <span className="md:hidden">Aprov.</span>
                <span className="hidden md:inline">Aprovados</span>
              </TabsTrigger>
              <TabsTrigger value="paid" className="shrink-0 text-xs md:text-sm px-2 md:px-3 py-1.5">
                Pagos
              </TabsTrigger>
              <TabsTrigger value="rejected" className="shrink-0 text-xs md:text-sm px-2 md:px-3 py-1.5">
                <span className="md:hidden">Rej.</span>
                <span className="hidden md:inline">Rejeitados</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="shrink-0 text-xs md:text-sm px-2 md:px-3 py-1.5">
                Todos
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredPayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma solicitação {activeTab !== 'all' ? 'neste status' : ''}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3"
                    >
                      {/* Header: Nome + Badges + Valor (desktop) */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">
                            {payout.salesperson?.full_name || 'Vendedor'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getTypeBadge(payout.salesperson?.salesperson_type || 'affiliate')}
                            {getStatusBadge(payout.status)}
                          </div>
                        </div>
                        
                        {/* Valor - Desktop Only */}
                        <div className="hidden md:block text-right shrink-0">
                          <p className="font-bold text-xl">
                            R$ {Number(payout.grand_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            <p>Comissão: R$ {Number(payout.commission_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            {Number(payout.bonus_total) > 0 && (
                              <p className="text-green-600">Bônus: R$ {Number(payout.bonus_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info Compacta */}
                      <div className="text-xs md:text-sm text-muted-foreground space-y-0.5">
                        <p className="truncate">
                          {payout.salesperson?.salesperson_type === 'affiliate' 
                            ? `CPF: ${payout.salesperson?.cpf || 'N/A'}`
                            : `${payout.salesperson?.company_name || ''} • ${payout.salesperson?.cnpj || 'N/A'}`
                          }
                        </p>
                        <p>
                          {format(new Date(payout.cycle_year, payout.cycle_month - 1), "MMM/yyyy", { locale: ptBR })}
                          {' • '}{payout.total_sales} venda(s)
                        </p>
                        {payout.requested_at && (
                          <p className="hidden md:block">Solicitado: {format(new Date(payout.requested_at), "dd/MM/yyyy HH:mm")}</p>
                        )}
                        {payout.pix_key && (
                          <p className="truncate">PIX: <span className="font-mono">{payout.pix_key}</span></p>
                        )}
                      </div>

                      {/* Valor Total - Mobile Only */}
                      <div className="flex items-center justify-between md:hidden p-2 bg-muted/50 rounded-lg">
                        <div className="text-xs">
                          <p>Comissão: R$ {Number(payout.commission_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          {Number(payout.bonus_total) > 0 && (
                            <p className="text-green-600">Bônus: R$ {Number(payout.bonus_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {Number(payout.grand_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className="text-[10px] text-muted-foreground">Total</p>
                        </div>
                      </div>

                      {/* NF para Parceiro PJ */}
                      {payout.salesperson?.salesperson_type === 'pj_partner' && (
                        <div className="flex items-center gap-2">
                          {payout.invoice_url ? (
                            <Button variant="outline" size="sm" asChild className="h-7 md:h-8 text-xs">
                              <a href={payout.invoice_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="w-3.5 h-3.5 mr-1 text-green-500" />
                                NF #{payout.invoice_number}
                              </a>
                            </Button>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] h-5">
                              <XCircle className="w-3 h-3 mr-1" />
                              NF não anexada
                            </Badge>
                          )}
                        </div>
                      )}

                      {payout.status === 'rejected' && payout.rejection_reason && (
                        <p className="text-xs text-red-600">
                          <strong>Motivo:</strong> {payout.rejection_reason}
                        </p>
                      )}

                      {/* Botões de Ação */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {payout.status === 'requested' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenApproval(payout)} 
                            className="flex-1 md:flex-none h-8"
                          >
                            <CheckCircle className="w-4 h-4 md:mr-1" />
                            <span className="hidden md:inline">Analisar</span>
                          </Button>
                        )}

                        {payout.status === 'approved' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleOpenApproval(payout)} 
                            className="flex-1 md:flex-none h-8"
                          >
                            <DollarSign className="w-4 h-4 md:mr-1" />
                            <span className="hidden md:inline">Marcar Pago</span>
                          </Button>
                        )}

                        {payout.payment_proof_url && (
                          <Button variant="outline" size="sm" asChild className="h-8">
                            <a href={payout.payment_proof_url} target="_blank" rel="noopener noreferrer">
                              <CheckCircle className="w-4 h-4 md:mr-1 text-green-500" />
                              <span className="hidden md:inline">Comprovante</span>
                            </a>
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEdit(payout)}
                          className="h-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de aprovação */}
      {selectedPayout && (
        <PayoutApprovalDialog
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          payout={selectedPayout}
          onSuccess={() => {
            setShowApprovalDialog(false);
            setSelectedPayout(null);
            fetchPayouts();
          }}
        />
      )}

      {/* Dialog de edição */}
      {selectedPayout && (
        <PayoutEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          payout={selectedPayout}
          onSuccess={() => {
            setShowEditDialog(false);
            setSelectedPayout(null);
            fetchPayouts();
          }}
        />
      )}

      {/* Dialog de criação */}
      <PayoutCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          fetchPayouts();
        }}
      />
    </div>
  );
}
