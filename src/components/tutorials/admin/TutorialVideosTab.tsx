import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Star, StarOff, Eye, EyeOff, Copy, Search, X, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useTutorialCategories } from "@/hooks/useTutorialCategories";
import { useTutorials, useCreateTutorial, useUpdateTutorial, useDeleteTutorial, useDuplicateTutorial, useReorderTutorials, Tutorial, TutorialInput } from "@/hooks/useTutorials";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock } from "lucide-react";
import { getYouTubeThumbnail, isValidYouTubeUrl, formatDuration } from "@/lib/youtube-utils";

export function TutorialVideosTab() {
  const { data: categories } = useTutorialCategories(true);
  const { data: tutorials, isLoading } = useTutorials(undefined, true);
  const createTutorial = useCreateTutorial();
  const updateTutorial = useUpdateTutorial();
  const deleteTutorial = useDeleteTutorial();
  const duplicateTutorial = useDuplicateTutorial();
  const reorderTutorials = useReorderTutorials();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tutorialToDelete, setTutorialToDelete] = useState<Tutorial | null>(null);

  // Filtros avançados
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not-featured">("all");

  const [formData, setFormData] = useState<TutorialInput>({
    category_id: "",
    title: "",
    description: "",
    youtube_url: "",
    thumbnail_url: "",
    duration_minutes: 0,
    is_featured: false,
    is_active: true
  });

  // Lógica de filtro avançada
  const filteredTutorials = useMemo(() => {
    return tutorials?.filter(t => {
      // Filtro por categoria
      if (selectedCategory !== "all" && t.category_id !== selectedCategory) return false;
      
      // Busca por título
      if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      // Filtro por status
      if (statusFilter === "active" && !t.is_active) return false;
      if (statusFilter === "hidden" && t.is_active) return false;
      
      // Filtro por destaque
      if (featuredFilter === "featured" && !t.is_featured) return false;
      if (featuredFilter === "not-featured" && t.is_featured) return false;
      
      return true;
    }) || [];
  }, [tutorials, selectedCategory, searchTerm, statusFilter, featuredFilter]);

  const hasActiveFilters = searchTerm || statusFilter !== "all" || featuredFilter !== "all";
  const canReorder = !hasActiveFilters;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFeaturedFilter("all");
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !filteredTutorials) return;
    
    const items = Array.from(filteredTutorials);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const orderedIds = items.map(item => item.id);
    reorderTutorials.mutate(orderedIds);
  };

  const handleOpenModal = (tutorial?: Tutorial) => {
    if (tutorial) {
      setEditingTutorial(tutorial);
      setFormData({
        category_id: tutorial.category_id || "",
        title: tutorial.title,
        description: tutorial.description || "",
        youtube_url: tutorial.youtube_url,
        thumbnail_url: tutorial.thumbnail_url || "",
        duration_minutes: tutorial.duration_minutes,
        is_featured: tutorial.is_featured,
        is_active: tutorial.is_active
      });
    } else {
      setEditingTutorial(null);
      setFormData({
        category_id: selectedCategory !== "all" ? selectedCategory : "",
        title: "",
        description: "",
        youtube_url: "",
        thumbnail_url: "",
        duration_minutes: 0,
        is_featured: false,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.youtube_url.trim() || !formData.category_id) return;

    if (editingTutorial) {
      await updateTutorial.mutateAsync({ id: editingTutorial.id, ...formData });
    } else {
      await createTutorial.mutateAsync({
        ...formData,
        display_order: (filteredTutorials?.length || 0) + 1
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!tutorialToDelete) return;
    await deleteTutorial.mutateAsync(tutorialToDelete.id);
    setDeleteDialogOpen(false);
    setTutorialToDelete(null);
  };

  const toggleFeatured = async (tutorial: Tutorial) => {
    await updateTutorial.mutateAsync({
      id: tutorial.id,
      is_featured: !tutorial.is_featured
    });
  };

  const toggleActive = async (tutorial: Tutorial) => {
    await updateTutorial.mutateAsync({
      id: tutorial.id,
      is_active: !tutorial.is_active
    });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sem categoria";
    return categories?.find(c => c.id === categoryId)?.name || "Desconhecida";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtro por categoria e botão */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Categoria:</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories?.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Tutorial
        </Button>
      </div>

      {/* Busca e filtros avançados */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="hidden">Ocultos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={featuredFilter} onValueChange={(v) => setFeaturedFilter(v as typeof featuredFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Destaque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="featured">Em destaque</SelectItem>
            <SelectItem value="not-featured">Sem destaque</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Contador e info de reordenação */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTutorials.length} de {tutorials?.length || 0} tutoriais
        </p>
        {canReorder && (
          <p className="text-xs text-muted-foreground">
            <GripVertical className="w-3 h-3 inline mr-1" />
            Arraste para reordenar
          </p>
        )}
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground">
            Limpe os filtros para reordenar
          </p>
        )}
      </div>

      {/* Lista de tutoriais com drag-and-drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tutorials" isDropDisabled={!canReorder}>
          {(provided) => (
            <div 
              className="grid gap-4"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {filteredTutorials.map((tutorial, index) => {
                const thumbnailUrl = tutorial.thumbnail_url || getYouTubeThumbnail(tutorial.youtube_url, 'medium');

                return (
                  <Draggable 
                    key={tutorial.id} 
                    draggableId={tutorial.id} 
                    index={index}
                    isDragDisabled={!canReorder}
                  >
                    {(provided, snapshot) => (
                      <Card 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`overflow-hidden transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
                      >
                        <div className="flex flex-col sm:flex-row">
                          {/* Handle de arraste */}
                          {canReorder && (
                            <div 
                              {...provided.dragHandleProps}
                              className="hidden sm:flex items-center justify-center w-8 bg-muted/50 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}

                          {/* Thumbnail */}
                          <div className="w-full sm:w-48 h-32 flex-shrink-0 bg-muted relative">
                            <img 
                              src={thumbnailUrl} 
                              alt={tutorial.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs text-white flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(tutorial.duration_minutes)}
                            </div>
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">{tutorial.title}</h3>
                                {tutorial.is_featured && (
                                  <Badge variant="default" className="text-xs bg-yellow-500">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Destaque
                                  </Badge>
                                )}
                                {!tutorial.is_active && (
                                  <Badge variant="secondary" className="text-xs">
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Oculto
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {getCategoryName(tutorial.category_id)}
                              </p>
                              {tutorial.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {tutorial.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFeatured(tutorial)}
                                title={tutorial.is_featured ? "Remover destaque" : "Destacar"}
                              >
                                {tutorial.is_featured ? (
                                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                ) : (
                                  <StarOff className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleActive(tutorial)}
                                title={tutorial.is_active ? "Ocultar" : "Mostrar"}
                              >
                                {tutorial.is_active ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => duplicateTutorial.mutate(tutorial)}
                                disabled={duplicateTutorial.isPending}
                                title="Duplicar tutorial"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenModal(tutorial)}
                                title="Editar tutorial"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setTutorialToDelete(tutorial);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}

              {filteredTutorials.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {hasActiveFilters ? "Nenhum tutorial encontrado com os filtros aplicados" : "Nenhum tutorial encontrado"}
                  </p>
                  {hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Limpar filtros
                    </Button>
                  ) : (
                    <Button onClick={() => handleOpenModal()} className="mt-4">
                      Adicionar primeiro tutorial
                    </Button>
                  )}
                </Card>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Modal de criação/edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTutorial ? "Editar Tutorial" : "Novo Tutorial"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="category_id">Categoria *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.filter(c => c.is_active).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Como configurar sua loja"
              />
            </div>

            <div>
              <Label htmlFor="youtube_url">URL do YouTube *</Label>
              <Input
                id="youtube_url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {formData.youtube_url && !isValidYouTubeUrl(formData.youtube_url) && (
                <p className="text-xs text-destructive mt-1">URL inválida do YouTube</p>
              )}
              {formData.youtube_url && isValidYouTubeUrl(formData.youtube_url) && (
                <div className="mt-2">
                  <img 
                    src={getYouTubeThumbnail(formData.youtube_url, 'medium')}
                    alt="Preview"
                    className="w-32 h-20 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do conteúdo"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="duration_minutes">Duração (minutos)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min={0}
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="thumbnail_url">URL da Thumbnail (opcional)</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url || ""}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="Deixe vazio para usar thumbnail do YouTube"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Destaque</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={
                !formData.title.trim() || 
                !formData.youtube_url.trim() || 
                !formData.category_id ||
                !isValidYouTubeUrl(formData.youtube_url) ||
                createTutorial.isPending || 
                updateTutorial.isPending
              }
            >
              {(createTutorial.isPending || updateTutorial.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingTutorial ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tutorial?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{tutorialToDelete?.title}"? 
              Esta ação não pode ser desfeita e todas as visualizações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}