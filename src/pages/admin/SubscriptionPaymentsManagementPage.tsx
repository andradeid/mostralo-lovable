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
import { Receipt, Check, X, Eye, Search, Filter, Plus, Pencil, Trash2, UserPlus, Clock, AlertCircle, CheckCircle2, Loader2, Copy, Building2, DollarSign, Ticket, Link2, MessageCircle, Phone } from "lucide-react";
import { formatPhone, normalizePhone } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";

interface CouponInfo {
  coupon_id: string;
  coupon_code: string;
  coupon_name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_applied: number;
  original_price: number;
}

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
    price: number;
  };
  coupon_info?: CouponInfo | null;
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
  referred_by_salesperson_id: string | null;
  pix_txid?: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
  plans?: {
    name: string;
  };
  salesperson?: {
    full_name: string;
    referral_code: string;
  };
}

// Helper para extrair EndToEndId do campo notes
const extractTransactionId = (notes: string | null): string | null => {
  if (!notes) return null;
  
  // Tentar extrair EndToEndId do JSON
  try {
    const parsed = JSON.parse(notes);
    if (parsed.EndToEndId) return parsed.EndToEndId;
    if (parsed.endToEndId) return parsed.endToEndId;
    if (parsed.e2eId) return parsed.e2eId;
  } catch {
    // Se não for JSON, tentar encontrar padrão de ID
    // CORRIGIDO: Aceitar letras e números (alfanumérico) após o "E"
    const match = notes.match(/E[a-zA-Z0-9]{20,35}/);
    if (match) return match[0];
    
    // Alternativamente, buscar após "EndToEndId:"
    const endToEndMatch = notes.match(/EndToEndId:\s*([a-zA-Z0-9]+)/);
    if (endToEndMatch) return endToEndMatch[1];
  }
  
  return null;
};

