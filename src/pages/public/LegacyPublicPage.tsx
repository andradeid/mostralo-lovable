import { useParams } from "react-router-dom";
import { useLegacyPageBySlug } from "@/hooks/useLegacyPage";
import { LegacyPageRenderer } from "@/components/legacy-page/LegacyPageRenderer";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

/** Página pública renderizada em /p/:slug */
export default function LegacyPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useLegacyPageBySlug(slug);

  // Atualizar OG tags dinamicamente
  useEffect(() => {
    if (!page) return;
    document.title = page.og_title || page.store_name || 'Página';
    
    const setMeta = (property: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('og:title', page.og_title || page.store_name);
    setMeta('og:description', page.og_description || page.subtitle);
    setMeta('og:image', page.og_image || page.logo_url);
    setMeta('og:type', 'website');
  }, [page]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Página não encontrada</h1>
          <p className="text-gray-300">O link que você acessou não existe ou foi desativado.</p>
        </div>
      </div>
    );
  }

  return <LegacyPageRenderer page={page} />;
}
