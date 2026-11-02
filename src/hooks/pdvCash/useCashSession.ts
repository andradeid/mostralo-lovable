import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { normalizeSummary, toMoney, type CashSummary } from '@/lib/pdvCash/cashReport';

// As tabelas/funções do caixa ainda não estão nos tipos gerados do Supabase.
const db = supabase as any;

export interface CashSession {
  id: string;
  store_id: string;
  status: 'open' | 'closed';
  opened_at: string;
  opened_by: string | null;
  opening_amount: number;
  opening_notes: string | null;
  closed_at: string | null;
  closed_by: string | null;
  counted_amount: number | null;
  expected_cash: number | null;
  difference: number | null;
  summary: CashSummary | null;
  closing_notes: string | null;
}

export interface CashMovement {
  id: string;
  session_id: string;
  type: 'sangria' | 'suprimento';
  amount: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ClosedCashSession extends CashSession {
  opened_by_name?: string | null;
  closed_by_name?: string | null;
}

export const cashKeys = {
  all: ['pdv-cash'] as const,
  open: (storeId: string | null) => ['pdv-cash', 'open', storeId] as const,
  summaries: ['pdv-cash', 'summary'] as const,
  summary: (sessionId: string | null | undefined) => ['pdv-cash', 'summary', sessionId] as const,
  movements: (sessionId: string | null | undefined) => ['pdv-cash', 'movements', sessionId] as const,
  history: (storeId: string | null) => ['pdv-cash', 'history', storeId] as const,
  setting: (storeId: string | null) => ['pdv-cash', 'require-open', storeId] as const,
};

function normalizeSession(row: any): CashSession {
  return {
    ...row,
    opening_amount: toMoney(row.opening_amount),
    counted_amount: row.counted_amount == null ? null : toMoney(row.counted_amount),
    expected_cash: row.expected_cash == null ? null : toMoney(row.expected_cash),
    difference: row.difference == null ? null : toMoney(row.difference),
    summary: row.summary ? normalizeSummary(row.summary) : null,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  const msg = (error as { message?: string } | null)?.message;
  return msg && msg.trim() ? msg : fallback;
}

/** Caixa aberto da loja, regra "exigir caixa aberto" e as ações (abrir, sangria/suprimento, fechar). */
export function useCashSession(storeId: string | null) {
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const canManageSettings = userRole === 'store_admin' || userRole === 'master_admin';

  const openQuery = useQuery({
    queryKey: cashKeys.open(storeId),
    enabled: !!storeId,
    staleTime: 30000,
    queryFn: async (): Promise<CashSession | null> => {
      const { data, error } = await db
        .from('cash_sessions')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'open')
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeSession(data) : null;
    },
  });

  const settingQuery = useQuery({
    queryKey: cashKeys.setting(storeId),
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await db
        .from('stores')
        .select('pdv_require_open_cash')
        .eq('id', storeId)
        .maybeSingle();
      if (error) throw error;
      return !!data?.pdv_require_open_cash;
    },
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cashKeys.all });
  }, [queryClient]);

  /** Chamar depois de fechar venda/comanda: só atualiza o resumo se ele estiver na tela. */
  const refreshAfterSale = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cashKeys.summaries });
  }, [queryClient]);

  const openCash = useMutation({
    mutationFn: async (input: { openingAmount: number; notes?: string }) => {
      if (!storeId) throw new Error('Loja não encontrada');
      const { data, error } = await db.rpc('cash_open', {
        p_store_id: storeId,
        p_opening_amount: input.openingAmount,
        p_notes: input.notes?.trim() || null,
      });
      if (error) throw error;
      return normalizeSession(Array.isArray(data) ? data[0] : data);
    },
    onSuccess: () => {
      toast.success('Caixa aberto');
      invalidateAll();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Não foi possível abrir o caixa'));
      invalidateAll();
    },
  });

  const addMovement = useMutation({
    mutationFn: async (input: { sessionId: string; type: 'sangria' | 'suprimento'; amount: number; reason?: string }) => {
      const { data, error } = await db.rpc('cash_add_movement', {
        p_session_id: input.sessionId,
        p_type: input.type,
        p_amount: input.amount,
        p_reason: input.reason?.trim() || null,
      });
      if (error) throw error;
      return data as CashMovement;
    },
    onSuccess: (_d, input) => {
      toast.success(input.type === 'sangria' ? 'Sangria registrada' : 'Suprimento registrado');
      queryClient.invalidateQueries({ queryKey: cashKeys.movements(input.sessionId) });
      queryClient.invalidateQueries({ queryKey: cashKeys.summary(input.sessionId) });
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Não foi possível registrar'));
      invalidateAll();
    },
  });

  const closeCash = useMutation({
    mutationFn: async (input: { sessionId: string; countedAmount: number; notes?: string }) => {
      const { data, error } = await db.rpc('cash_close', {
        p_session_id: input.sessionId,
        p_counted_amount: input.countedAmount,
        p_notes: input.notes?.trim() || null,
      });
      if (error) throw error;
      return normalizeSession(Array.isArray(data) ? data[0] : data);
    },
    onSuccess: () => {
      toast.success('Caixa fechado');
      invalidateAll();
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Não foi possível fechar o caixa'));
      invalidateAll();
    },
  });

  const setRequireOpenCash = useMutation({
    mutationFn: async (value: boolean) => {
      if (!storeId) throw new Error('Loja não encontrada');
      const { data, error } = await db
        .from('stores')
        .update({ pdv_require_open_cash: value })
        .eq('id', storeId)
        .select('pdv_require_open_cash')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Só o dono ou administrador da loja pode mudar essa opção');
      return !!data.pdv_require_open_cash;
    },
    onSuccess: (value) => {
      queryClient.setQueryData(cashKeys.setting(storeId), value);
      toast.success(value ? 'Agora o PDV exige caixa aberto para vender' : 'O PDV não exige mais caixa aberto');
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Não foi possível salvar a opção'));
      queryClient.invalidateQueries({ queryKey: cashKeys.setting(storeId) });
    },
  });

  const openSession = openQuery.data ?? null;
  const requireOpenCash = !!settingQuery.data;

  return {
    openSession,
    isLoading: openQuery.isLoading,
    requireOpenCash,
    /** Loja exige caixa aberto e não há caixa aberto (o banco também barra). */
    salesBlocked: requireOpenCash && !openQuery.isLoading && !openSession,
    canManageSettings,
    openCash,
    addMovement,
    closeCash,
    setRequireOpenCash,
    refreshAfterSale,
  };
}

