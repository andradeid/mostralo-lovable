import { createContext, useContext } from 'react';
import { useParams } from 'react-router-dom';

/** Slug da loja resolvido pelo domínio personalizado (null fora dele). */
export const StoreSlugContext = createContext<string | null>(null);

/** Slug da URL (:slug ou :storeSlug) ou, se ausente, o do domínio personalizado. */
export function useStoreSlug(): string | undefined {
  const params = useParams<{ slug?: string; storeSlug?: string }>();
  const domainSlug = useContext(StoreSlugContext);
  return params.slug ?? params.storeSlug ?? domainSlug ?? undefined;
}