// Helper para copiar texto
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('ID copiado!');
};

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
  
  // Estados para pagamento direto (Master Admin)
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [pixTransactionId, setPixTransactionId] = useState("");
  const [extendSubscription, setExtendSubscription] = useState(true);
  const [monthsToExtend, setMonthsToExtend] = useState(1);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Estados para envio por WhatsApp
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [masterWhatsAppStatus, setMasterWhatsAppStatus] = useState<string | null>(null);

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
    fetchMasterWhatsAppStatus();
  }, []);

  const fetchMasterWhatsAppStatus = async () => {
    try {
      const { data } = await supabase
        .from('master_whatsapp_config')
        .select('instance_status')
        .limit(1)
        .single();
      
      setMasterWhatsAppStatus(data?.instance_status || null);
    } catch (err) {
      console.error('Erro ao buscar status WhatsApp Master:', err);
    }
  };

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

          // Buscar vendedor que indicou (se houver)
          let salesperson = null;
          if (approval.referred_by_salesperson_id) {
            const { data: sp } = await supabase
              .from('salespeople')
              .select('full_name, referral_code')
              .eq('id', approval.referred_by_salesperson_id)
              .single();
            salesperson = sp;
          }

          return {
            ...approval,
            profiles: profile,
            stores: store,
            plans: plan,
            salesperson,
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
        plans (name, price)
      `)
      .order('due_date', { ascending: false });

    if (data) {
      // Buscar informações de cupom para cada fatura via payment_approvals
      const invoicesWithCoupons = await Promise.all(
        data.map(async (invoice: any) => {
          // Buscar payment_approval da loja que tenha cupom
          const { data: approvalWithCoupon } = await supabase
            .from('payment_approvals')
            .select(`
              coupon_id,
              coupon_discount,
              payment_amount,
              coupons (
                code,
                name,
                discount_type,
                discount_value
              )
            `)
            .eq('store_id', invoice.store_id)
            .not('coupon_id', 'is', null)
            .eq('status', 'approved')
            .order('approved_at', { ascending: false })
            .limit(1)
            .single();

          let coupon_info: CouponInfo | null = null;
          
          if (approvalWithCoupon?.coupons) {
            const coupon = approvalWithCoupon.coupons as any;
            coupon_info = {
              coupon_id: approvalWithCoupon.coupon_id,
              coupon_code: coupon.code,
              coupon_name: coupon.name,
              discount_type: coupon.discount_type,
              discount_value: coupon.discount_value,
              discount_applied: approvalWithCoupon.coupon_discount || 0,
              original_price: invoice.plans?.price || invoice.amount + (approvalWithCoupon.coupon_discount || 0)
            };
          }

          return {
            ...invoice,
            coupon_info
          };
        })
      );

      setInvoices(invoicesWithCoupons as any);
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

    setCreatingInvoice(true);
    
    try {
      // Preparar dados base da fatura
      const invoiceData: any = {
        store_id: formData.store_id,
        plan_id: formData.plan_id,
        amount: Number(formData.amount),
        due_date: formData.due_date,
        notes: formData.notes || null,
        payment_status: markAsPaid ? 'paid' : 'pending'
      };

      // Se marcado como pago, adicionar informações de pagamento
      if (markAsPaid) {
        invoiceData.paid_at = new Date(paymentDate).toISOString();
        invoiceData.approved_at = new Date().toISOString();
        invoiceData.payment_method = paymentMethod;
        
        // Adicionar ID da transação PIX nas notas
        if (pixTransactionId) {
          const existingNotes = formData.notes || '';
          invoiceData.notes = `${existingNotes}${existingNotes ? ' | ' : ''}PIX ID: ${pixTransactionId}`.trim();
        }
      }

      const { data: createdInvoice, error } = await supabase
        .from('subscription_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error || !createdInvoice) {
        toast.error("Erro ao criar fatura");
        console.error(error);
        return;
      }

      const invoiceId = createdInvoice.id;

      // Se marcado como pago E opção de estender assinatura ativa
      if (markAsPaid && extendSubscription && monthsToExtend > 0) {
        // Buscar data atual de expiração da loja
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('subscription_expires_at')
          .eq('id', formData.store_id)
          .single();

        if (!storeError && store) {
          // Calcular nova data de expiração
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

          // Adicionar meses
          newExpirationDate.setMonth(newExpirationDate.getMonth() + monthsToExtend);

          // Atualizar loja com nova data de expiração
          const { error: updateStoreError } = await supabase
            .from('stores')
            .update({
              subscription_expires_at: newExpirationDate.toISOString(),
              status: 'active'
            })
            .eq('id', formData.store_id);

          if (updateStoreError) {
            console.error("Erro ao estender assinatura:", updateStoreError);
            toast.warning("Fatura criada, mas erro ao estender assinatura");
          } else {
            toast.success(`Fatura paga criada! Assinatura estendida até ${format(newExpirationDate, "dd/MM/yyyy", { locale: ptBR })}`);
          }
        }
      } else if (markAsPaid) {
        toast.success("Fatura criada como PAGA com sucesso!");
      } else {
        toast.success("Fatura criada com sucesso!");
      }

      // Enviar link por WhatsApp se solicitado (apenas para faturas pendentes)
      if (sendWhatsApp && whatsappPhone && !markAsPaid) {
        setSendingWhatsApp(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const response = await supabase.functions.invoke('send-invoice-whatsapp', {
              body: {
                invoice_id: invoiceId,
                phone_number: normalizePhone(whatsappPhone)
              }
            });

            if (response.error) {
              console.error('Erro ao enviar WhatsApp:', response.error);
              toast.error('Fatura criada, mas erro ao enviar WhatsApp');
            } else {
              toast.success('📱 Link de pagamento enviado por WhatsApp!');
            }
          }
        } catch (whatsappError) {
          console.error('Erro ao enviar WhatsApp:', whatsappError);
          toast.error('Fatura criada, mas erro ao enviar WhatsApp');
        } finally {
          setSendingWhatsApp(false);
        }
      }
      
      setShowCreateDialog(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      toast.error("Erro ao criar fatura");
      console.error(error);
    } finally {
      setCreatingInvoice(false);
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
    // Reset estados de pagamento direto
    setMarkAsPaid(false);
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("pix");
    setPixTransactionId("");
    setExtendSubscription(true);
    setMonthsToExtend(1);
    // Reset estados de WhatsApp
    setSendWhatsApp(false);
    setWhatsappPhone("");
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
          <CardContent className="space-y-4">
            {/* Mobile: Cards Redesenhados com Avatar e Layout Compacto */}
            <div className="md:hidden space-y-3">
              {pendingApprovals.map((approval) => {
                const fullName = approval.profiles?.full_name || 'Nome não informado';
                const initials = fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                
                return (
                  <div 
                    key={approval.id} 
                    className="rounded-xl border border-yellow-500/30 bg-card overflow-hidden shadow-sm"
                  >
                    {/* Header: Avatar + Nome + Badge */}
                    <div className="p-3 flex items-start gap-3">
                      {/* Avatar com Iniciais */}
                      <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{initials}</span>
                      </div>
                      
                      {/* Info do Cliente */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-foreground truncate text-sm">
                            {fullName}
                          </p>
                          <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs shrink-0">
                            PENDENTE
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {approval.profiles?.email || 'Email não informado'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Empresa e CNPJ */}
                    <div className="px-3 pb-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground truncate">{approval.company_name || 'Empresa não informada'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-5.5 pl-0.5">
                        {approval.company_document || 'CNPJ não informado'}
                      </p>
                    </div>
                    
                    {/* Grid: Plano + Data */}
                    <div className="px-3 pb-2 grid grid-cols-2 gap-2">
                      <div className="bg-muted/40 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Plano</p>
                        <Badge variant="secondary" className="mt-0.5 text-xs">
                          {approval.plans?.name || 'Plano'}
                        </Badge>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Data</p>
                        <p className="text-xs font-medium text-foreground mt-0.5">
                          {format(new Date(approval.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Valor em Destaque */}
                    <div className="mx-3 mb-2 bg-green-500/10 rounded-lg p-2.5 flex items-center justify-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span className="text-xl font-bold text-green-500">
                        R$ {approval.payment_amount?.toFixed(2) || '0,00'}
                      </span>
                    </div>
                    
                    {/* Vendedor (se houver) */}
                    {approval.salesperson && (
                      <div className="mx-3 mb-2 flex items-center gap-1.5 text-xs text-blue-500">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>
                          Indicado por <strong>{approval.salesperson.full_name}</strong>
                          <span className="text-muted-foreground ml-1">({approval.salesperson.referral_code})</span>
                        </span>
                      </div>
                    )}
                    
                    {/* Botões Compactos */}
                    <div className="p-3 pt-2 border-t border-border space-y-2">
                      {/* Comprovante */}
                      {approval.payment_proof_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9"
                          onClick={() => {
                            setSelectedProofUrl(approval.payment_proof_url!);
                            setShowProofDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Ver Comprovante
                        </Button>
                      ) : (
                        <div className="w-full h-9 flex items-center justify-center bg-muted/30 rounded-md text-xs text-muted-foreground">
                          Sem comprovante
                        </div>
                      )}
                      
                      {/* Aprovar + Rejeitar lado a lado */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="h-9 bg-green-600 hover:bg-green-700 text-white"
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
                          variant="destructive"
                          size="sm"
                          className="h-9"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowRejectDialog(true);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>PIX ID</TableHead>
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
                        {approval.pix_txid ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs truncate max-w-[100px]" title={approval.pix_txid}>
                              {approval.pix_txid.slice(0, 12)}...
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(approval.pix_txid!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
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
                              setSelectedProofUrl(approval.payment_proof_url!);
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
            </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardHeader className="pb-1 pt-3 px-3 md:pb-2 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">📋 Total de Faturas</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Todas as faturas geradas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-3 md:pb-2 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">✅ Pagas</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <p className="text-xl md:text-2xl font-bold text-green-500">{stats.paid}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Faturas com pagamento confirmado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-3 md:pb-2 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">⏳ Aguardando</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <p className="text-xl md:text-2xl font-bold text-yellow-500">{stats.pending}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Comprovante enviado, aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-3 md:pb-2 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">💰 Total Recebido</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <p className="text-lg md:text-2xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Soma de todas as faturas pagas (dinheiro que entrou)
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

          {/* Mobile: Cards compactos para faturas */}
          <div className="md:hidden space-y-3">
            {filteredInvoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma fatura encontrada</p>
            ) : (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="p-3 rounded-lg border bg-card w-[90%] mx-auto">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm truncate max-w-[50%]">{invoice.stores?.name || '-'}</span>
                    <div className="flex items-center gap-1">
                      {invoice.coupon_info && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] px-1.5">
                          <Ticket className="w-3 h-3 mr-0.5" />
                          {invoice.coupon_info.coupon_code}
                        </Badge>
                      )}
                      {getStatusBadge(invoice.payment_status, invoice.paid_at)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {invoice.stores?.profiles?.full_name || '-'} • {invoice.stores?.profiles?.email || '-'}
                  </p>
                  
                  {/* Cupom aplicado - exibir desconto */}
                  {invoice.coupon_info && (
                    <div className="mt-2 p-2 bg-purple-500/10 rounded-md border border-purple-500/20">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Valor original:</span>
                        <span className="line-through text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.coupon_info.original_price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-0.5">
                        <span className="text-purple-600 dark:text-purple-400">Desconto ({invoice.coupon_info.coupon_code}):</span>
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.coupon_info.discount_applied)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {invoice.plans?.name || '-'} • {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="font-bold text-green-500">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-3 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowDetailDialog(true);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3"
                      onClick={() => openEditDialog(invoice)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 px-3"
                      onClick={() => openDeleteDialog(invoice)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: Tabela original */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Lojista</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>ID Transação</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma fatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const txId = extractTransactionId(invoice.notes);
                    return (
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
                        {txId ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs truncate max-w-[100px]" title={txId}>
                              {txId.slice(0, 12)}...
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(txId)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                       </TableCell>
                       <TableCell className="font-medium">
                         <div className="flex flex-col gap-1">
                           <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}</span>
                           {invoice.coupon_info && (
                             <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] w-fit">
                               <Ticket className="w-3 h-3 mr-1" />
                               {invoice.coupon_info.coupon_code}
                             </Badge>
                           )}
                         </div>
                       </TableCell>
                       <TableCell>
                        {getStatusBadge(invoice.payment_status, invoice.paid_at)}
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const paymentLink = `${window.location.origin}/invoice-payment/${invoice.id}`;
                                navigator.clipboard.writeText(paymentLink);
                                toast.success('Link de pagamento copiado!');
                              }}
                              title="Copiar link de pagamento"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          )}
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
                    );
                  })
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

              {/* Seção de Cupom/Desconto Aplicado */}
              {selectedInvoice.coupon_info && (
                <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="w-5 h-5 text-purple-500" />
                    <p className="font-semibold text-purple-600 dark:text-purple-400">Desconto Aplicado</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Cupom</p>
                      <p className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {selectedInvoice.coupon_info.coupon_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nome</p>
                      <p className="font-medium">{selectedInvoice.coupon_info.coupon_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo de Desconto</p>
                      <p className="font-medium">
                        {selectedInvoice.coupon_info.discount_type === 'percentage' 
                          ? `${selectedInvoice.coupon_info.discount_value}% de desconto`
                          : `R$ ${selectedInvoice.coupon_info.discount_value.toFixed(2)} de desconto`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Economia</p>
                      <p className="font-bold text-green-500">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.coupon_info.discount_applied)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Original</p>
                      <p className="line-through text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.coupon_info.original_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Valor Final</p>
                      <p className="text-xl font-bold text-green-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {extractTransactionId(selectedInvoice.notes) && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">ID de Transação (EndToEndId)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded break-all">
                      {extractTransactionId(selectedInvoice.notes)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(extractTransactionId(selectedInvoice.notes)!)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
              )}

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

              {/* Link de Pagamento */}
              {selectedInvoice.payment_status === 'pending' && (
                <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/30">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Link de Pagamento
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/invoice-payment/${selectedInvoice.id}`}
                      className="flex-1 px-3 py-2 text-xs bg-background rounded border truncate"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const paymentLink = `${window.location.origin}/invoice-payment/${selectedInvoice.id}`;
                        navigator.clipboard.writeText(paymentLink);
                        toast.success('Link de pagamento copiado!');
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Envie este link para o lojista pagar via PIX com QR Code automático
                  </p>
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
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Criar Nova Fatura</DialogTitle>
            <DialogDescription>
              Crie uma nova fatura de assinatura manualmente
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
            <div>
              <Label htmlFor="store">Loja *</Label>
              <Select 
                value={formData.store_id} 
                onValueChange={async (value) => {
                  const store = stores.find(s => s.id === value);
                  setSelectedStoreData(store || null);
                  
                  // Buscar telefone do dono da loja
                  if (store) {
                    const { data: storeData } = await supabase
                      .from('stores')
                      .select('owner_id, profiles:owner_id(phone)')
                      .eq('id', value)
                      .single();
                    
                    if (storeData?.profiles) {
                      const ownerPhone = (storeData.profiles as any)?.phone;
                      if (ownerPhone) {
                        setWhatsappPhone(formatPhone(ownerPhone));
                      }
                    }
                  }
                  
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

            {/* Seção de Pagamento Direto (Master Admin) */}
            <Card className={`border-2 transition-all ${markAsPaid ? 'border-green-500 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="mark-as-paid"
                    checked={markAsPaid}
                    onChange={(e) => setMarkAsPaid(e.target.checked)}
                    className="h-5 w-5 accent-green-500"
                  />
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className={`w-5 h-5 ${markAsPaid ? 'text-green-500' : 'text-muted-foreground'}`} />
                      Pagamento Direto (Master Admin)
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Marcar como já paga (sem comprovante do lojista)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              {markAsPaid && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="payment-date">Data do Pagamento</Label>
                      <Input
                        id="payment-date"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-method">Método</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                          <SelectItem value="card">Cartão</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="other">Outro (Dinheiro, etc.)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pix-id">ID da Transação PIX (opcional)</Label>
                    <Input
                      id="pix-id"
                      value={pixTransactionId}
                      onChange={(e) => setPixTransactionId(e.target.value)}
                      placeholder="Ex: E12345678901234567890123456789012"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="extend-subscription"
                        checked={extendSubscription}
                        onChange={(e) => setExtendSubscription(e.target.checked)}
                        className="h-4 w-4 accent-blue-500"
                      />
                      <div className="flex-1">
                        <Label htmlFor="extend-subscription" className="text-sm font-medium cursor-pointer">
                          Estender assinatura automaticamente
                        </Label>
                      </div>
                      {extendSubscription && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">+</span>
                          <Select 
                            value={monthsToExtend.toString()} 
                            onValueChange={(v) => setMonthsToExtend(Number(v))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="12">12</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-muted-foreground">mês(es)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                    <p className="font-medium text-green-700 dark:text-green-400">
                      ✓ A fatura será criada como PAGA automaticamente
                    </p>
                    {extendSubscription && (
                      <p className="text-muted-foreground mt-1">
                        A assinatura será estendida em {monthsToExtend} mês(es)
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Seção de Envio por WhatsApp (apenas para faturas pendentes) */}
            {!markAsPaid && (
              <Card className={`border-2 transition-all ${sendWhatsApp ? 'border-green-500 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="send-whatsapp"
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      className="h-5 w-5 accent-green-500"
                      disabled={masterWhatsAppStatus !== 'connected'}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className={`w-5 h-5 ${sendWhatsApp ? 'text-green-500' : 'text-muted-foreground'}`} />
                        Enviar Link por WhatsApp
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Enviar link de pagamento automaticamente via WhatsApp Master
                      </CardDescription>
                    </div>
                    {masterWhatsAppStatus === 'connected' ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        ✅ Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                        ❌ Desconectado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                {sendWhatsApp && masterWhatsAppStatus === 'connected' && (
                  <CardContent className="space-y-4 pt-0">
                    <div>
                      <Label htmlFor="whatsapp-phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Número do WhatsApp *
                      </Label>
                      <Input
                        id="whatsapp-phone"
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(formatPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Preenchido automaticamente com o telefone do dono da loja
                      </p>
                    </div>

                    {/* Preview da mensagem */}
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">📝 Preview da mensagem:</p>
                      <div className="text-xs bg-background rounded-lg p-3 whitespace-pre-wrap border-l-4 border-green-500">
                        {`Olá ${selectedStoreData?.name ? 'Lojista' : ''}! 👋

Sua fatura do Mostralo está disponível:

🏪 Loja: ${selectedStoreData?.name || '[Nome da Loja]'}
💰 Valor: ${formData.amount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(formData.amount)) : 'R$ 0,00'}
📅 Vencimento: ${formData.due_date ? new Date(formData.due_date).toLocaleDateString('pt-BR') : '[Data]'}

💳 Pague agora pelo link:
[Link será gerado automaticamente]

O QR Code PIX será gerado quando você acessar! 🚀`}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                      <p className="font-medium text-green-700 dark:text-green-400">
                        📱 Após criar a fatura, o link será enviado automaticamente
                      </p>
                    </div>
                  </CardContent>
                )}

                {sendWhatsApp && masterWhatsAppStatus !== 'connected' && (
                  <CardContent className="pt-0">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                      <p className="font-medium text-red-700 dark:text-red-400">
                        ⚠️ WhatsApp Master não está conectado
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Conecte o WhatsApp Master nas configurações antes de enviar mensagens.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creatingInvoice}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateInvoice} 
              disabled={creatingInvoice}
              className={markAsPaid ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {creatingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : markAsPaid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Criar Fatura Paga
                </>
              ) : (
                "Criar Fatura"
              )}
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
