import type { ContentItem } from "@/lib/conteudos";
import { PostCard, PostRow } from "./PostCard";

/** Grade de posts: 3 colunas no computador, 2 no tablet e lista compacta (foto pequena) no celular. */
export function PostGrid({ items }: { items: ContentItem[] }) {
  if (!items.length) return null;
  return (
    <>
      <div className="flex flex-col gap-5 sm:hidden">{items.map((it) => <PostRow key={it.path} item={it} />)}</div>
      <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">{items.map((it) => <PostCard key={it.path} item={it} />)}</div>
    </>
  );
}
