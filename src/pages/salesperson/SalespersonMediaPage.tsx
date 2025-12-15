import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MediaCard } from "@/components/sales-media/MediaCard";
import { MediaFilters } from "@/components/sales-media/MediaFilters";
import { MediaPreviewModal } from "@/components/sales-media/MediaPreviewModal";

interface SalesMedia {
  id: string;
  title: string;
  description: string | null;
  category: string;
  niche: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
}

export default function SalespersonMediaPage() {
  const [media, setMedia] = useState<SalesMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [previewMedia, setPreviewMedia] = useState<SalesMedia | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const { data, error } = await supabase
          .from('sales_media')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMedia(data || []);
      } catch (error: any) {
        console.error('Error fetching media:', error);
        toast.error("Erro ao carregar mídias");
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  const filteredMedia = media.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesNiche = selectedNiche === 'all' || m.niche === selectedNiche;
    
    return matchesSearch && matchesCategory && matchesNiche;
  });

  // Group by category for display
  const groupedMedia = filteredMedia.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, SalesMedia[]>);

  const categoryLabels: Record<string, string> = {
    video: '🎬 Vídeos',
    audio: '🎵 Áudios',
    imagem: '🖼️ Imagens',
    pdf: '📄 PDFs',
    outro: '📁 Outros',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Film className="h-6 w-6" />
          Mídias de Divulgação
        </h1>
        <p className="text-muted-foreground">
          Materiais prontos para usar nas suas vendas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <MediaFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedNiche={selectedNiche}
            onNicheChange={setSelectedNiche}
          />
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma mídia disponível</p>
            <p className="text-muted-foreground">
              {media.length === 0 
                ? 'Ainda não há mídias disponíveis para você'
                : 'Tente ajustar os filtros de busca'}
            </p>
          </CardContent>
        </Card>
      ) : (
        // Display grouped by category
        <div className="space-y-8">
          {Object.entries(groupedMedia).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-lg font-semibold">
                {categoryLabels[category] || category}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({items.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {items.map((m) => (
                  <MediaCard
                    key={m.id}
                    media={{
                      ...m,
                      description: m.description || undefined,
                      file_size: m.file_size || undefined,
                      file_type: m.file_type || undefined,
                      thumbnail_url: m.thumbnail_url || undefined,
                    }}
                    onPreview={(media) => setPreviewMedia(media)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <MediaPreviewModal
        open={!!previewMedia}
        onOpenChange={(open) => !open && setPreviewMedia(null)}
        media={previewMedia ? {
          ...previewMedia,
          description: previewMedia.description || undefined,
          file_type: previewMedia.file_type || undefined,
        } : null}
      />
    </div>
  );
}
