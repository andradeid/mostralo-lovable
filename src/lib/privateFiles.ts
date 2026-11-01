// Comprovantes em bucket privado: o banco guarda o CAMINHO do arquivo e, para exibir,
// geramos um link assinado na hora. Registros antigos guardam a URL pública completa
// (ou um link assinado); as funções abaixo aceitam os três formatos.
import { supabase } from '@/integrations/supabase/client';

// Mesmo valor de src/lib/supabaseUrl.ts, sem quebrar fora do Vite (testes em node).
const SUPABASE_URL: string =
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SUPABASE_URL ||
  'https://noshwvwpjtnvndokbfjx.supabase.co';

export const RECEIPT_BUCKETS = {
  subscription: 'subscription-receipts',
  payment: 'payment-receipts',
  dental: 'dental-payment-receipts',
  paymentProofs: 'payment-proofs',
  salespersonProofs: 'salesperson-payment-proofs',
  salespersonInvoices: 'salesperson-invoices',
} as const;

export interface StorageRef {
  bucket: string;
  path: string;
}

const STORAGE_URL_RE = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?#]+)\/([^?#]+)/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Descobre bucket e caminho do que está gravado no banco.
 * - URL do Storage (pública, assinada ou autenticada): bucket e caminho vêm da URL.
 * - Caminho puro ("loja/arquivo.jpg"): usa o bucket padrão.
 * - Texto livre (ex.: "PIX confirmado via webhook...") ou URL de fora do Storage: null.
 */
export function storageRefFrom(value: string | null | undefined, defaultBucket: string): StorageRef | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    const match = raw.match(STORAGE_URL_RE);
    if (!match) return null;
    return { bucket: safeDecode(match[1]), path: safeDecode(match[2]) };
  }

  // Caminho puro: sem espaços, sem esquema, sem "..".
  if (/\s/.test(raw) || raw.includes('://') || raw.split('/').includes('..')) return null;
  let path = raw.replace(/^\/+/, '');
  // Aceita também "<bucket>/<caminho>" do próprio bucket padrão.
  if (path.startsWith(`${defaultBucket}/`)) path = path.slice(defaultBucket.length + 1);
  if (!path) return null;
  return { bucket: defaultBucket, path: safeDecode(path.split(/[?#]/)[0]) };
}

/**
 * Caminho do arquivo dentro do bucket informado. Devolve null se o valor não é um arquivo
 * desse bucket (texto livre, URL externa ou URL de outro bucket).
 */
export function storagePathFrom(value: string | null | undefined, bucket: string): string | null {
  const ref = storageRefFrom(value, bucket);
  if (!ref || ref.bucket !== bucket) return null;
  return ref.path;
}

/**
 * Referência que identifica o bucket junto com o caminho — usada quando o valor é copiado
 * para uma tabela cujo bucket padrão é outro. Não é um link público: exige login para abrir.
 */
export function storageRefUrl(ref: StorageRef, baseUrl: string = SUPABASE_URL): string {
  const path = ref.path.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/storage/v1/object/authenticated/${encodeURIComponent(ref.bucket)}/${path}`;
}

/**
 * Deixa o valor autoexplicativo (bucket + caminho) quando ele vai para um lugar cujo bucket
 * padrão é outro. Texto livre e links externos voltam como estão.
 */
export function withBucket(value: string | null | undefined, bucket: string): string | null {
  if (!value) return null;
  const ref = storageRefFrom(value, bucket);
  return ref ? storageRefUrl(ref) : value;
}

/** true quando o valor aponta para arquivo do Storage (e não é texto livre / link externo). */
export function isStorageFile(value: string | null | undefined, defaultBucket: string): boolean {
  return storageRefFrom(value, defaultBucket) !== null;
}

/** Pela extensão do caminho/URL (ignora ?token=...). */
export function isImageFile(value: string | null | undefined): boolean {
  if (!value) return false;
  const clean = value.split(/[?#]/)[0].toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/.test(clean);
}

export function isPdfFile(value: string | null | undefined): boolean {
  if (!value) return false;
  return /\.pdf$/i.test(value.split(/[?#]/)[0]);
}

/**
 * Link assinado para exibir o arquivo (null se não deu). URL externa que não é do Storage
 * volta como está; texto livre volta null.
 */
export async function signedFileUrl(
  value: string | null | undefined,
  bucket: string,
  seconds = 3600,
): Promise<string | null> {
  if (!value) return null;
  const ref = storageRefFrom(value, bucket);
  if (!ref) return /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
  try {
    const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, seconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
