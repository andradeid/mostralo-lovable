import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Film, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MediaCard } from "@/components/sales-media/MediaCard";
import { MediaFilters } from "@/components/sales-media/MediaFilters";
import { MediaPreviewModal } from "@/components/sales-media/MediaPreviewModal";
import { MediaUploadDialog } from "@/components/sales-media/MediaUploadDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  sort_order: number;
  created_at: string;
}

export default function SalesMediaManagementPage() {
  const [media, setMedia] = useState<SalesMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editMedia, setEditMedia] = useState<SalesMedia | null>(null);
  const [previewMedia, setPreviewMedia] = useState<SalesMedia | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_media')
        .select('*')
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

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sales_media')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      setMedia(prev => prev.map(m => m.id === id ? { ...m, is_active: isActive } : m));
      toast.success(isActive ? "Mídia ativada" : "Mídia desativada");
    } catch (error: any) {
      console.error('Error toggling media:', error);
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from('sales_media')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      setMedia(prev => prev.filter(m => m.id !== deleteId));
      toast.success("Mídia excluída");
    } catch (error: any) {
      console.error('Error deleting media:', error);
      toast.error("Erro ao excluir mídia");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (mediaItem: SalesMedia) => {
    setEditMedia(mediaItem);
    setUploadDialogOpen(true);
  };

  const filteredMedia = media.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesNiche = selectedNiche === 'all' || m.niche === selectedNiche;
    const matchesActive = activeFilter === 'all' || 
                          (activeFilter === 'active' && m.is_active) ||
                          (activeFilter === 'inactive' && !m.is_active);
    
    return matchesSearch && matchesCategory && matchesNiche && matchesActive;
  });

  // Stats
  const stats = {
    total: media.length,
    active: media.filter(m => m.is_active).length,
    videos: media.filter(m => m.category === 'video').length,
    images: media.filter(m => m.category === 'imagem').length,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Film className="h-6 w-6" />
            Biblioteca de Mídias
          </h1>
          <p className="text-muted-foreground">
            Gerencie mídias de divulgação para vendedores
          </p>
        </div>
        <Button onClick={() => { setEditMedia(null); setUploadDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Mídia
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">{stats.videos}</p>
            <p className="text-xs text-muted-foreground">Vídeos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.images}</p>
            <p className="text-xs text-muted-foreground">Imagens</p>
          </CardContent>
        </Card>
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
            showActiveFilter
            activeFilter={activeFilter}
            onActiveFilterChange={setActiveFilter}
          />
        </CardContent>
      </Card>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma mídia encontrada</p>
            <p className="text-muted-foreground mb-4">
              {media.length === 0 
                ? 'Comece adicionando sua primeira mídia de divulgação'
                : 'Tente ajustar os filtros'}
            </p>
            {media.length === 0 && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Mídia
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((m) => (
            <MediaCard
              key={m.id}
              media={{
                ...m,
                description: m.description || undefined,
                file_size: m.file_size || undefined,
                file_type: m.file_type || undefined,
                thumbnail_url: m.thumbnail_url || undefined,
              }}
              isAdmin
              onEdit={() => handleEdit(m)}
              onDelete={(id) => setDeleteId(id)}
              onToggleActive={handleToggleActive}
              onPreview={(media) => setPreviewMedia(media)}
            />
          ))}
        </div>
      )}

      {/* Upload/Edit Dialog */}
      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) setEditMedia(null);
        }}
        onSuccess={fetchMedia}
        editMedia={editMedia ? {
          ...editMedia,
          description: editMedia.description || undefined,
          thumbnail_url: editMedia.thumbnail_url || undefined,
        } : null}
      />

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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Mídia</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
