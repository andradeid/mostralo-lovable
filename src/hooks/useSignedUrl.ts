// Link assinado para arquivo de bucket privado (comprovantes), gerado na hora de exibir.
import { useCallback, useEffect, useState } from 'react';
import { signedFileUrl, storageRefFrom } from '@/lib/privateFiles';

const TTL_SECONDS = 60 * 60;
const REUSE_MS = 50 * 60 * 1000; // renova antes de expirar

const cache = new Map<string, { url: string; expiresAt: number }>();

async function getSigned(value: string, bucket: string): Promise<string | null> {
  const ref = storageRefFrom(value, bucket);
  const key = ref ? `${ref.bucket}/${ref.path}` : value;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.url;
  const url = await signedFileUrl(value, bucket, TTL_SECONDS);
  if (url && ref) cache.set(key, { url, expiresAt: Date.now() + REUSE_MS });
  return url;
}

export interface SignedUrlState {
  /** URL pronta para <img>/<a>; null enquanto carrega, em erro ou se não é arquivo. */
  url: string | null;
  loading: boolean;
  error: boolean;
  /** false quando o valor gravado é texto livre (ex.: "PIX confirmado via webhook..."). */
  isFile: boolean;
  retry: () => void;
}

export function useSignedUrl(
  value: string | null | undefined,
  bucket: string,
  enabled = true,
): SignedUrlState {
  const trimmed = value?.trim() || '';
  const isStorage = !!storageRefFrom(trimmed, bucket);
  const isExternal = !isStorage && /^https?:\/\//i.test(trimmed);
  const isFile = isStorage || isExternal;

  const [url, setUrl] = useState<string | null>(isExternal ? trimmed : null);
  const [loading, setLoading] = useState(enabled && isStorage);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(false);
    if (!isStorage) {
      setUrl(isExternal ? trimmed : null);
      setLoading(false);
      return;
    }
    if (!enabled) {
      setLoading(false);
      return;
    }
    setUrl(null);
    setLoading(true);
    getSigned(trimmed, bucket).then((signed) => {
      if (!alive) return;
      setUrl(signed);
      setError(!signed);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [trimmed, bucket, enabled, isStorage, isExternal, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { url, loading, error, isFile, retry };
}

/** Para cliques: gera o link e abre em nova aba (abre a aba antes para não ser bloqueada). */
export async function openPrivateFile(value: string | null | undefined, bucket: string): Promise<boolean> {
  if (!value) return false;
  const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  const url = await getSigned(value.trim(), bucket);
  if (!url) {
    win?.close();
    return false;
  }
  if (win) {
    win.opener = null;
    win.location.href = url;
  }
  else window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/** Baixa o arquivo como blob (para o botão "Baixar"). */
export async function downloadPrivateFile(
  value: string | null | undefined,
  bucket: string,
  fileName: string,
): Promise<boolean> {
  if (!value) return false;
  const url = await getSigned(value.trim(), bucket);
  if (!url) return false;
  const response = await fetch(url);
  if (!response.ok) return false;
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(objectUrl);
  document.body.removeChild(a);
  return true;
}
