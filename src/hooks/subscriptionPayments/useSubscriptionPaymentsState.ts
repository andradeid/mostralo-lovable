// Estado da tela de pagamentos de assinatura (faturas, formulários, aprovações, diálogos).
// Código movido da SubscriptionPaymentsManagementPage sem mudança de comportamento.
import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import type { Invoice, Store, Plan, PaymentApproval } from "@/lib/subscriptionPayments/types";

export function useSubscriptionPaymentsState() {
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
  const [showPaidExternallyDialog, setShowPaidExternallyDialog] = useState(false);
  const [paidExternallyAmount, setPaidExternallyAmount] = useState("");
  const [paidExternallyNotes, setPaidExternallyNotes] = useState("");

  // Estados para marcar fatura como paga
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null);
  const [markPaidMethod, setMarkPaidMethod] = useState("pix");
  const [markPaidNotes, setMarkPaidNotes] = useState("");
  const [markPaidExtendSub, setMarkPaidExtendSub] = useState(true);
  const [processingMarkPaid, setProcessingMarkPaid] = useState(false);

  return {
    invoices,
    setInvoices,
    filteredInvoices,
    setFilteredInvoices,
    selectedInvoice,
    setSelectedInvoice,
    showDetailDialog,
    setShowDetailDialog,
    showProofDialog,
    setShowProofDialog,
    selectedProofUrl,
    setSelectedProofUrl,
    loading,
    setLoading,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    stores,
    setStores,
    plans,
    setPlans,
    formData,
    setFormData,
    useCustomPrice,
    setUseCustomPrice,
    originalPlanPrice,
    setOriginalPlanPrice,
    selectedStoreData,
    setSelectedStoreData,
    markAsPaid,
    setMarkAsPaid,
    paymentDate,
    setPaymentDate,
    paymentMethod,
    setPaymentMethod,
    pixTransactionId,
    setPixTransactionId,
    extendSubscription,
    setExtendSubscription,
    monthsToExtend,
    setMonthsToExtend,
    creatingInvoice,
    setCreatingInvoice,
    sendWhatsApp,
    setSendWhatsApp,
    whatsappPhone,
    setWhatsappPhone,
    sendingWhatsApp,
    setSendingWhatsApp,
    masterWhatsAppStatus,
    setMasterWhatsAppStatus,
    pendingApprovals,
    setPendingApprovals,
    loadingApprovals,
    setLoadingApprovals,
    selectedApproval,
    setSelectedApproval,
    showApprovalDialog,
    setShowApprovalDialog,
    showRejectDialog,
    setShowRejectDialog,
    rejectionReason,
    setRejectionReason,
    processingApproval,
    setProcessingApproval,
    showPaidExternallyDialog,
    setShowPaidExternallyDialog,
    paidExternallyAmount,
    setPaidExternallyAmount,
    paidExternallyNotes,
    setPaidExternallyNotes,
    showMarkPaidDialog,
    setShowMarkPaidDialog,
    markPaidInvoice,
    setMarkPaidInvoice,
    markPaidMethod,
    setMarkPaidMethod,
    markPaidNotes,
    setMarkPaidNotes,
    markPaidExtendSub,
    setMarkPaidExtendSub,
    processingMarkPaid,
    setProcessingMarkPaid,
    user,
  };
}
