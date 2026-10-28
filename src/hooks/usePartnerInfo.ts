import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerInfo {
  found: boolean;
  name?: string;
  first_name?: string;
  photo_url?: string | null;
  /** Cupom do parceiro (ou o código antigo, se ele ainda não escolheu cupom). */
  code?: string;
  founder?: { count: number; remaining: number; nextNumber: number | null; price: number };
  agenda_plan?: { id: string; price: number } | null;
}

/** Dados públicos do parceiro pelo cupom ou pelo código do link (?ref=). */
export function usePartnerInfo(code: string | null | undefined) {
  const key = code?.trim().toUpperCase() || null;
  return useQuery({
    queryKey: ['partner-info', key],
    enabled: !!key,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PartnerInfo> => {
      const { data, error } = await supabase.rpc('partner_public_info' as never, { p_code: code } as never);
      if (error) throw error;
      return (data as PartnerInfo | null) ?? { found: false };
    },
  });
}

/** Conta uma visita na página do parceiro (uma por sessão do navegador). */
export async function trackPartnerPageView(code: string) {
  const key = `mostralo_partner_view_${code.toUpperCase()}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* segue contando */ }
  await supabase.rpc('track_partner_page_view' as never, { p_code: code } as never);
}
