// Configuração fiscal da loja (store_fiscal_settings) e situação dos segredos (só "configurado ✓":
// o navegador nunca lê token nem CSC). useFiscalFlags é a versão leve para PDV, pedido e produto.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { rowFromForm, type FiscalSecretsStatus, type FiscalSettingsForm } from '@/lib/fiscal/settingsForm';

// Tabelas novas ainda fora dos tipos gerados do Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const fiscalSettingsKey = (storeId: string | null | undefined) => ['fiscal-settings', storeId] as const;
const secretsKey = (storeId: string | null | undefined) => ['fiscal-secrets', storeId] as const;

async function fetchSettings(storeId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await db.from('store_fiscal_settings').select('*').eq('store_id', storeId).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** NFC-e/NF-e ligadas? Falha (ex.: tabela ainda não criada) = desligado, sem quebrar a tela. */
export function useFiscalFlags(storeId: string | null | undefined) {
  const q = useQuery({
    queryKey: fiscalSettingsKey(storeId),
    queryFn: () => fetchSettings(storeId!),
    enabled: !!storeId,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const row = q.data ?? null;
  return {
    loading: q.isLoading,
    nfce: !!row?.nfce_enabled,
    nfe: !!row?.nfe_enabled,
    environment: (row?.environment === 'producao' ? 'producao' : 'homologacao') as 'homologacao' | 'producao',
  };
}

export interface SecretsInput {
  focus_token_homologacao?: string;
  focus_token_producao?: string;
  csc_id_homologacao?: string;
  csc_homologacao?: string;
  csc_id_producao?: string;
  csc_producao?: string;
}

export function useFiscalSettings(storeId: string | null | undefined) {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: fiscalSettingsKey(storeId),
    queryFn: () => fetchSettings(storeId!),
    enabled: !!storeId,
    retry: false,
  });
  const secrets = useQuery({
    queryKey: secretsKey(storeId),
    queryFn: async (): Promise<FiscalSecretsStatus | null> => {
      const { data, error } = await db.rpc('fiscal_secrets_status', { p_store_id: storeId });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!storeId,
    retry: false,
  });

  const save = useMutation({
    mutationFn: async (form: FiscalSettingsForm) => {
      const { data, error } = await db.from('store_fiscal_settings')
        .upsert(rowFromForm(form, storeId!), { onConflict: 'store_id' }).select('*').single();
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: (row) => qc.setQueryData(fiscalSettingsKey(storeId), row),
  });

  const saveSecrets = useMutation({
    mutationFn: async (input: SecretsInput & { clear?: boolean }) => {
      const { data, error } = await db.rpc('fiscal_save_secrets', {
        p_store_id: storeId,
        p_focus_token_homologacao: input.focus_token_homologacao || null,
        p_focus_token_producao: input.focus_token_producao || null,
        p_csc_id_homologacao: input.csc_id_homologacao || null,
        p_csc_homologacao: input.csc_homologacao || null,
        p_csc_id_producao: input.csc_id_producao || null,
        p_csc_producao: input.csc_producao || null,
        p_clear: !!input.clear,
      });
      if (error) throw error;
      return data as FiscalSecretsStatus;
    },
    onSuccess: (status) => qc.setQueryData(secretsKey(storeId), status),
  });

  return {
    row: settings.data ?? null,
    loading: settings.isLoading || secrets.isLoading,
    loadError: settings.error as Error | null,
    secrets: secrets.data ?? null,
    save,
    saveSecrets,
  };
}
