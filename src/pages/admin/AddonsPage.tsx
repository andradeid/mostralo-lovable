import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Grid, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { AddonForm } from '@/components/admin/AddonForm';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface Addon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  display_order: number;
  category_id: string | null;
  created_at: string;
}

interface AddonCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  store_id: string;
  addons: Addon[];
}

export default function AddonsPage() {
  const [categories, setCategories] = useState<AddonCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const { profile } = useAuth();
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const { toast } = useToast();

  useEffect(() => {
    if (!storeAccessLoading && hasAccess && validatedStoreId) {
      fetchData();
    }
  }, [validatedStoreId, storeAccessLoading, hasAccess]);

  const fetchData = async () => {
    if (!validatedStoreId) return;

    try {
      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('addon_categories')
        .select('*')
        .eq('store_id', validatedStoreId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) {
        console.error('Erro ao buscar categorias:', categoriesError);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar categorias.',
          variant: 'destructive'
        });
        return;
      }

      // Buscar adicionais
      const { data: addonsData, error: addonsError } = await supabase
        .from('addons')
        .select('*')
        .eq('store_id', validatedStoreId)
        .order('display_order', { ascending: true });

      if (addonsError) {
        console.error('Erro ao buscar adicionais:', addonsError);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar adicionais.',
          variant: 'destructive'
        });
        return;
      }

      // Organizar adicionais por categoria
      const categoriesWithAddons: AddonCategory[] = (categoriesData || []).map(category => ({
        ...category,
        addons: (addonsData || []).filter(addon => addon.category_id === category.id)
      }));

      // Adicionar adicionais sem categoria
      const uncategorizedAddons = (addonsData || []).filter(addon => !addon.category_id);
      if (uncategorizedAddons.length > 0) {
        categoriesWithAddons.unshift({
          id: 'uncategorized',
          name: 'Sem Categoria',
          description: 'Adicionais que não foram categorizados',
          display_order: -1,
          is_active: true,
          store_id: storeData.id,
          addons: uncategorizedAddons
        });
      }

      setCategories(categoriesWithAddons);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addonId: string) => {
    if (!confirm('Tem certeza que deseja excluir este adicional?')) return;

    try {
      const { error } = await supabase
        .from('addons')
        .delete()
        .eq('id', addonId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Adicional excluído com sucesso',
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao excluir adicional:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir adicional',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAddon(null);
    fetchData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAddon(null);
  };

  const handleToggleAvailability = async (addonId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('addons')
        .update({ is_available: !currentStatus })
        .eq('id', addonId);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar disponibilidade do adicional.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: `Adicional ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar disponibilidade do adicional.',
        variant: 'destructive'
      });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    try {
      const sourceCategory = categories.find(c => c.id === source.droppableId);
      const destinationCategory = categories.find(c => c.id === destination.droppableId);

      if (!sourceCategory || !destinationCategory) return;

      const addon = sourceCategory.addons.find(a => a.id === draggableId);
      if (!addon) return;

      // Se mudou de categoria
      if (source.droppableId !== destination.droppableId) {
        const newCategoryId = destination.droppableId === 'uncategorized' ? null : destination.droppableId;
        
        const { error } = await supabase
          .from('addons')
          .update({ 
            category_id: newCategoryId,
            display_order: destination.index
          })
          .eq('id', draggableId);

        if (error) throw error;

        // Reordenar adicionais na categoria de destino
        const destinationAddons = destinationCategory.addons.slice();
        destinationAddons.splice(destination.index, 0, { ...addon, category_id: newCategoryId });

        for (let i = 0; i < destinationAddons.length; i++) {
          const add = destinationAddons[i];
          if (add.id !== draggableId) {
            await supabase
              .from('addons')
              .update({ display_order: i })
              .eq('id', add.id);
          }
        }

        toast({
          title: 'Sucesso',
          description: `Adicional movido para ${destinationCategory.name}`,
        });
      } else {
        // Apenas reordenou dentro da mesma categoria
        const categoryAddons = sourceCategory.addons.slice();
        const [movedAddon] = categoryAddons.splice(source.index, 1);
        categoryAddons.splice(destination.index, 0, movedAddon);

        for (let i = 0; i < categoryAddons.length; i++) {
          const add = categoryAddons[i];
          await supabase
            .from('addons')
            .update({ display_order: i })
            .eq('id', add.id);
        }

        toast({
          title: 'Sucesso',
          description: 'Adicional reordenado',
        });
      }

      fetchData();
    } catch (error) {
      console.error('Erro ao mover adicional:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao mover adicional',
        variant: 'destructive'
      });
    }
  };

  const moveCategoryUp = async (categoryIndex: number) => {
    if (categoryIndex === 0 || categories[categoryIndex].id === 'uncategorized') return;

    const currentCategory = categories[categoryIndex];
    const previousCategory = categories[categoryIndex - 1];

    if (previousCategory.id === 'uncategorized') return;

    try {
      const { error } = await supabase
        .from('addon_categories')
        .update({ display_order: previousCategory.display_order })
        .eq('id', currentCategory.id);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('addon_categories')
        .update({ display_order: currentCategory.display_order })
        .eq('id', previousCategory.id);

      if (error2) throw error2;

      toast({
        title: 'Sucesso',
        description: 'Categoria movida para cima.',
      });

      fetchData();
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
    if (categoryIndex === categories.length - 1 || categories[categoryIndex].id === 'uncategorized') return;

    const currentCategory = categories[categoryIndex];
    const nextCategory = categories[categoryIndex + 1];

    try {
      const { error } = await supabase
        .from('addon_categories')
        .update({ display_order: nextCategory.display_order })
        .eq('id', currentCategory.id);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('addon_categories')
        .update({ display_order: currentCategory.display_order })
        .eq('id', nextCategory.id);

      if (error2) throw error2;

      toast({
        title: 'Sucesso',
        description: 'Categoria movida para baixo.',
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao mover categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar ordem da categoria.',
        variant: 'destructive'
      });
    }
  };

  const totalAddons = categories.reduce((total, category) => total + category.addons.length, 0);
  const activeAddons = categories.reduce((total, category) => 
    total + category.addons.filter(a => a.is_available).length, 0);

  const statsCards = [
    {
      title: 'Total de Adicionais',
      value: totalAddons,
      description: 'Adicionais cadastrados',
      icon: Package
    },
    {
      title: 'Adicionais Ativos',
      value: activeAddons,
      description: 'Disponíveis para venda',
      icon: Package
    },
    {
      title: 'Categorias',
      value: categories.length,
      description: 'Categorias ativas',
      icon: Grid
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Adicionais</h1>
          <p className="text-muted-foreground">Gerencie os adicionais da sua loja</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Adicional
          </Button>
        </div>
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

      {/* Modal do formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingAddon ? 'Editar Adicional' : 'Novo Adicional'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddonForm
                  addon={editingAddon}
                  categories={categories.filter(c => c.id !== 'uncategorized')}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Lista de Adicionais por Categoria */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum adicional cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece adicionando adicionais à sua loja.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Adicional
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Accordion type="multiple" className="space-y-4" defaultValue={categories.map(c => c.id)}>
              {categories.map((category, categoryIndex) => (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg">
                  <Card>
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          {/* Botões de reordenação de categoria */}
                          {category.id !== 'uncategorized' && (
                            <div className="flex flex-col items-center space-y-1 mr-2">
                              <span className="text-xs text-muted-foreground">#{category.display_order}</span>
                              <div className="flex flex-col space-y-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  disabled={categoryIndex === 0 || (categoryIndex === 1 && categories[0].id === 'uncategorized')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveCategoryUp(categoryIndex);
                                  }}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  disabled={categoryIndex === categories.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveCategoryDown(categoryIndex);
                                  }}
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          <Grid className="w-5 h-5 text-primary" />
                          <div className="text-left">
                            <h3 className="font-semibold text-lg">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mr-4">
                          <Badge variant="outline">
                            {category.addons.length} adiciona{category.addons.length !== 1 ? 'is' : 'l'}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowForm(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-6">
                      {category.addons.length === 0 ? (
                        <Droppable droppableId={category.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`text-center py-8 min-h-[120px] rounded-lg border-2 border-dashed transition-colors ${
                                snapshot.isDraggingOver 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-muted-foreground/30'
                              }`}
                            >
                              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                              <p className="text-muted-foreground mb-4">
                                {snapshot.isDraggingOver 
                                  ? 'Solte o adicional aqui' 
                                  : 'Nenhum adicional nesta categoria'
                                }
                              </p>
                              {!snapshot.isDraggingOver && (
                                <Button
                                  variant="outline"
                                  onClick={() => setShowForm(true)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Primeiro Adicional
                                </Button>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ) : (
                        <Droppable droppableId={category.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`space-y-3 ${
                                snapshot.isDraggingOver 
                                  ? 'bg-primary/5 rounded-lg p-2 border-2 border-dashed border-primary' 
                                  : ''
                              }`}
                            >
                              {category.addons.map((addon, addonIndex) => (
                                <Draggable key={addon.id} draggableId={addon.id} index={addonIndex}>
                                  {(provided, snapshot) => (
                                    <Card 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`overflow-hidden ${
                                        snapshot.isDragging 
                                          ? 'shadow-lg rotate-2 transform scale-105' 
                                          : ''
                                      }`}
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-center space-x-4">
                                          {/* Handle de drag */}
                                          <div 
                                            {...provided.dragHandleProps}
                                            className="flex flex-col items-center space-y-1 cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                            <span className="text-xs text-muted-foreground">#{addon.display_order}</span>
                                          </div>

                                          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            <Package className="w-6 h-6 text-muted-foreground" />
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center space-x-2">
                                                <h4 className="font-semibold truncate">{addon.name}</h4>
                                              </div>
                                              <span className="font-bold text-lg text-primary flex-shrink-0">
                                                +R$ {Number(addon.price).toFixed(2)}
                                              </span>
                                            </div>
                                            
                                            {addon.description && (
                                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                {addon.description}
                                              </p>
                                            )}
                                            
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2">
                                                <Switch
                                                  checked={addon.is_available}
                                                  onCheckedChange={() => handleToggleAvailability(addon.id, addon.is_available)}
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                  {addon.is_available ? 'Ativo' : 'Inativo'}
                                                </span>
                                              </div>
                                              <div className="flex space-x-2">
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => handleEdit(addon)}
                                                >
                                                  <Edit className="w-4 h-4 mr-1" />
                                                  Editar
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => handleDelete(addon.id)}
                                                >
                                                  <Trash2 className="w-4 h-4 mr-1" />
                                                  Excluir
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}