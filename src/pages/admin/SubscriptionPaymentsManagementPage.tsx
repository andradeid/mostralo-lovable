import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionPaymentsPage } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";
import { PendingApprovalsSection } from "@/components/admin/subscription-payments/page/PendingApprovalsSection";
import { InvoiceKpiCards } from "@/components/admin/subscription-payments/page/InvoiceKpiCards";
import { InvoicesTableSection } from "@/components/admin/subscription-payments/page/InvoicesTableSection";
import { InvoiceDetailDialog } from "@/components/admin/subscription-payments/page/InvoiceDetailDialog";
import { ProofViewDialog } from "@/components/admin/subscription-payments/page/ProofViewDialog";
import { CreateInvoiceDialog } from "@/components/admin/subscription-payments/page/CreateInvoiceDialog";
import { EditInvoiceDialog } from "@/components/admin/subscription-payments/page/EditInvoiceDialog";
import { DeleteInvoiceDialog } from "@/components/admin/subscription-payments/page/DeleteInvoiceDialog";
import { ApprovalDialog } from "@/components/admin/subscription-payments/page/ApprovalDialog";
import { RejectApprovalDialog } from "@/components/admin/subscription-payments/page/RejectApprovalDialog";
import { PaidExternallyDialog } from "@/components/admin/subscription-payments/page/PaidExternallyDialog";
import { MarkPaidDialog } from "@/components/admin/subscription-payments/page/MarkPaidDialog";

// Tela de pagamentos de assinatura: só orquestra. Lógica em hooks/subscriptionPayments, blocos em components/admin/subscription-payments/page.

export default function SubscriptionPaymentsManagementPage() {
  const ctx = useSubscriptionPaymentsPage();
  const { loading, openCreateDialog } = ctx;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando faturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto px-1 md:px-2">
      {/* ───── HEADER ───── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Faturas</h1>
          <p className="text-sm text-muted-foreground/80 mt-1">Gerencie e acompanhe os pagamentos de assinaturas</p>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="h-9 shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Fatura
        </Button>
      </div>

      {/* ───── ALERT: ASSINANTES PENDENTES (compacto quando vazio) ───── */}
      <PendingApprovalsSection ctx={ctx} />

      {/* ───── KPIs ───── */}
      <InvoiceKpiCards ctx={ctx} />

      {/* ───── TODAS AS FATURAS (principal) ───── */}
      <InvoicesTableSection ctx={ctx} />

      {/* Dialog de Detalhes */}
      <InvoiceDetailDialog ctx={ctx} />

      {/* Dialog de Visualização do Comprovante */}
      <ProofViewDialog ctx={ctx} />

      {/* Dialog de Criar Fatura */}
      <CreateInvoiceDialog ctx={ctx} />

      {/* Dialog de Editar Fatura */}
      <EditInvoiceDialog ctx={ctx} />

      {/* Dialog de Excluir Fatura */}
      <DeleteInvoiceDialog ctx={ctx} />

      {/* Dialog de Aprovação de Pagamento */}
      <ApprovalDialog ctx={ctx} />

      {/* Dialog de Rejeição de Pagamento */}
      <RejectApprovalDialog ctx={ctx} />

      {/* Dialog de Pago por Fora */}
      <PaidExternallyDialog ctx={ctx} />

      {/* Dialog Marcar como Pago */}
      <MarkPaidDialog ctx={ctx} />
    </div>
  );
}
