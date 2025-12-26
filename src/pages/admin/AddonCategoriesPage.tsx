import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { AddonCategoryForm } from '@/components/admin/AddonCategoryForm';

interface AddonCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  min_selections: number;
  max_selections: number | null;
  is_required: boolean;
  created_at: string;
}

export default function AddonCategoriesPage() {
  const [categories, setCategories] = useState<AddonCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AddonCategory | null>(null);
  const { profile } = useAuth();
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const { toast } = useToast();

  useEffect(() => {
    if (!storeAccessLoading && hasAccess && validatedStoreId) {
      fetchCategories();
    }
  }, [validatedStoreId, storeAccessLoading, hasAccess]);

  const fetchCategories = async () => {
    if (!validatedStoreId) return;

    try {
      const { data, error } = await supabase
        .from('addon_categories')
        .select('*')
        .eq('store_id', validatedStoreId)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar categorias de adicionais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (categoryId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('addon_categories')
        .update({ is_active: newStatus })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, is_active: newStatus } : cat
      ));

      toast({
        title: 'Sucesso',
        description: `Categoria ${newStatus ? 'ativada' : 'desativada'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da categoria',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('addon_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.filter(cat => cat.id !== categoryId));
      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir categoria',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-0 md:px-4 py-4 md:py-8 max-w-5xl mx-auto">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Categorias de Adicionais</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as categorias de adicionais da sua loja
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <AddonCategoryForm
              category={editingCategory}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingCategory(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:gap-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma categoria de adicionais encontrada
              </p>
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="w-[90%] sm:w-full mx-auto">
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-sm md:text-lg font-semibold">{category.name}</h3>
                      <Badge variant={category.is_active ? 'default' : 'secondary'} className="text-[10px] md:text-xs">
                        {category.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      {category.is_required && (
                        <Badge variant="destructive" className="text-[10px] md:text-xs">Obrigatória</Badge>
                      )}
                    </div>
                    
                    {category.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    <div className="text-[10px] md:text-xs text-muted-foreground">
                      <span>
                        Min: {category.min_selections} | Max: {category.max_selections ? category.max_selections : 'Ilimitado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleToggleActive(category.id, !category.is_active)}
                    >
                      {category.is_active ? (
                        <EyeOff className="w-3 h-3 md:w-4 md:h-4" />
                      ) : (
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 sm:flex-none"
                      onClick={() => {
                        setEditingCategory(category);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 sm:flex-none"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}