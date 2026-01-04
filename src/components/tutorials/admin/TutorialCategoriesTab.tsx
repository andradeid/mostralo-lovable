import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Copy } from "lucide-react";
import { useTutorialCategories, useCreateTutorialCategory, useUpdateTutorialCategory, useDeleteTutorialCategory, useDuplicateCategory, TutorialCategory, TutorialCategoryInput } from "@/hooks/useTutorialCategories";
import { useTutorials } from "@/hooks/useTutorials";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getYouTubeThumbnail, isValidYouTubeUrl } from "@/lib/youtube-utils";

export function TutorialCategoriesTab() {
  const { data: categories, isLoading } = useTutorialCategories(true);
  const { data: tutorials } = useTutorials(undefined, true);
  const createCategory = useCreateTutorialCategory();
  const updateCategory = useUpdateTutorialCategory();
  const deleteCategory = useDeleteTutorialCategory();
  const duplicateCategory = useDuplicateCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TutorialCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TutorialCategory | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [categoryToDuplicate, setCategoryToDuplicate] = useState<TutorialCategory | null>(null);

  const [formData, setFormData] = useState<TutorialCategoryInput>({
    name: "",
    description: "",
    cover_image_url: "",
    featured_video_url: "",
    is_active: true
  });

  const handleOpenModal = (category?: TutorialCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        cover_image_url: category.cover_image_url || "",
        featured_video_url: category.featured_video_url || "",
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        cover_image_url: "",
        featured_video_url: "",
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...formData });
    } else {
      await createCategory.mutateAsync({
        ...formData,
        display_order: (categories?.length || 0) + 1
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    await deleteCategory.mutateAsync(categoryToDelete.id);
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleDuplicate = async () => {
    if (!categoryToDuplicate) return;
    await duplicateCategory.mutateAsync(categoryToDuplicate);
    setDuplicateDialogOpen(false);
    setCategoryToDuplicate(null);
  };

  const getTutorialCount = (categoryId: string) => {
    return tutorials?.filter(t => t.category_id === categoryId).length || 0;
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
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {categories?.length || 0} categorias cadastradas
        </p>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-4">
        {categories?.map((category) => {
          const tutorialCount = getTutorialCount(category.id);
          const coverUrl = category.cover_image_url || 
            (category.featured_video_url ? getYouTubeThumbnail(category.featured_video_url, 'high') : null);

          return (
            <Card key={category.id} className="overflow-hidden">
              <div className="flex">
                {/* Thumbnail */}
                <div className="w-32 h-24 flex-shrink-0 bg-muted">
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <GripVertical className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      {!category.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Oculta
                        </Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {tutorialCount} {tutorialCount === 1 ? 'tutorial' : 'tutoriais'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCategoryToDuplicate(category);
                        setDuplicateDialogOpen(true);
                      }}
                      disabled={duplicateCategory.isPending}
                      title="Duplicar categoria com tutoriais"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenModal(category)}
                      title="Editar categoria"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={tutorialCount > 0}
                      title={tutorialCount > 0 ? "Remova os tutoriais primeiro" : "Excluir categoria"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {(!categories || categories.length === 0) && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
            <Button onClick={() => handleOpenModal()} className="mt-4">
              Criar primeira categoria
            </Button>
          </Card>
        )}
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Categoria *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Primeiros Passos"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição da categoria"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="featured_video_url">Vídeo de Destaque (YouTube URL)</Label>
              <Input
                id="featured_video_url"
                value={formData.featured_video_url || ""}
                onChange={(e) => setFormData({ ...formData, featured_video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {formData.featured_video_url && !isValidYouTubeUrl(formData.featured_video_url) && (
                <p className="text-xs text-destructive mt-1">URL inválida do YouTube</p>
              )}
            </div>

            <div>
              <Label htmlFor="cover_image_url">URL da Capa (opcional)</Label>
              <Input
                id="cover_image_url"
                value={formData.cover_image_url || ""}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                placeholder="https://... (deixe vazio para usar thumbnail do vídeo)"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Categoria ativa (visível para lojistas)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name.trim() || createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCategory ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de duplicação */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Será criada uma cópia da categoria "{categoryToDuplicate?.name}" 
              {categoryToDuplicate && getTutorialCount(categoryToDuplicate.id) > 0 && (
                <> com {getTutorialCount(categoryToDuplicate.id)} {getTutorialCount(categoryToDuplicate.id) === 1 ? 'tutorial' : 'tutoriais'}</>
              )}.
              <br /><br />
              A nova categoria e seus tutoriais serão criados como <strong>inativos</strong> para você editar antes de publicar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDuplicate}
              disabled={duplicateCategory.isPending}
            >
              {duplicateCategory.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Duplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"? 
              Esta ação não pode ser desfeita.
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