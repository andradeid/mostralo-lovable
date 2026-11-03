/**
 * Recuperação de "pedaço do app que não carregou" (versão antiga aberta depois de um deploy).
 * Recarrega a página UMA vez para buscar o index.html novo; se falhar de novo em pouco tempo,
 * não recarrega (evita laço) e deixa a tela de erro aparecer.
 */

const KEY = "mostralo:chunk-reload-at";
export const RELOAD_WINDOW_MS = 30_000;

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading (CSS )?chunk [\w-]+ failed|is not a valid JavaScript MIME type/i;

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { message?: unknown; name?: unknown };
  const text = typeof error === "string" ? error : `${String(e.name ?? "")} ${String(e.message ?? "")}`;
  return CHUNK_ERROR.test(text);
}

/** Pode recarregar agora? (não recarregou nos últimos 30 s) */
export function canReload(lastAt: number | null, now: number): boolean {
  return lastAt == null || !Number.isFinite(lastAt) || now - lastAt > RELOAD_WINDOW_MS;
}

function readLast(): number | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

/** Recarrega uma vez; devolve true se a página vai recarregar. */
export function reloadOnceForChunkError(): boolean {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  if (!canReload(readLast(), now)) return false;
  try {
    sessionStorage.setItem(KEY, String(now));
  } catch {
    // sem sessionStorage não dá para garantir "uma vez só": não recarrega
    return false;
  }
  window.location.reload();
  return true;
}
