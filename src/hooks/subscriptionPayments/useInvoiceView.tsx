// Selo de status e números do topo.
// Código movido da SubscriptionPaymentsManagementPage sem mudança de comportamento.
import { Badge } from "@/components/ui/badge";

export type UseInvoiceViewDeps = { [K in 'invoices']: any };

export function useInvoiceView(deps: UseInvoiceViewDeps) {
  const { invoices } = deps;
  const getStatusBadge = (status: string, paidAt: string | null) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Paga
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-500/10 dark:text-zinc-400 ring-1 ring-inset ring-zinc-400/20 dark:ring-zinc-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Cancelada
        </span>
      );
    }
    if (status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Vencida
        </span>
      );
    }
    if (paidAt === null && status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Pendente
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Aguardando
        </span>
      );
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

  return {
    getStatusBadge,
    stats,
  };
}
