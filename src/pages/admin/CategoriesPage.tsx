import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Grid, Plus, Search, Edit, Trash2, Package, ArrowUp, ArrowDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  store_id: string;
  created_at: string;
  updated_at: string;
  products_count: number;
}

const CategoriesPage = () => {
  usePageSEO({
    title: 'Categorias - Mostralo | Organize seu Cardápio',
    description: 'Organize seu cardápio em categorias. Crie, edite e gerencie categorias para facilitar a navegação dos seus clientes.',
    keywords: 'categorias cardápio, organizar produtos, gestão categorias, classificação produtos'
  });

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null);
  const { user } = useAuth();
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!validatedStoreId) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(count)')
        .eq('store_id', validatedStoreId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar categorias.',
          variant: 'destructive'
        });
        return;
      }

      const categoriesWithCount = data?.map(cat => ({
        ...cat,
        products_count: (cat.products as any)?.[0]?.count || 0
      })) || [];
      
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar categorias.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Normaliza display_order de todas as categorias e salva no banco
  const normalizeAndSave = async (reordered: CategoryData[]) => {
    try {
      // Atualiza cada categoria com seu novo display_order baseado na posição
      const updates = reordered.map((cat, index) => 
        supabase
          .from('categories')
          .update({ display_order: index + 1 })
          .eq('id', cat.id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);

      if (hasError) throw new Error('Erro ao salvar ordem');

      toast({
        title: 'Sucesso',
        description: 'Ordem atualizada.',
      });

      fetchCategories();
    } catch (error) {
      console.error('Erro ao reordenar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar ordem da categoria.',
        variant: 'destructive'
      });
    }
  };

  const moveCategoryUp = async (categoryIndex: number) => {
    if (categoryIndex === 0) return;
    const reordered = [...filteredCategories];
    const [removed] = reordered.splice(categoryIndex, 1);
    reordered.splice(categoryIndex - 1, 0, removed);
    await normalizeAndSave(reordered);
  };

  const moveCategoryDown = async (categoryIndex: number) => {
    if (categoryIndex === filteredCategories.length - 1) return;
    const reordered = [...filteredCategories];
    const [removed] = reordered.splice(categoryIndex, 1);
    reordered.splice(categoryIndex + 1, 0, removed);
    await normalizeAndSave(reordered);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    // Verificar se tem produtos vinculados
    if (categoryToDelete.products_count > 0) {
      toast({
        title: 'Atenção',
        description: `Esta categoria possui ${categoryToDelete.products_count} produto(s). Mova-os para outra categoria primeiro.`,
        variant: 'destructive'
      });
      setDeleteDialogOpen(false);
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryToDelete.id);

    if (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir categoria.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso!'
      });
      fetchCategories();
    }

    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  useEffect(() => {
    if (!storeAccessLoading && hasAccess && validatedStoreId) {
      fetchCategories();
    }
  }, [validatedStoreId, storeAccessLoading, hasAccess]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statsCards = [
    {
      title: 'Total de Categorias',
      value: categories.length,
      description: 'Categorias cadastradas',
      icon: Grid
    },
    {
      title: 'Categorias Ativas',
      value: categories.filter(c => c.is_active).length,
      description: 'Visíveis na loja',
      icon: Grid
    },
    {
      title: 'Categorias Inativas',
      value: categories.filter(c => !c.is_active).length,
      description: 'Ocultas na loja',
      icon: Grid
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize seus produtos em categorias</p>
        </div>
        <Button onClick={() => setCategoryFormOpen(true)} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Cards de Estatísticas - grid 2x2 em mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {statsCards.map((card, index) => (
          <Card key={index} className="p-3 md:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Lista de Categorias */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Lista de Categorias</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {filteredCategories.length} categoria{filteredCategories.length !== 1 ? 's' : ''} encontrada{filteredCategories.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Grid className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">
                {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca.'
                  : 'Comece criando categorias para organizar seus produtos.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setCategoryFormOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((category, index) => (
                <Card key={category.id} className="p-3 md:p-4 w-[90%] sm:w-full mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Ordem e setas - layout horizontal em mobile */}
                    <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:items-center gap-2 sm:gap-1">
                      <span className="text-xs text-muted-foreground">#{category.display_order}</span>
                      <div className="flex sm:flex-col gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          disabled={index === 0}
                          onClick={() => moveCategoryUp(index)}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          disabled={index === filteredCategories.length - 1}
                          onClick={() => moveCategoryDown(index)}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Conteúdo da categoria */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm md:text-base">{category.name}</h3>
                        <Badge variant={category.is_active ? 'default' : 'secondary'} className="text-[10px] md:text-xs">
                          {category.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          <Package className="w-3 h-3 mr-1" />
                          {category.products_count} {category.products_count !== 1 ? 'itens' : 'item'}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                        Criada em {new Date(category.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs flex-1 sm:flex-none"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryFormOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs flex-1 sm:flex-none"
                        onClick={() => {
                          setCategoryToDelete(category);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

              <CategoryForm
                open={categoryFormOpen}
                onOpenChange={(open) => {
                  setCategoryFormOpen(open);
                  if (!open) setEditingCategory(null);
                }}
                onSuccess={fetchCategories}
                category={editingCategory}
                storeId={validatedStoreId}
              />

              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"?
                      {categoryToDelete && categoryToDelete.products_count > 0 && (
                        <span className="block mt-2 text-destructive font-semibold">
                          ⚠️ Esta categoria possui {categoryToDelete.products_count} produto(s) vinculado(s).
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
    </div>
  );
};

export default CategoriesPage;