import { useState, useEffect, useRef } from "react";
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
import { CreditCard, Calendar, DollarSign, Upload, FileText, Copy, Check, Clock, AlertCircle, CheckCircle2, QrCode, Gift, Tag, X, Loader2, RefreshCw, Receipt, ExternalLink, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useCouponValidation } from "@/hooks/useCouponValidation";

interface SubscriptionInfo {
  planName: string;
  planPrice: number;
  billingCycle: string;
  subscriptionExpiresAt: string | null;
  storeStatus: string;
  createdAt: string;
  customMonthlyPrice: number | null;
  discountReason: string | null;
  actualPrice: number;
  currentPlanId: string | null;
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
  pix_txid: string | null;
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
  pix_txid: string | null;
  pix_copia_cola: string | null;
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

interface CouponInfo {
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  discountApplied: number;
  // Campos do plano pago para exibição correta
  paidPlanPrice: number;
  paidPlanName: string;
  finalPaidAmount: number;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);

  // Estados para cupom de desconto na renovação
  const [renewalCouponCode, setRenewalCouponCode] = useState('');
  const [appliedRenewalCoupon, setAppliedRenewalCoupon] = useState<{
    id: string;
    code: string;
    discountAmount: number;
    finalPrice: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  } | null>(null);
  const [renewalCouponError, setRenewalCouponError] = useState<string | null>(null);

  // Estados para PIX automático na renovação
  const [generatingRenewalPix, setGeneratingRenewalPix] = useState(false);
  const [renewalPixData, setRenewalPixData] = useState<{
    txid: string;
    qrCodeBase64: string;
    pixCopiaECola: string;
    expiresAt: string;
  } | null>(null);
  const [checkingRenewalPixStatus, setCheckingRenewalPixStatus] = useState(false);
  const renewalPollingRef = useRef<NodeJS.Timeout | null>(null);

  const { validateCoupon, loading: couponValidationLoading } = useCouponValidation();

