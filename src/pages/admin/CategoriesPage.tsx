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

interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  store_id: string;
  created_at: string;
  updated_at: string;
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
  const { user } = useAuth();
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!validatedStoreId) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
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

      setCategories(data || []);
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

  const moveCategoryUp = async (categoryIndex: number) => {
    if (categoryIndex === 0) return;

    const currentCategory = filteredCategories[categoryIndex];
    const previousCategory = filteredCategories[categoryIndex - 1];

    try {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: previousCategory.display_order })
        .eq('id', currentCategory.id);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('categories')
        .update({ display_order: currentCategory.display_order })
        .eq('id', previousCategory.id);

      if (error2) throw error2;

      toast({
        title: 'Sucesso',
        description: 'Categoria movida para cima.',
      });

      fetchCategories();
    } catch (error) {
      console.error('Erro ao mover categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar ordem da categoria.',
        variant: 'destructive'
      });
    }
  };

  const moveCategoryDown = async (categoryIndex: number) => {
    if (categoryIndex === filteredCategories.length - 1) return;

    const currentCategory = filteredCategories[categoryIndex];
    const nextCategory = filteredCategories[categoryIndex + 1];

    try {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: nextCategory.display_order })
        .eq('id', currentCategory.id);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('categories')
        .update({ display_order: currentCategory.display_order })
        .eq('id', nextCategory.id);

      if (error2) throw error2;

      toast({
        title: 'Sucesso',
        description: 'Categoria movida para baixo.',
      });

      fetchCategories();
    } catch (error) {
      console.error('Erro ao mover categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar ordem da categoria.',
        variant: 'destructive'
      });
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Organize seus produtos em categorias</p>
        </div>
        <Button onClick={() => setCategoryFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Lista de Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            {filteredCategories.length} categoria{filteredCategories.length !== 1 ? 's' : ''} encontrada{filteredCategories.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Grid className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca.'
                  : 'Comece criando categorias para organizar seus produtos.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setCategoryFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((category, index) => (
                <Card key={category.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-sm text-muted-foreground">#{category.display_order}</span>
                        <div className="flex flex-col space-y-1">
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
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Criada em {new Date(category.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Package className="w-4 h-4 mr-2" />
                        Produtos
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
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
        onOpenChange={setCategoryFormOpen}
        onSuccess={fetchCategories}
      />
    </div>
  );
};

export default CategoriesPage;