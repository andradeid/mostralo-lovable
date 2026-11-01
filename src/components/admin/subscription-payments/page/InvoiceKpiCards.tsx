// Números do topo.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Receipt, Clock, CheckCircle2, DollarSign } from "lucide-react";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function InvoiceKpiCards({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { stats } = ctx;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Faturas', value: stats.total.toString(), icon: Receipt, accent: 'text-foreground' },
          { label: 'Pagas', value: stats.paid.toString(), icon: CheckCircle2, accent: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Aguardando', value: stats.pending.toString(), icon: Clock, accent: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total Recebido', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue), icon: DollarSign, accent: 'text-emerald-600 dark:text-emerald-400' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card rounded-xl border border-border/50 px-5 py-4 hover:shadow-md hover:border-border transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/60">{kpi.label}</span>
            </div>
            <p className={`text-2xl md:text-3xl font-bold tracking-tight ${kpi.accent}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
