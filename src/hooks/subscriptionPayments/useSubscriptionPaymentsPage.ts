// Tela de pagamentos de assinatura: junta os hooks na ordem do original.
// Código movido da SubscriptionPaymentsManagementPage sem mudança de comportamento.
import { useSubscriptionPaymentsState } from "./useSubscriptionPaymentsState";
import { useInvoiceLoaders } from "./useInvoiceLoaders";
import { usePaymentApprovals } from "./usePaymentApprovals";
import { useInvoiceStatusActions } from "./useInvoiceStatusActions";
import { useInvoiceForms } from "./useInvoiceForms";
import { useInvoiceView } from "./useInvoiceView";
import { useSubscriptionPaymentsEffects } from "./useSubscriptionPaymentsEffects";

export function useSubscriptionPaymentsPage() {
  const h0 = useSubscriptionPaymentsState();
  const ctx0 = { ...h0 };
  const h1 = useInvoiceLoaders(ctx0);
  const ctx1 = { ...ctx0, ...h1 };
  const h2 = usePaymentApprovals(ctx1);
  const ctx2 = { ...ctx1, ...h2 };
  const h3 = useInvoiceStatusActions(ctx2);
  const ctx3 = { ...ctx2, ...h3 };
  const h4 = useInvoiceForms(ctx3);
  const ctx4 = { ...ctx3, ...h4 };
  const h5 = useInvoiceView(ctx4);
  const ctx5 = { ...ctx4, ...h5 };
  useSubscriptionPaymentsEffects(ctx5);
  return ctx5;
}

export type SubscriptionPaymentsPageCtx = ReturnType<typeof useSubscriptionPaymentsPage>;
