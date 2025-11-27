import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CreditCard, Calendar, DollarSign, Upload, FileText, Copy, Check, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface SubscriptionInfo {
  planName: string;
  planPrice: number;
  billingCycle: string;
  subscriptionExpiresAt: string | null;
  storeStatus: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  payment_status: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  pix_key: string | null;
  pix_qr_code: string | null;
  payment_link: string | null;
  notes: string | null;
}

interface PaymentConfig {
  pix_key: string;
  pix_key_type: string;
  account_holder_name: string;
  payment_instructions: string | null;
}

interface PaymentApproval {
  id: string;
  status: string;
  payment_amount: number;
  payment_proof_url: string | null;
  created_at: string;
  rejection_reason: string | null;
  notes: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description: string | null;
  features: any;
  discount_price: number | null;
  promotion_active: boolean | null;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allPaymentApprovals, setAllPaymentApprovals] = useState<PaymentApproval[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentApproval, setPaymentApproval] = useState<PaymentApproval | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [renewalUploading, setRenewalUploading] = useState(false);

  useEffect(() => {
    fetchPaymentApproval();
    fetchAllPaymentApprovals();
    fetchSubscriptionData();
    fetchInvoices();
    fetchPaymentConfig();
    fetchAvailablePlans();
  }, [user]);

  const fetchPaymentApproval = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('payment_approvals')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { data: any | null; error: any };

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar aprovação:', error);
        return;
      }

      setPaymentApproval(data as any);
    } catch (error) {
      console.error('Erro ao buscar aprovação:', error);
    }
  };

  const fetchAllPaymentApprovals = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('payment_approvals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar histórico de aprovações:', error);
        return;
      }

      setAllPaymentApprovals((data || []) as any);
    } catch (error) {
      console.error('Erro ao buscar histórico de aprovações:', error);
    }
  };

  const fetchSubscriptionData = async () => {
    if (!user) return;

    const { data: store } = await supabase
      .from('stores')
      .select(`
        subscription_expires_at,
        status,
        created_at,
        plan_id,
        plans:plan_id (
          name,
          price,
          billing_cycle
        )
      `)
      .eq('owner_id', user.id)
      .single();

    if (store) {
      const plan = (store as any).plans;
      
      setSubscription({
        planName: plan?.name ?? 'Sem Plano',
        planPrice: Number(plan?.price ?? 0),
        billingCycle: plan?.billing_cycle ?? 'monthly',
        subscriptionExpiresAt: store.subscription_expires_at,
        storeStatus: store.status,
        createdAt: store.created_at,
      });
    } else {
      setSubscription({
        planName: 'Sem Plano',
        planPrice: 0,
        billingCycle: 'monthly',
        subscriptionExpiresAt: null,
        storeStatus: 'inactive',
        createdAt: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  const fetchInvoices = async () => {
    if (!user) return;

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!store) return;

    const { data } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('store_id', store.id)
      .order('due_date', { ascending: false });

    if (data) {
      setInvoices(data);
    }
  };

  const fetchPaymentConfig = async () => {
    const { data } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (data) {
      setPaymentConfig(data);
    }
  };

  const fetchAvailablePlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('status', 'active')
      .order('price', { ascending: true });

    if (data) {
      setAvailablePlans(data);
    }
  };

  const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const handleCopyPix = () => {
    if (paymentConfig?.pix_key) {
      navigator.clipboard.writeText(paymentConfig.pix_key);
      setCopied(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !selectedInvoice || !user) return;

    setUploading(true);
    const file = event.target.files[0];

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!store) {
      toast.error("Erro ao identificar loja");
      setUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${store.id}/${selectedInvoice.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('subscription-receipts')
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload do comprovante");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('subscription-receipts')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('subscription_invoices')
      .update({
        payment_proof_url: publicUrl,
        payment_method: 'pix',
        payment_status: 'pending',
      })
      .eq('id', selectedInvoice.id);

    if (updateError) {
      toast.error("Erro ao atualizar fatura");
      setUploading(false);
      return;
    }

    toast.success("Comprovante enviado! Aguarde a aprovação.");
    setShowPaymentDialog(false);
    fetchInvoices();
    setUploading(false);
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

  const handleSelectPlanForRenewal = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowRenewalDialog(true);
  };

  const handleRenewalFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !selectedPlan || !user) return;

    setRenewalUploading(true);

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!store) {
      toast.error("Erro ao identificar loja");
      setRenewalUploading(false);
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${store.id}/renewal-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload do comprovante");
      setRenewalUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    const finalPrice = selectedPlan.promotion_active && selectedPlan.discount_price 
      ? selectedPlan.discount_price 
      : selectedPlan.price;

    const { error: insertError } = await supabase
      .from('payment_approvals')
      .insert({
        user_id: user.id,
        store_id: store.id,
        plan_id: selectedPlan.id,
        payment_amount: finalPrice,
        payment_method: 'pix',
        payment_proof_url: publicUrl,
        status: 'pending',
        notes: 'Renovação de assinatura',
      });

    if (insertError) {
      toast.error("Erro ao enviar comprovante");
      setRenewalUploading(false);
      return;
    }

    toast.success("Comprovante enviado! Aguardando aprovação do administrador.");
    setShowRenewalDialog(false);
    setSelectedPlan(null);
    setRenewalUploading(false);
    fetchPaymentApproval();
    fetchAllPaymentApprovals();
  };

  const getSubscriptionStatus = () => {
    if (!subscription?.subscriptionExpiresAt) return { badge: <Badge>Sem Plano</Badge>, text: '', isExpired: false };
    
    const daysUntil = Math.ceil((new Date(subscription.subscriptionExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (subscription.storeStatus === 'inactive' || daysUntil < 0) {
      return { 
        badge: <Badge variant="destructive">❌ Expirado</Badge>, 
        text: 'Sua assinatura expirou. Regularize o pagamento para continuar usando o sistema.',
        isExpired: true
      };
    }
    
    if (daysUntil <= 7) {
      return { 
        badge: <Badge variant="secondary" className="bg-yellow-500">⚠️ Próximo ao Vencimento</Badge>, 
        text: `Sua assinatura vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}. Não se esqueça de renovar!`,
        isExpired: false
      };
    }
    
    return { 
      badge: <Badge variant="default" className="bg-green-500">✅ Ativo</Badge>, 
      text: 'Sua assinatura está ativa e em dia.',
      isExpired: false
    };
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const status = getSubscriptionStatus();
  const hasPendingRenewal = paymentApproval?.status === 'pending' && paymentApproval?.notes === 'Renovação de assinatura';

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Minha Assinatura</h1>
        <p className="text-muted-foreground">Gerencie sua assinatura e pagamentos</p>
      </div>

      {/* Alert de Assinatura Expirada */}
      {status.isExpired && !hasPendingRenewal && (
        <Alert className="border-red-500/50 bg-red-500/5">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-red-700 dark:text-red-400">
                ❌ Assinatura Expirada
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                Sua assinatura expirou em {subscription?.subscriptionExpiresAt 
                  ? format(new Date(subscription.subscriptionExpiresAt), "dd/MM/yyyy", { locale: ptBR })
                  : '-'
                }. Renove agora para continuar usando o sistema.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Alert de Renovação Pendente */}
      {hasPendingRenewal && (
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <Clock className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                ⏳ Renovação em Análise
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                Seu comprovante de renovação foi enviado e está sendo analisado pelo administrador. 
                Assim que aprovado, sua assinatura será reativada automaticamente.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Enviado em: {format(new Date(paymentApproval.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Alert de Status de Aprovação (Cadastro Inicial) */}
      {paymentApproval?.status === 'pending' && !hasPendingRenewal && (
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <Clock className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                ⏳ Aguardando Aprovação de Pagamento
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                {paymentApproval.payment_proof_url ? (
                  <>
                    Seu comprovante de pagamento foi enviado e está sendo analisado pelo administrador. 
                    Você será notificado assim que for aprovado.
                  </>
                ) : (
                  <>
                    Você ainda não enviou o comprovante de pagamento. 
                    Complete o processo para ativar sua conta.
                  </>
                )}
              </p>
              {!paymentApproval.payment_proof_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate('/payment-proof')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Comprovante
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Criado em: {format(new Date(paymentApproval.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {paymentApproval?.status === 'rejected' && (
        <Alert className="border-red-500/50 bg-red-500/5">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-red-700 dark:text-red-400">
                ❌ Pagamento Rejeitado
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                Seu pagamento foi rejeitado pelo administrador.
                {paymentApproval.rejection_reason && (
                  <><br /><strong>Motivo:</strong> {paymentApproval.rejection_reason}</>
                )}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => navigate('/payment-proof')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Enviar Novo Comprovante
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Seção de Renovação - Planos Disponíveis */}
      {status.isExpired && !hasPendingRenewal && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Renovar Assinatura
            </CardTitle>
            <CardDescription>
              Escolha um plano para renovar sua assinatura e continuar usando o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePlans.map((plan) => {
                const finalPrice = plan.promotion_active && plan.discount_price 
                  ? plan.discount_price 
                  : plan.price;
                const hasDiscount = plan.promotion_active && plan.discount_price;

                return (
                  <Card key={plan.id} className="relative overflow-hidden">
                    {hasDiscount && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
                        PROMOÇÃO
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        {hasDiscount && (
                          <p className="text-sm text-muted-foreground line-through">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                          </p>
                        )}
                        <p className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                          </span>
                        </p>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleSelectPlanForRenewal(plan)}
                      >
                        Selecionar Plano
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Principal - Informações da Assinatura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-4">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Minha Assinatura
              </span>
              {status.badge}
            </CardTitle>
            <CardDescription>{status.text}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="text-lg font-bold">
                    {subscription?.planName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription?.planPrice ?? 0)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{subscription?.billingCycle === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Expira em</p>
                  <p className="text-lg font-bold">
                    {subscription?.subscriptionExpiresAt 
                      ? new Date(subscription.subscriptionExpiresAt).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Situação da assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                status.text.includes('ativa') ? 'bg-green-500' : 
                status.text.includes('Próxima') ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} />
              <span className="text-sm font-medium">
                {status.text.includes('ativa') ? 'Tudo em dia' : 
                 status.text.includes('Próxima') ? 'Atenção necessária' : 
                 'Ação imediata requerida'}
              </span>
            </div>
            <div className="pt-4 space-y-2 text-sm">
              <p className="text-muted-foreground">
                {status.text.includes('ativa')
                  ? 'Sua assinatura está ativa e todos os recursos estão disponíveis.' 
                  : status.text.includes('Próxima')
                  ? 'Sua assinatura está próxima ao vencimento. Regularize para continuar.'
                  : 'Sua assinatura expirou. Pague as mensalidades pendentes para reativar.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Mensalidades */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensalidades</CardTitle>
          <CardDescription>Visualize todas as suas faturas e pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Payment Approvals (cadastro inicial e renovações) */}
                {allPaymentApprovals.map((approval) => (
                  <TableRow key={`approval-${approval.id}`}>
                    <TableCell>
                      {format(new Date(approval.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Assinatura</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(approval.payment_amount)}
                    </TableCell>
                    <TableCell>
                      {approval.status === 'approved' && (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Aprovado
                        </Badge>
                      )}
                      {approval.status === 'pending' && (
                        <Badge className="bg-yellow-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Aguardando
                        </Badge>
                      )}
                      {approval.status === 'rejected' && (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Rejeitado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {approval.payment_proof_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedProofUrl(approval.payment_proof_url);
                            setShowProofDialog(true);
                          }}
                        >
                          Ver Comprovante
                        </Button>
                      )}
                      {approval.status === 'rejected' && approval.rejection_reason && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="ml-2"
                          onClick={() => toast.error(approval.rejection_reason || 'Sem motivo especificado')}
                        >
                          Ver Motivo
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Invoices (faturas mensais) */}
                {invoices.map((invoice) => (
                  <TableRow key={`invoice-${invoice.id}`}>
                    <TableCell>
                      {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Mensalidade</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.payment_status, invoice.paid_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.payment_status !== 'paid' && (
                        <Button 
                          size="sm" 
                          onClick={() => handlePayClick(invoice)}
                          disabled={invoice.payment_proof_url !== null && invoice.payment_status === 'pending'}
                        >
                          {invoice.payment_proof_url && invoice.payment_status === 'pending' 
                            ? 'Aguardando Aprovação' 
                            : 'Pagar'}
                        </Button>
                      )}
                      {invoice.payment_proof_url && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="ml-2"
                          onClick={() => {
                            setSelectedProofUrl(invoice.payment_proof_url);
                            setShowProofDialog(true);
                          }}
                        >
                          Ver Comprovante
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Empty state */}
                {invoices.length === 0 && allPaymentApprovals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Realizar Pagamento</DialogTitle>
            <DialogDescription>
              Fatura de R$ {selectedInvoice?.amount.toFixed(2)} - 
              Vencimento: {selectedInvoice && format(new Date(selectedInvoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {paymentConfig && (
              <>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Chave PIX</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={paymentConfig.pix_key} 
                        readOnly 
                        className="flex-1"
                      />
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={handleCopyPix}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Titular da Conta</Label>
                    <p className="font-medium mt-1">{paymentConfig.account_holder_name}</p>
                  </div>

                  {paymentConfig.payment_instructions && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Instruções</Label>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {paymentConfig.payment_instructions}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Anexar Comprovante de Pagamento</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: Imagens e PDF (máx. 5MB)
                  </p>
                </div>

                {uploading && (
                  <div className="text-center text-sm text-muted-foreground">
                    Enviando comprovante...
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Comprovante */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              Visualização do comprovante enviado
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-auto max-h-[70vh]">
            {selectedProofUrl && (
              <img 
                src={selectedProofUrl} 
                alt="Comprovante de pagamento" 
                className="max-w-full h-auto rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Renovação */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renovar Assinatura</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <>
                  Plano {selectedPlan.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    selectedPlan.promotion_active && selectedPlan.discount_price 
                      ? selectedPlan.discount_price 
                      : selectedPlan.price
                  )}/{selectedPlan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {paymentConfig && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Realize o pagamento via PIX e envie o comprovante para análise
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Chave PIX</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={paymentConfig.pix_key} 
                        readOnly 
                        className="flex-1 font-mono"
                      />
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={handleCopyPix}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <p className="font-medium mt-1 capitalize">{paymentConfig.pix_key_type === 'phone' ? 'Telefone' : paymentConfig.pix_key_type}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Titular da Conta</Label>
                    <p className="font-medium mt-1">{paymentConfig.account_holder_name}</p>
                  </div>

                  {selectedPlan && (
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">Valor a Pagar</Label>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          selectedPlan.promotion_active && selectedPlan.discount_price 
                            ? selectedPlan.discount_price 
                            : selectedPlan.price
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Anexar Comprovante de Pagamento</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleRenewalFileUpload}
                      disabled={renewalUploading}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: Imagens e PDF (máx. 5MB)
                  </p>
                </div>

                {renewalUploading && (
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Enviando comprovante...
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
