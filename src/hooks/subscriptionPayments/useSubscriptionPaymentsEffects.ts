// Efeitos da tela (mesma ordem do original): carga inicial e filtro.
// Código movido da SubscriptionPaymentsManagementPage sem mudança de comportamento.
import { useEffect } from "react";

export type UseSubscriptionPaymentsEffectsDeps = { [K in 'invoices' | 'statusFilter' | 'searchTerm' | 'fetchInvoices' | 'fetchStores' | 'fetchPlans' | 'filterInvoices' | 'fetchMasterWhatsAppStatus' | 'fetchPendingApprovals']: any };

export function useSubscriptionPaymentsEffects(deps: UseSubscriptionPaymentsEffectsDeps) {
  const { invoices, statusFilter, searchTerm, fetchInvoices, fetchStores, fetchPlans, filterInvoices, fetchMasterWhatsAppStatus, fetchPendingApprovals } = deps;

  useEffect(() => {
    fetchInvoices();
    fetchStores();
    fetchPlans();
    fetchPendingApprovals();
    fetchMasterWhatsAppStatus();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [statusFilter, searchTerm, invoices]);
}