  // Extrai EndToEndId do campo notes da invoice
  const extractEndToEndId = (notes: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/EndToEndId:\s*([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success("ID copiado!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  useEffect(() => {
    fetchPaymentApproval();
    fetchAllPaymentApprovals();
    fetchSubscriptionData();
    fetchInvoices();
    fetchPaymentConfig();
    fetchAvailablePlans();
    fetchCouponInfo();
  }, [user]);

  const fetchCouponInfo = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_approvals')
        .select(`
          coupon_id,
          coupon_discount,
          payment_amount,
          plan_id,
          plans:plan_id (
            name,
            price
          ),
          coupons:coupon_id (
            code,
            name,
            discount_type,
            discount_value
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .not('coupon_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar cupom:', error);
        return;
      }
      
      if (data && data.coupons) {
        const couponData = data.coupons as any;
        const planData = data.plans as any;
        
        setCouponInfo({
          code: couponData.code,
          name: couponData.name,
          discountType: couponData.discount_type,
          discountValue: couponData.discount_value,
          discountApplied: data.coupon_discount || 0,
          paidPlanPrice: planData?.price || 0,
          paidPlanName: planData?.name || '',
          finalPaidAmount: data.payment_amount || 0,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar cupom:', error);
    }
  };

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
        custom_monthly_price,
        discount_reason,
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
      
      // ✅ Se o plano vinculado retornar null (plano inativo), buscar diretamente pelo plan_id
      let planData = plan;
      if (!plan && store.plan_id) {
        const { data: directPlan } = await supabase
          .from('plans')
          .select('name, price, billing_cycle')
          .eq('id', store.plan_id)
          .single();
        planData = directPlan;
      }
      
      const planPrice = Number(planData?.price ?? 0);
      const customPrice = store.custom_monthly_price ? Number(store.custom_monthly_price) : null;
      const actualPrice = customPrice ?? planPrice;
      
      setSubscription({
        planName: planData?.name ?? 'Sem Plano',
        planPrice: planPrice,
        billingCycle: planData?.billing_cycle ?? 'monthly',
        subscriptionExpiresAt: store.subscription_expires_at,
        storeStatus: store.status,
        createdAt: store.created_at,
        customMonthlyPrice: customPrice,
        discountReason: store.discount_reason,
        actualPrice: actualPrice,
        currentPlanId: store.plan_id,
      });
    } else {
      setSubscription({
        planName: 'Sem Plano',
        planPrice: 0,
        billingCycle: 'monthly',
        subscriptionExpiresAt: null,
        storeStatus: 'inactive',
        createdAt: new Date().toISOString(),
        customMonthlyPrice: null,
        discountReason: null,
        actualPrice: 0,
        currentPlanId: null,
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

  // ===== FUNÇÕES DE CUPOM E PIX PARA RENOVAÇÃO =====

  const getRenewalBasePrice = () => {
    if (!selectedPlan) return 0;
    
    // Se tem desconto personalizado E é o mesmo plano, usa o preço personalizado
    if (subscription?.customMonthlyPrice && selectedPlan.id === subscription.currentPlanId) {
      return subscription.actualPrice;
    }
    
    // Senão, usa o preço do plano (com promoção se houver)
    return selectedPlan.promotion_active && selectedPlan.discount_price 
      ? selectedPlan.discount_price 
      : selectedPlan.price;
  };

  type PlanChangeIntent = 'renewal' | 'upgrade';

  const getPlanChangeIntent = (planId: string): PlanChangeIntent => {
    const currentPlanId = subscription?.currentPlanId;
    const expiresAt = subscription?.subscriptionExpiresAt;

    // Se não temos data de expiração, assume "renewal" exceto quando claramente é troca de plano
    if (!expiresAt) {
      return currentPlanId && planId !== currentPlanId ? 'upgrade' : 'renewal';
    }

    const daysUntil = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = subscription?.storeStatus === 'inactive' || daysUntil < 0;
    const isExpiring = daysUntil <= 7;

    if (isExpired || isExpiring) return 'renewal';
    if (currentPlanId && planId !== currentPlanId) return 'upgrade';
    return 'renewal';
  };

  const handleApplyRenewalCoupon = async () => {
    if (!renewalCouponCode.trim() || !selectedPlan || !user) return;
    
    setRenewalCouponError(null);
    const basePrice = getRenewalBasePrice();

    const result = await validateCoupon(renewalCouponCode.trim(), selectedPlan.id, basePrice, user.id);

    if (result.isValid && result.coupon) {
      setAppliedRenewalCoupon({
        id: result.coupon.id,
        code: result.coupon.code,
        discountAmount: result.discountAmount,
        finalPrice: result.finalPrice,
        discountType: result.coupon.discount_type,
        discountValue: result.coupon.discount_value,
      });
      toast.success(`🎉 Cupom aplicado! Você economizou R$ ${result.discountAmount.toFixed(2)}`);
    } else {
      setRenewalCouponError(result.error || 'Cupom inválido');
    }
  };

  const handleRemoveRenewalCoupon = () => {
    setAppliedRenewalCoupon(null);
    setRenewalCouponCode('');
    setRenewalCouponError(null);
  };

  const generateRenewalPix = async () => {
    if (!selectedPlan || !user) return;
    
    setGeneratingRenewalPix(true);
    
    try {
      const basePrice = getRenewalBasePrice();
      const finalPrice = appliedRenewalCoupon ? appliedRenewalCoupon.finalPrice : basePrice;

      const intent = getPlanChangeIntent(selectedPlan.id);
      const paymentNotes = intent === 'upgrade' ? 'Upgrade de plano' : 'Renovação de assinatura';
      const descriptionPrefix = intent === 'upgrade' ? 'Upgrade Mostralo' : 'Renovação Mostralo';

      const { data, error } = await supabase.functions.invoke('efi-create-pix-charge', {
        body: {
          valor: finalPrice.toFixed(2),
          descricao: `${descriptionPrefix} - ${selectedPlan.name}`,
          expiracao_segundos: 3600,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro ao gerar PIX');

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 3600);

      // Buscar store_id
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      // Criar payment_approval com dados do PIX
      await supabase.from('payment_approvals').insert({
        user_id: user.id,
        store_id: store?.id,
        plan_id: selectedPlan.id,
        payment_amount: finalPrice,
        payment_method: 'pix',
        status: 'pending',
        notes: paymentNotes,
        pix_txid: data.txid,
        pix_location: data.location,
        pix_qrcode_base64: data.qrCodeBase64,
        pix_copia_cola: data.pixCopiaECola,
        pix_expires_at: expiresAt.toISOString(),
        coupon_id: appliedRenewalCoupon?.id || null,
        coupon_discount: appliedRenewalCoupon?.discountAmount || 0,
      });

      setRenewalPixData({
        txid: data.txid,
        qrCodeBase64: data.qrCodeBase64,
        pixCopiaECola: data.pixCopiaECola,
        expiresAt: expiresAt.toISOString(),
      });

      toast.success('QR Code PIX gerado! Escaneie para pagar.');
      startRenewalPixPolling(data.txid);
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', error);
      toast.error(error.message || 'Erro ao gerar PIX. Tente novamente.');
    } finally {
      setGeneratingRenewalPix(false);
    }
  };

  const checkRenewalPixStatus = async (txid: string) => {
    setCheckingRenewalPixStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('efi-check-pix-status', {
        body: { txid },
      });

      if (data?.systemStatus === 'paid') {
        if (renewalPollingRef.current) clearInterval(renewalPollingRef.current);
        toast.success('🎉 Pagamento Confirmado! Sua assinatura foi renovada.');
        closeRenewalDialog();
        fetchSubscriptionData();
        fetchPaymentApproval();
        fetchAllPaymentApprovals();
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setCheckingRenewalPixStatus(false);
    }
  };

  const startRenewalPixPolling = (txid: string) => {
    if (renewalPollingRef.current) clearInterval(renewalPollingRef.current);
    checkRenewalPixStatus(txid);
    renewalPollingRef.current = setInterval(() => checkRenewalPixStatus(txid), 5000);
  };

  const closeRenewalDialog = () => {
    if (renewalPollingRef.current) clearInterval(renewalPollingRef.current);
    setShowRenewalDialog(false);
    setRenewalPixData(null);
    setAppliedRenewalCoupon(null);
    setRenewalCouponCode('');
    setRenewalCouponError(null);
    setSelectedPlan(null);
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

    const finalPrice = subscription?.customMonthlyPrice 
      ?? (selectedPlan.promotion_active && selectedPlan.discount_price 
        ? selectedPlan.discount_price 
        : selectedPlan.price);

    const intent = getPlanChangeIntent(selectedPlan.id);
    const paymentNotes = intent === 'upgrade' ? 'Upgrade de plano' : 'Renovação de assinatura';

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
        notes: paymentNotes,
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
    if (!subscription?.subscriptionExpiresAt) return { badge: <Badge>Sem Plano</Badge>, text: '', isExpired: false, isExpiring: false };
    
    const daysUntil = Math.ceil((new Date(subscription.subscriptionExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (subscription.storeStatus === 'inactive' || daysUntil < 0) {
      return { 
        badge: <Badge variant="destructive">❌ Expirado</Badge>, 
        text: 'Sua assinatura expirou. Regularize o pagamento para continuar usando o sistema.',
        isExpired: true,
        isExpiring: false
      };
    }
    
    if (daysUntil <= 7) {
      return { 
        badge: <Badge variant="secondary" className="bg-yellow-500">⚠️ Próximo ao Vencimento</Badge>, 
        text: `Sua assinatura vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}. Não se esqueça de renovar!`,
        isExpired: false,
        isExpiring: true // ✅ Flag para mostrar opções de renovação
      };
    }
    
    return { 
      badge: <Badge variant="default" className="bg-green-500">✅ Ativo</Badge>, 
      text: 'Sua assinatura está ativa e em dia.',
      isExpired: false,
      isExpiring: false
    };
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const status = getSubscriptionStatus();
  const hasPendingRenewal = paymentApproval?.status === 'pending' && paymentApproval?.notes === 'Renovação de assinatura';
  const hasPendingUpgrade = paymentApproval?.status === 'pending' && paymentApproval?.notes === 'Upgrade de plano';
  const hasPendingPlanChange = hasPendingRenewal || hasPendingUpgrade;

  return (
    <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Minha Assinatura</h1>
        <p className="text-sm md:text-base text-muted-foreground">Gerencie sua assinatura e pagamentos</p>
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

      {/* Alert de Upgrade Pendente */}
      {hasPendingUpgrade && (
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <Clock className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                ⏳ Upgrade em Análise
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                Seu pedido de upgrade foi enviado e está aguardando aprovação. Assim que aprovado, o novo plano será aplicado e o ciclo reiniciará.
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
                ⏳ {paymentApproval.pix_txid ? 'Pagamento PIX em Processamento' : 'Aguardando Aprovação de Pagamento'}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                {paymentApproval.pix_txid ? (
                  <>
                    Seu pagamento PIX está sendo processado automaticamente. 
                    Assim que o banco confirmar, sua conta será ativada automaticamente.
                  </>
                ) : paymentApproval.payment_proof_url ? (
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
              {!paymentApproval.payment_proof_url && !paymentApproval.pix_txid && (
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
              {paymentApproval.pix_txid && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate('/payment-proof')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Ver QR Code PIX
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
      {(status.isExpired || status.isExpiring) && !hasPendingPlanChange && (
        <Card className="border-primary/50">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
              {status.isExpired ? 'Renovar Assinatura' : 'Renovar ou Trocar de Plano'}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {status.isExpired ? (
                subscription?.customMonthlyPrice 
                  ? 'Renove mantendo seu desconto especial'
                  : 'Escolha um plano para continuar usando o sistema'
              ) : (
                subscription?.customMonthlyPrice
                  ? 'Assinatura próxima ao vencimento. Renove mantendo seu desconto!'
                  : 'Assinatura próxima ao vencimento. Renove ou escolha um novo plano!'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            {/* Se tem desconto personalizado, mostrar apenas o plano atual com destaque */}
            {subscription?.customMonthlyPrice && subscription.currentPlanId ? (
              <div className="space-y-4">
                <Card className="relative overflow-hidden border-primary bg-primary/5">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground px-2 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded-bl-lg">
                    🎁 SEU PLANO ESPECIAL
                  </div>
                  {availablePlans.filter(p => p.id === subscription.currentPlanId).map((plan) => {
                    const discountPercent = Math.round(((subscription.planPrice - subscription.actualPrice) / subscription.planPrice) * 100);
                    
                    return (
                      <div key={plan.id}>
                        <CardHeader className="pb-2 md:pb-3 pt-8 md:pt-10">
                          <CardTitle className="text-lg md:text-2xl">{plan.name}</CardTitle>
                          <CardDescription className="text-xs md:text-base">
                            {plan.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0">
                          <div className="p-3 md:p-4 bg-background/60 rounded-lg space-y-2 md:space-y-3 border">
                            <div>
                              <p className="text-xs md:text-sm text-muted-foreground">Preço normal</p>
                              <p className="text-base md:text-lg line-through text-muted-foreground">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription.planPrice)}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs md:text-sm font-medium">SEU PREÇO</p>
                                <Badge className="bg-green-500 text-white text-[10px] md:text-xs">
                                  -{discountPercent}% OFF
                                </Badge>
                              </div>
                              <p className="text-xl md:text-3xl font-bold text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription.actualPrice)}
                                <span className="text-xs md:text-base font-normal text-muted-foreground">
                                  /{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                                </span>
                              </p>
                            </div>
                            {subscription.discountReason && (
                              <div className="pt-2 border-t">
                                <p className="text-[10px] md:text-xs text-muted-foreground">Motivo do desconto</p>
                                <p className="text-xs md:text-sm font-medium">{subscription.discountReason}</p>
                              </div>
                            )}
                          </div>
                          <Button 
                            className="w-full h-9 md:h-10 text-sm" 
                            size="lg"
                            onClick={() => handleSelectPlanForRenewal(plan)}
                          >
                            Renovar com Meu Desconto Especial
                          </Button>
                        </CardContent>
                      </div>
                    );
                  })}
                </Card>

                {/* Opção de ver outros planos */}
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                    Ou escolha outro plano (perde desconto atual)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {availablePlans.filter(p => p.id !== subscription.currentPlanId).map((plan) => {
                      const finalPrice = plan.promotion_active && plan.discount_price 
                        ? plan.discount_price 
                        : plan.price;
                      const hasDiscount = plan.promotion_active && plan.discount_price;

                      return (
                        <Card key={plan.id} className="relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                          {hasDiscount && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
                              PROMOÇÃO
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription className="line-clamp-2 text-xs">
                              {plan.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              {hasDiscount && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                                </p>
                              )}
                              <p className="text-xl font-bold text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                                <span className="text-xs font-normal text-muted-foreground">
                                  /{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                                </span>
                              </p>
                            </div>
                            <Button 
                              className="w-full" 
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectPlanForRenewal(plan)}
                            >
                              Selecionar Este Plano
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Comportamento normal: mostrar todos os planos */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePlans.map((plan) => {
                  const finalPrice = plan.promotion_active && plan.discount_price 
                    ? plan.discount_price 
                    : plan.price;
                  const hasDiscount = plan.promotion_active && plan.discount_price;

                  return (
                    <Card key={plan.id} className="relative overflow-hidden">
                      {hasDiscount && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-[10px] md:text-xs font-bold">
                          PROMO
                        </div>
                      )}
                      <CardHeader className="p-3 md:p-4 pb-2">
                        <CardTitle className="text-base md:text-xl">{plan.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs md:text-sm">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4 pt-0 space-y-3 md:space-y-4">
                        <div>
                          {hasDiscount && (
                            <p className="text-xs text-muted-foreground line-through">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                            </p>
                          )}
                          <p className="text-lg md:text-2xl font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                            <span className="text-[10px] md:text-sm font-normal text-muted-foreground">
                              /{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                            </span>
                          </p>
                        </div>
                        <Button 
                          className="w-full h-9 text-sm" 
                          onClick={() => handleSelectPlanForRenewal(plan)}
                        >
                          Selecionar Plano
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção de Upgrade - Planos Sempre Visíveis (assinatura ativa) */}
      {!status.isExpired && !status.isExpiring && availablePlans.length > 0 && (
        <Card className="border-primary/50">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
              Trocar de Plano (Upgrade)
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Se você fizer upgrade, após aprovação o plano muda imediatamente e o ciclo reinicia a partir de hoje.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0 space-y-4">
            {subscription?.customMonthlyPrice && (
              <Alert>
                <AlertDescription className="text-xs md:text-sm">
                  Você possui um preço especial no plano atual. Ao trocar de plano, esse desconto não se aplica.
                </AlertDescription>
              </Alert>
            )}

            {hasPendingPlanChange && (
              <Alert className="border-yellow-500/50 bg-yellow-500/5">
                <Clock className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-xs md:text-sm">
                  Você já tem uma solicitação pendente ({paymentApproval?.notes}). Aguarde a aprovação para solicitar outra troca.
                </AlertDescription>
              </Alert>
            )}

            {subscription?.currentPlanId && (
              (() => {
                const currentPlan = availablePlans.find((p) => p.id === subscription.currentPlanId);
                if (!currentPlan) return null;

                return (
                  <Card className="relative overflow-hidden border-primary bg-primary/5">
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground px-2 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded-bl-lg">
                      PLANO ATUAL
                    </div>
                    <CardHeader className="pb-2 md:pb-3 pt-8 md:pt-10">
                      <CardTitle className="text-lg md:text-2xl">{currentPlan.name}</CardTitle>
                      <CardDescription className="text-xs md:text-base">{currentPlan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0">
                      <div>
                        <p className="text-xl md:text-3xl font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription.actualPrice)}
                          <span className="text-xs md:text-base font-normal text-muted-foreground">
                            /{currentPlan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                          </span>
                        </p>
                      </div>
                      <Button className="w-full h-9 md:h-10 text-sm" size="lg" disabled>
                        Plano atual
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePlans
                .filter((p) => p.id !== subscription?.currentPlanId)
                .map((plan) => {
                  const finalPrice = plan.promotion_active && plan.discount_price
                    ? plan.discount_price
                    : plan.price;
                  const hasDiscount = plan.promotion_active && plan.discount_price;

                  return (
                    <Card key={plan.id} className="relative overflow-hidden">
                      {hasDiscount && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-[10px] md:text-xs font-bold">
                          PROMO
                        </div>
                      )}
                      <CardHeader className="p-3 md:p-4 pb-2">
                        <CardTitle className="text-base md:text-xl">{plan.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs md:text-sm">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4 pt-0 space-y-3 md:space-y-4">
                        <div>
                          {hasDiscount && (
                            <p className="text-xs text-muted-foreground line-through">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                            </p>
                          )}
                          <p className="text-lg md:text-2xl font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                            <span className="text-[10px] md:text-sm font-normal text-muted-foreground">
                              /{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                            </span>
                          </p>
                        </div>
                        <Button
                          className="w-full h-9 text-sm"
                          onClick={() => handleSelectPlanForRenewal(plan)}
                          disabled={hasPendingPlanChange}
                        >
                          Fazer upgrade
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
              <span className="flex items-center gap-2 text-base md:text-lg">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                Minha Assinatura
              </span>
              {status.badge}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">{status.text}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0 space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-muted/50">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Plano</p>
                  <p className="text-sm md:text-lg font-bold truncate">
                    {subscription?.planName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-muted/50">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
                <div className="space-y-0.5 md:space-y-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Valor</p>
                  {couponInfo && subscription ? (
                    <div className="space-y-1 md:space-y-2">
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        De: <span className="line-through">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(couponInfo.paidPlanPrice)}</span>
                      </p>
                      <p className="text-base md:text-xl font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(couponInfo.finalPaidAmount)}
                        <span className="text-[10px] md:text-sm font-normal text-muted-foreground">/{subscription.billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                      </p>
                      <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-green-600 dark:text-green-500">
                        <span>💰</span>
                        <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(couponInfo.discountApplied)}</span>
                        <Badge variant="secondary" className="text-[8px] md:text-[10px] px-1 py-0 h-3 md:h-4">
                          -{couponInfo.paidPlanPrice > 0 ? Math.round((couponInfo.discountApplied / couponInfo.paidPlanPrice) * 100) : 0}%
                        </Badge>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        🎟️ <span className="font-medium">{couponInfo.code}</span>
                      </p>
                    </div>
                  ) : subscription?.customMonthlyPrice ? (
                    <div className="space-y-0.5 md:space-y-1">
                      <div className="flex items-center gap-1 md:gap-2">
                        <p className="text-[10px] md:text-xs line-through text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription.planPrice)}
                        </p>
                        <Badge className="bg-green-500 text-white text-[8px] md:text-[10px] px-1 py-0">
                          -{Math.round(((subscription.planPrice - subscription.actualPrice) / subscription.planPrice) * 100)}%
                        </Badge>
                      </div>
                      <p className="text-base md:text-lg font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription.actualPrice)}
                        <span className="text-[10px] md:text-sm font-normal text-muted-foreground">
                          /{subscription.billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </p>
                      {subscription.discountReason && (
                        <p className="text-[10px] md:text-xs text-muted-foreground italic truncate">
                          {subscription.discountReason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-base md:text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription?.planPrice ?? 0)}
                      <span className="text-[10px] md:text-sm font-normal text-muted-foreground">
                        /{subscription?.billingCycle === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-muted/50">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Expira em</p>
                  <p className="text-sm md:text-lg font-bold">
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
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-base md:text-lg">Status</CardTitle>
            <CardDescription className="text-xs md:text-sm">Situação da assinatura</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${
                status.text.includes('ativa') ? 'bg-green-500' : 
                status.text.includes('Próxima') ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} />
              <span className="text-xs md:text-sm font-medium">
                {status.text.includes('ativa') ? 'Tudo em dia' : 
                 status.text.includes('Próxima') ? 'Atenção necessária' : 
                 'Ação imediata requerida'}
              </span>
            </div>
            <div className="pt-3 md:pt-4 space-y-2 text-xs md:text-sm">
              <p className="text-muted-foreground">
                {status.text.includes('ativa')
                  ? 'Sua assinatura está ativa e todos os recursos estão disponíveis.' 
                  : status.text.includes('Próxima')
                  ? 'Regularize para continuar usando.'
                  : 'Pague para reativar.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Mensalidades */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-lg">Histórico de Mensalidades</CardTitle>
          <CardDescription className="text-xs md:text-sm">Visualize suas faturas e pagamentos</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="text-xs">Valor</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">ID Transação</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Links</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={`invoice-${invoice.id}`}>
                    <TableCell className="text-xs md:text-sm py-2 md:py-4">
                      {format(new Date(invoice.due_date), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="text-[10px] md:text-xs">Mensalidade</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs md:text-sm py-2 md:py-4">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                    </TableCell>
                    <TableCell className="py-2 md:py-4">
                      {getStatusBadge(invoice.payment_status, invoice.paid_at)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2 md:py-4">
                      {(() => {
                        const endToEndId = extractEndToEndId(invoice.notes);
                        const transactionId = endToEndId || invoice.pix_txid;
                        if (!transactionId) return <span className="text-muted-foreground text-xs">-</span>;
                        return (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] md:text-xs" title={transactionId}>
                              ...{transactionId.slice(-8)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 md:h-6 md:w-6"
                              onClick={() => handleCopyId(transactionId)}
                            >
                              {copiedId === transactionId ? (
                                <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-green-500" />
                              ) : (
                                <Copy className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              )}
                            </Button>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-2 md:py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 md:h-7 md:w-7"
                          asChild
                          title="Ver fatura"
                        >
                          <a href={`/invoice-payment/${invoice.id}`} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3 w-3 md:h-4 md:w-4" />
                          </a>
                        </Button>
                        {invoice.payment_status === 'paid' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 md:h-7 md:w-7"
                            asChild
                            title="Ver recibo"
                          >
                            <a href={`/receipt/${invoice.id}`} target="_blank" rel="noopener noreferrer">
                              <Receipt className="h-3 w-3 md:h-4 md:w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 md:py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botão de ver comprovante quando existe */}
                        {invoice.payment_proof_url && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 md:h-8 md:w-8"
                            title="Ver comprovante"
                            onClick={() => {
                              setSelectedProofUrl(invoice.payment_proof_url!);
                              setShowProofDialog(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        )}
                        {invoice.payment_status !== 'paid' && (
                          <Button 
                            size="sm" 
                            className="h-7 text-xs md:h-8 md:text-sm"
                            onClick={() => handlePayClick(invoice)}
                            disabled={invoice.payment_proof_url !== null && invoice.payment_status === 'pending'}
                          >
                            {invoice.payment_proof_url && invoice.payment_status === 'pending' 
                              ? 'Aguardando' 
                              : 'Pagar'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Empty state */}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6 md:py-8 text-xs md:text-sm">
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
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Realizar Pagamento</DialogTitle>
            <DialogDescription className="text-sm">
              Fatura de R$ {selectedInvoice?.amount.toFixed(2)} - 
              Vencimento: {selectedInvoice && format(new Date(selectedInvoice.due_date), "dd/MM/yy", { locale: ptBR })}
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

      {/* Dialog de Renovação com Cupom e PIX Automático */}
      <Dialog open={showRenewalDialog} onOpenChange={(open) => {
        if (!open) closeRenewalDialog();
        else setShowRenewalDialog(true);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />
              Renovar Assinatura
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedPlan && `Plano ${selectedPlan.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4">
            {/* Se ainda não gerou PIX, mostrar opções de cupom e preço */}
            {!renewalPixData ? (
              <>
                {/* Card de Preço */}
                <div className="p-3 md:p-4 bg-muted rounded-lg space-y-2 md:space-y-3">
                  {/* Preço base */}
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {subscription?.customMonthlyPrice && selectedPlan?.id === subscription.currentPlanId 
                        ? 'Seu preço personalizado' 
                        : 'Preço do plano'}
                    </p>
                    {appliedRenewalCoupon ? (
                      <p className="text-base md:text-lg line-through text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getRenewalBasePrice())}
                      </p>
                    ) : (
                      <p className="text-xl md:text-2xl font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getRenewalBasePrice())}
                      </p>
                    )}
                  </div>

                  {/* Desconto de cupom aplicado */}
                  {appliedRenewalCoupon && (
                    <>
                      <div className="flex items-center justify-between text-green-600">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Gift className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="text-xs md:text-sm font-medium">
                            Cupom {appliedRenewalCoupon.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2">
                          <span className="text-xs md:text-sm font-medium">
                            -R$ {appliedRenewalCoupon.discountAmount.toFixed(2)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 md:h-6 md:w-6 p-0"
                            onClick={handleRemoveRenewalCoupon}
                          >
                            <X className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs md:text-sm text-muted-foreground">Preço final</p>
                        <p className="text-xl md:text-2xl font-bold text-green-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appliedRenewalCoupon.finalPrice)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Campo de Cupom */}
                {!appliedRenewalCoupon && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                      <Tag className="h-3 w-3 md:h-4 md:w-4" />
                      Tem um cupom?
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Código"
                        value={renewalCouponCode}
                        onChange={(e) => {
                          setRenewalCouponCode(e.target.value.toUpperCase());
                          setRenewalCouponError(null);
                        }}
                        className="flex-1 h-9 text-sm"
                      />
                      <Button 
                        variant="outline" 
                        className="h-9 text-sm"
                        onClick={handleApplyRenewalCoupon}
                        disabled={couponValidationLoading || !renewalCouponCode.trim()}
                      >
                        {couponValidationLoading ? (
                          <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                        ) : (
                          'Aplicar'
                        )}
                      </Button>
                    </div>
                    {renewalCouponError && (
                      <p className="text-xs md:text-sm text-destructive">{renewalCouponError}</p>
                    )}
                  </div>
                )}

                {/* Botão Gerar PIX */}
                <Button 
                  className="w-full h-10" 
                  size="lg"
                  onClick={generateRenewalPix}
                  disabled={generatingRenewalPix}
                >
                  {generatingRenewalPix ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Gerar QR Code PIX
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* Se já gerou PIX, mostrar QR Code */
              <div className="space-y-3 md:space-y-4">
                {/* QR Code */}
                <div className="flex flex-col items-center space-y-2 md:space-y-3">
                  <div className="p-3 md:p-4 bg-white rounded-lg shadow-md">
                    <img
                      src={renewalPixData.qrCodeBase64.startsWith('data:') 
                        ? renewalPixData.qrCodeBase64 
                        : `data:image/png;base64,${renewalPixData.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-36 h-36 md:w-48 md:h-48"
                    />
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    Escaneie com o app do seu banco
                  </p>
                </div>

                {/* Valor a pagar */}
                <div className="p-2 md:p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      appliedRenewalCoupon ? appliedRenewalCoupon.finalPrice : getRenewalBasePrice()
                    )}
                  </p>
                </div>

                {/* Copia e Cola */}
                <div className="space-y-1 md:space-y-2">
                  <Label className="text-xs md:text-sm">Código PIX (Copia e Cola)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={renewalPixData.pixCopiaECola} 
                      readOnly 
                      className="font-mono text-[10px] md:text-xs h-9"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        navigator.clipboard.writeText(renewalPixData.pixCopiaECola);
                        toast.success('Código PIX copiado!');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Status de verificação */}
                <Alert className="border-blue-500/50 bg-blue-500/5">
                  <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${checkingRenewalPixStatus ? 'animate-spin' : ''}`} />
                  <AlertDescription className="text-xs md:text-sm">
                    Aguardando pagamento... Verificando a cada 5s.
                  </AlertDescription>
                </Alert>

                {/* Botão verificar manualmente */}
                <Button 
                  variant="outline" 
                  className="w-full h-9 text-sm"
                  onClick={() => checkRenewalPixStatus(renewalPixData.txid)}
                  disabled={checkingRenewalPixStatus}
                >
                  {checkingRenewalPixStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verificar Pagamento
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
