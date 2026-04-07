import { supabase } from "@/integrations/supabase/client";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ResolveStoreSlugOptions {
  storeId?: string | null;
  candidates?: Array<string | null | undefined>;
  persistKey?: string;
}

const normalizeStoreSlug = (value?: string | null): string | null => {
  const normalizedValue = value?.trim();

  if (!normalizedValue || UUID_PATTERN.test(normalizedValue)) {
    return null;
  }

  return normalizedValue;
};

export async function resolveStoreSlug({
  storeId,
  candidates = [],
  persistKey = "checkoutStoreSlug",
}: ResolveStoreSlugOptions): Promise<string | null> {
  for (const candidate of candidates) {
    const resolvedCandidate = normalizeStoreSlug(candidate);

    if (resolvedCandidate) {
      return resolvedCandidate;
    }
  }

  const storedSlug =
    typeof window !== "undefined" ? window.sessionStorage.getItem(persistKey) : null;
  const resolvedStoredSlug = normalizeStoreSlug(storedSlug);

  if (resolvedStoredSlug) {
    return resolvedStoredSlug;
  }

  if (!storeId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("stores")
      .select("slug")
      .eq("id", storeId)
      .maybeSingle();

    if (error) {
      console.error("[storeRedirects] Erro ao buscar slug da loja:", error);
      return null;
    }

    const resolvedDatabaseSlug = normalizeStoreSlug(data?.slug);

    if (resolvedDatabaseSlug && typeof window !== "undefined") {
      window.sessionStorage.setItem(persistKey, resolvedDatabaseSlug);
    }

    return resolvedDatabaseSlug;
  } catch (error) {
    console.error("[storeRedirects] Erro inesperado ao resolver slug da loja:", error);
    return null;
  }
}

export async function buildStoreOrdersUrl(
  options: ResolveStoreSlugOptions,
): Promise<string | null> {
  const storeSlug = await resolveStoreSlug(options);

  return storeSlug ? `/loja/${storeSlug}/meus-pedidos` : null;
}