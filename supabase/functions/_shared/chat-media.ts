// Mídia do chat de WhatsApp (bucket "whatsapp-chat-media").
// O banco guarda a URL no formato público (/object/public/...) só como identificador do arquivo;
// quem precisa baixar (UaZapi, Whisper, navegador) recebe uma URL assinada temporária,
// para o bucket poder ficar privado sem quebrar nada.

export const CHAT_MEDIA_BUCKET = 'whatsapp-chat-media';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const PATH_RE = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/whatsapp-chat-media\/([^?#]+)/;

/** Caminho do arquivo dentro do bucket, ou null se a URL não for deste bucket. */
export function chatMediaPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = String(url).match(PATH_RE);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** URL "canônica" gravada no banco (mesmo formato de getPublicUrl). */
export function canonicalChatMediaUrl(supabaseUrl: string, path: string): string {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${CHAT_MEDIA_BUCKET}/${encoded}`;
}

/** O arquivo pertence à pasta permitida? (loja = "<store_id>/", master = "master/") */
export function chatMediaPathAllowed(path: string, folder: string): boolean {
  return path.startsWith(`${folder}/`) && !path.includes('..');
}

/**
 * URL que um serviço externo consegue baixar. Para arquivos do bucket, gera URL assinada
 * (service role); para outras URLs, devolve a própria. Se a pasta não bater, devolve null.
 */
// deno-lint-ignore no-explicit-any
export async function fetchableChatMediaUrl(supabase: any, url: string | null | undefined, folder?: string): Promise<string | null> {
  if (!url) return null;
  const path = chatMediaPathFromUrl(url);
  if (!path) return url;
  if (folder && !chatMediaPathAllowed(path, folder)) return null;
  const { data, error } = await supabase.storage.from(CHAT_MEDIA_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Caminhos de arquivos do bucket a partir de uma lista de URLs (sem repetição). */
export function chatMediaPathsFromUrls(urls: Array<string | null | undefined>): string[] {
  const paths = new Set<string>();
  for (const url of urls) {
    const path = chatMediaPathFromUrl(url);
    if (path) paths.add(path);
  }
  return [...paths];
}

/** Remove arquivos do bucket em lotes. Devolve quantos foram removidos. */
// deno-lint-ignore no-explicit-any
export async function removeChatMediaFiles(supabase: any, paths: string[], batchSize = 100): Promise<number> {
  let removed = 0;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { data, error } = await supabase.storage.from(CHAT_MEDIA_BUCKET).remove(batch);
    if (error) throw new Error(`Falha ao remover arquivos de mídia: ${error.message}`);
    removed += (data || []).length;
  }
  return removed;
}
