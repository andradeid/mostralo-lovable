// Chamadas às funções fiscal-* (login do usuário). Recusas 4xx/503 voltam com a mensagem do servidor.
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { FiscalDocument, NfeRecipient } from './documents';

export interface FiscalApiResult {
  document: FiscalDocument | null;
  message: string | null;
  errors: string[];
  code: string | null;
  warning?: string | null;
}

async function call(name: string, body: Record<string, unknown>): Promise<FiscalApiResult> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error && data) {
    return { document: data.document ?? null, message: null, errors: [], code: null, warning: data.warning ?? null };
  }
  let message: string | null = null;
  let code: string | null = null;
  let errors: string[] = [];
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json();
      message = payload?.error ? String(payload.error) : null;
      code = payload?.code ?? null;
      errors = Array.isArray(payload?.errors) ? payload.errors.map(String) : [];
    } catch {
      // corpo não é JSON
    }
  }
  console.error(`[${name}]`, code, error);
  return { document: null, message: message ?? 'Não foi possível falar com o serviço de nota fiscal. Tente de novo.', errors, code };
}

export interface EmitBody {
  store_id: string;
  tipo: 'nfce' | 'nfe';
  comanda_id?: string;
  order_id?: string;
  cpf_cnpj?: string | null;
  nome?: string | null;
  destinatario?: NfeRecipient | null;
}

export const emitFiscal = (body: EmitBody) => call('fiscal-emit', { ...body });
export const refreshFiscal = (documentId: string) => call('fiscal-status', { document_id: documentId });
export const cancelFiscal = (documentId: string, justificativa: string) =>
  call('fiscal-cancel', { document_id: documentId, justificativa });
