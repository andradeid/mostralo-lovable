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
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'requested':
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><Clock className="w-3 h-3 mr-1" />Solicitado</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-blue-500 text-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'affiliate') {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          <User className="w-3 h-3 mr-1" />
          Afiliado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-600">
        <Building2 className="w-3 h-3 mr-1" />
        Parceiro PJ
      </Badge>
    );
  };

  const filteredPayouts = payouts.filter(p => {
    switch (activeTab) {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pagamentos de Vendedores</h1>
          <p className="text-muted-foreground">Gerencie solicitações de pagamento de afiliados e parceiros</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Payout Manual
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.requested}</div>
            <p className="text-xs text-muted-foreground">
              R$ {stats.totalRequested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago Este Mês</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.paidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Em {format(new Date(), "MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payouts.length}</div>
            <p className="text-xs text-muted-foreground">
              Desde o início
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtro */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações</CardTitle>
          <CardDescription>Gerencie as solicitações de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="requested" className="relative">
                Solicitados
                {stats.requested > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {stats.requested}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Aprovados</TabsTrigger>
              <TabsTrigger value="paid">Pagos</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredPayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma solicitação {activeTab !== 'all' ? 'neste status' : ''}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{payout.salesperson?.full_name || 'Vendedor'}</span>
                          {getTypeBadge(payout.salesperson?.salesperson_type || 'affiliate')}
                          {getStatusBadge(payout.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            {payout.salesperson?.salesperson_type === 'affiliate' 
                              ? `CPF: ${payout.salesperson?.cpf || 'N/A'}`
                              : `CNPJ: ${payout.salesperson?.cnpj || 'N/A'} - ${payout.salesperson?.company_name || ''}`
                            }
                          </p>
                          <p>
                            Período: {format(new Date(payout.cycle_year, payout.cycle_month - 1), "MMMM/yyyy", { locale: ptBR })}
                            {' • '}{payout.total_sales} venda(s)
                          </p>
                          {payout.requested_at && (
                            <p>Solicitado em: {format(new Date(payout.requested_at), "dd/MM/yyyy HH:mm")}</p>
                          )}
                          {payout.pix_key && (
                            <p>PIX: <span className="font-mono">{payout.pix_key}</span> ({payout.pix_key_type})</p>
                          )}
                        </div>

                        {/* NF para Parceiro PJ */}
                        {payout.salesperson?.salesperson_type === 'pj_partner' && (
                          <div className="flex items-center gap-2 mt-2">
                            {payout.invoice_url ? (
                              <Button variant="outline" size="sm" asChild>
                                <a href={payout.invoice_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="w-4 h-4 mr-1 text-green-500" />
                                  Ver NF #{payout.invoice_number}
                                </a>
                              </Button>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                NF não anexada
                              </Badge>
                            )}
                          </div>
                        )}

                        {payout.status === 'rejected' && payout.rejection_reason && (
                          <p className="text-sm text-red-600 mt-2">
                            <strong>Motivo:</strong> {payout.rejection_reason}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-xl">
                          R$ {Number(payout.grand_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        
                        <div className="text-xs text-muted-foreground text-right">
                          <p>Comissão: R$ {Number(payout.commission_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          {Number(payout.bonus_total) > 0 && (
                            <p className="text-green-600">Bônus: R$ {Number(payout.bonus_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          )}
                        </div>

                        {payout.status === 'requested' && (
                          <Button onClick={() => handleOpenApproval(payout)}>
                            Analisar
                          </Button>
                        )}

                        {payout.status === 'approved' && (
                          <Button onClick={() => handleOpenApproval(payout)} variant="outline">
                            Marcar como Pago
                          </Button>
                        )}

                        {payout.payment_proof_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={payout.payment_proof_url} target="_blank" rel="noopener noreferrer">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Ver Comprovante
                            </a>
                          </Button>
                        )}

                        {/* Botão de edição */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEdit(payout)}
                          className="text-muted-foreground"
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
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