/** Resumo ao vivo (vendas por forma, sangrias, dinheiro esperado). Só busca quando `enabled`. */
export function useCashSummary(sessionId: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: cashKeys.summary(sessionId),
    enabled: !!sessionId && enabled,
    staleTime: 0, // sempre o número atual ao abrir o fechamento/aba Caixa (sem polling)
    queryFn: async (): Promise<CashSummary> => {
      const { data, error } = await db.rpc('cash_session_summary', { p_session_id: sessionId });
      if (error) throw error;
      return normalizeSummary(data);
    },
  });
}

export function useCashMovements(sessionId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: cashKeys.movements(sessionId),
    enabled: !!sessionId && enabled,
    queryFn: async (): Promise<CashMovement[]> => {
      const { data, error } = await db
        .from('cash_movements')
        .select('id, session_id, type, amount, reason, created_by, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map((m: any) => ({ ...m, amount: toMoney(m.amount) }));
    },
  });
}

/** Busca movimentos de um caixa (para reimprimir relatório de caixa fechado). */
export async function fetchCashMovements(sessionId: string): Promise<CashMovement[]> {
  const { data, error } = await db
    .from('cash_movements')
    .select('id, session_id, type, amount, reason, created_by, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((m: any) => ({ ...m, amount: toMoney(m.amount) }));
}

/** Últimos 30 caixas fechados, com nome de quem abriu/fechou quando der para ler. */
export function useCashHistory(storeId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: cashKeys.history(storeId),
    enabled: !!storeId && enabled,
    queryFn: async (): Promise<ClosedCashSession[]> => {
      const { data, error } = await db
        .from('cash_sessions')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      const sessions: ClosedCashSession[] = (data || []).map(normalizeSession);
      const ids = Array.from(new Set(sessions.flatMap((s) => [s.opened_by, s.closed_by]).filter(Boolean))) as string[];
      if (ids.length === 0) return sessions;
      const names = new Map<string, string>();
      try {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
        for (const p of profiles || []) names.set(p.id, p.full_name || p.email);
      } catch {
        // sem permissão para ler nomes: mostra só as datas
      }
      return sessions.map((s) => ({
        ...s,
        opened_by_name: s.opened_by ? names.get(s.opened_by) ?? null : null,
        closed_by_name: s.closed_by ? names.get(s.closed_by) ?? null : null,
      }));
    },
  });
}
