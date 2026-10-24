// Exibição da mídia do chat de WhatsApp com URL assinada.
// O banco guarda a URL "pública" do bucket whatsapp-chat-media só como identificador;
// para mostrar, geramos uma URL assinada (funciona com o bucket público ou privado).
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CHAT_MEDIA_BUCKET, chatMediaPathFromUrl } from '../../supabase/functions/_shared/chat-media';

export { chatMediaPathFromUrl };

const TTL_SECONDS = 60 * 60;
const REUSE_MS = 50 * 60 * 1000; // renova antes de expirar

const cache = new Map<string, { url: string; expiresAt: number }>();
const inflight = new Map<string, Promise<string | null>>();

/** URL pronta para <img>/<audio>/<video>/link. URLs de fora do bucket voltam como estão. */
export async function getChatMediaDisplayUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const path = chatMediaPathFromUrl(url);
  if (!path) return url;

  const hit = cache.get(path);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  const pending = inflight.get(path);
  if (pending) return pending;

  const request = (async () => {
    try {
      const { data, error } = await supabase.storage.from(CHAT_MEDIA_BUCKET).createSignedUrl(path, TTL_SECONDS);
      if (error || !data?.signedUrl) return null;
      cache.set(path, { url: data.signedUrl, expiresAt: Date.now() + REUSE_MS });
      return data.signedUrl;
    } catch {
      return null;
    } finally {
      inflight.delete(path);
    }
  })();
  inflight.set(path, request);
  return request;
}

/** Hook: devolve a URL de exibição (null enquanto carrega ou se o arquivo não existe). */
export function useChatMediaUrl(url: string | null | undefined): { url: string | null; loading: boolean } {
  const needsSigning = !!chatMediaPathFromUrl(url);
  const [resolved, setResolved] = useState<string | null>(needsSigning ? null : (url ?? null));
  const [loading, setLoading] = useState(needsSigning);

  useEffect(() => {
    let alive = true;
    if (!needsSigning) {
      setResolved(url ?? null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getChatMediaDisplayUrl(url).then((signed) => {
      if (!alive) return;
      setResolved(signed);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [url, needsSigning]);

  return { url: resolved, loading };
}

/** Mídia do WhatsApp master: busca o link temporário na UaZapi (o arquivo não fica salvo). */
export async function fetchMasterMediaOnDemand(messageId: string): Promise<{ url: string | null; expired: boolean }> {
  const { data, error } = await supabase.functions.invoke('master-whatsapp-media', { body: { messageId } });
  if (error || !data?.url) return { url: null, expired: true };
  return { url: data.url as string, expired: false };
}
