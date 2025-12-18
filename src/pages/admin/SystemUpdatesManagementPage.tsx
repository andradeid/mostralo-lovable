import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Plus, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Megaphone, Rocket, Bug, Zap, Shield } from 'lucide-react';
import { UpdateFormModal } from '@/components/system-updates/UpdateFormModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  category: 'feature' | 'fix' | 'improvement' | 'security';
  importance: 'normal' | 'important' | 'critical';
  release_date: string;
  is_published: boolean;
  created_at: string;
  system_update_images?: UpdateImage[];
}

const categoryIcons = {
  feature: Rocket,
  fix: Bug,
  improvement: Zap,
  security: Shield
};

const categoryLabels = {
  feature: 'Funcionalidade',
  fix: 'Correção',
  improvement: 'Melhoria',
  security: 'Segurança'
};

export default function SystemUpdatesManagementPage() {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<SystemUpdate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<SystemUpdate | null>(null);

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('system_updates')
        .select(`
          *,
          system_update_images (*)
        `)
        .order('release_date', { ascending: false });

      if (error) throw error;
      setUpdates((data || []) as SystemUpdate[]);
    } catch (error) {
      console.error('Erro ao buscar atualizações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar atualizações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleEdit = (update: SystemUpdate) => {
    setSelectedUpdate(update);
    setFormOpen(true);
  };

  const handleNew = () => {
    setSelectedUpdate(null);
    setFormOpen(true);
  };

  const handleTogglePublish = async (update: SystemUpdate) => {
    try {
      const { error } = await supabase
        .from('system_updates')
        .update({ is_published: !update.is_published })
        .eq('id', update.id);

      if (error) throw error;

      toast({
        title: update.is_published ? 'Despublicado' : 'Publicado',
        description: `A atualização foi ${update.is_published ? 'despublicada' : 'publicada'} com sucesso.`
      });

      fetchUpdates();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!updateToDelete) return;

    try {
      // Deletar imagens do storage
      if (updateToDelete.system_update_images && updateToDelete.system_update_images.length > 0) {
        const paths = updateToDelete.system_update_images.map(img => {
          const url = new URL(img.image_url);
          return url.pathname.split('/').slice(-2).join('/');
        });
        await supabase.storage.from('system-update-images').remove(paths);
      }

      // Deletar do banco (cascade deleta as imagens)
      const { error } = await supabase
        .from('system_updates')
        .delete()
        .eq('id', updateToDelete.id);

      if (error) throw error;

      toast({
        title: 'Excluído',
        description: 'A atualização foi excluída com sucesso.'
      });

      setDeleteConfirmOpen(false);
      setUpdateToDelete(null);
      fetchUpdates();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Novidades</h1>
            <p className="text-sm text-muted-foreground">
              Crie e gerencie as atualizações do sistema
            </p>
          </div>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Atualização
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versão</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma atualização cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                updates.map(update => {
                  const CategoryIcon = categoryIcons[update.category];
                  return (
                    <TableRow key={update.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {update.version}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {update.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CategoryIcon className="h-4 w-4" />
                          <span className="text-sm">{categoryLabels[update.category]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(update.release_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={update.is_published ? 'default' : 'secondary'}>
                          {update.is_published ? '✅ Publicado' : '📝 Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(update)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePublish(update)}>
                              {update.is_published ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Despublicar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publicar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setUpdateToDelete(update);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UpdateFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        update={selectedUpdate}
        onSuccess={fetchUpdates}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atualização?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A atualização "{updateToDelete?.title}" será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
