// Notas fiscais no painel: status para a tela, prazo de cancelamento, CPF/CNPJ na nota e
// destinatário da NF-e. Regras puras (testadas); as de documento vêm do núcleo do servidor.
import {
  CANCEL_WINDOW_MINUTES, recipientErrors, type FiscalDocType, type FiscalStatus, type NfeRecipient,
} from '../../../supabase/functions/_shared/focus-nfe.ts';
import { classifyDocument, formatCpfCnpj, onlyDigits } from '../../../supabase/functions/_shared/fiscal-doc.ts';

export { classifyDocument, formatCpfCnpj, onlyDigits, recipientErrors };
export type { FiscalDocType, FiscalStatus, NfeRecipient };

export interface FiscalDocument {
  id: string;
  store_id: string;
  doc_type: FiscalDocType;
  environment: 'homologacao' | 'producao';
  comanda_id: string | null;
  order_id: string | null;
  ref: string;
  attempt: number;
  status: FiscalStatus;
  status_sefaz: string | null;
  mensagem_sefaz: string | null;
  numero: string | null;
  serie: string | null;
  chave: string | null;
  protocolo: string | null;
  danfe_url: string | null;
  xml_url: string | null;
  contingencia: boolean;
  error_message: string | null;
  total: number | null;
  recipient_document: string | null;
  recipient_name: string | null;
  cancel_justificativa: string | null;
  created_at: string;
  updated_at: string;
  authorized_at: string | null;
  cancelled_at: string | null;
}

export const DOC_TYPE_LABEL: Record<FiscalDocType, string> = { nfce: 'Cupom fiscal (NFC-e)', nfe: 'NF-e' };

export const STATUS_INFO: Record<FiscalStatus, { label: string; tone: 'muted' | 'success' | 'danger' | 'warning' }> = {
  processando: { label: 'Processando', tone: 'warning' },
  autorizado: { label: 'Autorizada', tone: 'success' },
  erro: { label: 'Rejeitada', tone: 'danger' },
  cancelado: { label: 'Cancelada', tone: 'muted' },
  denegado: { label: 'Denegada', tone: 'danger' },
};

/** Nota "viva" mais recente de um tipo (a que vale para a venda). */
export function currentDocument(docs: FiscalDocument[], type: FiscalDocType): FiscalDocument | null {
  const ofType = docs.filter((d) => d.doc_type === type).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return ofType.find((d) => d.status !== 'cancelado' && d.status !== 'denegado') ?? ofType[0] ?? null;
}

/** Pode emitir (de novo)? Sem nota, rejeitada ou cancelada/denegada. */
export const canEmit = (doc: FiscalDocument | null) =>
  !doc || doc.status === 'erro' || doc.status === 'cancelado' || doc.status === 'denegado';

/** Minutos restantes para cancelar (null = fora do prazo ou não autorizada). */
export function cancelMinutesLeft(doc: FiscalDocument, now: Date): number | null {
  if (doc.status !== 'autorizado') return null;
  const from = Date.parse(doc.authorized_at || doc.created_at);
  if (!Number.isFinite(from)) return null;
  const left = Math.floor((from + CANCEL_WINDOW_MINUTES[doc.doc_type] * 60_000 - now.getTime()) / 60_000);
  return left > 0 ? left : null;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** CPF/CNPJ digitado no PDV: que nota cabe. */
export function nfceDocumentHint(value: string): { kind: 'empty' | 'cpf' | 'cnpj' | 'invalid'; message: string } {
  const kind = classifyDocument(value);
  if (kind === 'empty') return { kind, message: 'Sem CPF: cupom para consumidor não identificado.' };
  if (kind === 'cpf') return { kind, message: `CPF ${formatCpfCnpj(value)} na nota.` };
  if (kind === 'cnpj') return { kind, message: 'Para CNPJ é preciso NF-e (cupom fiscal não aceita CNPJ desde 05/01/2026).' };
  const len = onlyDigits(value).length;
  return { kind, message: len < 11 || (len > 11 && len < 14) ? 'Continue digitando…' : 'CPF/CNPJ inválido.' };
}

export interface RecipientForm {
  document: string;
  name: string;
  ie_indicator: '1' | '2' | '9';
  inscricao_estadual: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  email: string;
}

export const emptyRecipient = (o: Partial<RecipientForm> = {}): RecipientForm => ({
  document: '', name: '', ie_indicator: '9', inscricao_estadual: '', logradouro: '', numero: '', complemento: '',
  bairro: '', municipio: '', uf: '', cep: '', email: '', ...o,
});

export function recipientPayload(f: RecipientForm): NfeRecipient {
  const isCnpj = classifyDocument(f.document) === 'cnpj';
  return {
    document: onlyDigits(f.document),
    name: f.name.trim(),
    ie_indicator: isCnpj ? f.ie_indicator : '9',
    inscricao_estadual: isCnpj && f.ie_indicator === '1' ? onlyDigits(f.inscricao_estadual) : null,
    logradouro: f.logradouro.trim(),
    numero: f.numero.trim() || 'S/N',
    complemento: f.complemento.trim() || null,
    bairro: f.bairro.trim(),
    municipio: f.municipio.trim(),
    uf: f.uf.trim().toUpperCase(),
    cep: onlyDigits(f.cep) || null,
    email: f.email.trim() || null,
  };
}
