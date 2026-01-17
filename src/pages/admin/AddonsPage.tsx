import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Grid, ArrowUp, ArrowDown, GripVertical, ArrowDownAZ } from 'lucide-react';
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
          store_id: validatedStoreId,
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

  const applyAlphabeticalOrderToCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || category.addons.length === 0) return;

    // Ordenar adicionais alfabeticamente (pt-BR para acentuação correta)
    const sortedAddons = [...category.addons].sort((a, b) => 
      a.name.localeCompare(b.name, 'pt-BR')
    );

    try {
      // Atualizar display_order no banco de dados
      for (let i = 0; i < sortedAddons.length; i++) {
        await supabase
          .from('addons')
          .update({ display_order: i })
          .eq('id', sortedAddons[i].id);
      }

      toast({
        title: 'Sucesso',
        description: `Adicionais de "${category.name}" ordenados de A-Z.`,
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao ordenar adicionais:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao ordenar adicionais alfabeticamente.',
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
    <div className="space-y-4 md:space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Adicionais</h1>
          <p className="text-sm text-muted-foreground">Gerencie os adicionais da sua loja</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Adicional
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
                    <AccordionTrigger className="px-3 md:px-6 py-3 md:py-4 hover:no-underline">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          {/* Botões de reordenação de categoria - ocultos em mobile */}
                          {category.id !== 'uncategorized' && (
                            <div className="hidden sm:flex flex-col items-center space-y-1 mr-2">
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
                          <Grid className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                          <div className="text-left min-w-0 max-w-[140px] sm:max-w-none">
                            <h3 className="font-semibold text-sm md:text-lg truncate">{category.name}</h3>
                            {category.description && (
                              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-1 hidden sm:block">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-0 sm:mr-4 ml-6 sm:ml-0">
                          <Badge variant="outline" className="text-xs">
                            {category.addons.length} {category.addons.length !== 1 ? 'itens' : 'item'}
                          </Badge>
                          {category.addons.length > 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                applyAlphabeticalOrderToCategory(category.id);
                              }}
                              title="Ordenar adicionais de A-Z"
                            >
                              <ArrowDownAZ className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="h-7 text-xs sm:h-8 sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowForm(true);
                            }}
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-0 sm:mr-1" />
                            <span className="hidden sm:inline">Adicionar</span>
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-3 md:px-6 pb-4 md:pb-6">
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
                                      className={`overflow-hidden w-[90%] sm:w-full mx-auto ${
                                        snapshot.isDragging 
                                          ? 'shadow-lg rotate-2 transform scale-105' 
                                          : ''
                                      }`}
                                    >
                                      <CardContent className="p-3 md:p-4">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                          {/* Imagem + Handle de drag */}
                                          <div className="flex items-start gap-2">
                                            {/* Handle de drag - oculto em mobile */}
                                            <div 
                                              {...provided.dragHandleProps}
                                              className="hidden sm:flex flex-col items-center space-y-1 cursor-grab active:cursor-grabbing"
                                            >
                                              <GripVertical className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground hover:text-primary transition-colors" />
                                              <span className="text-xs text-muted-foreground">#{addon.display_order}</span>
                                            </div>

                                            <div className="w-14 h-14 md:w-16 md:h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                              <Package className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                                            </div>

                                            {/* Info mobile - ao lado da imagem */}
                                            <div className="flex-1 sm:hidden">
                                              <h4 className="font-semibold text-sm leading-tight">{addon.name}</h4>
                                              <span className="font-bold text-sm text-primary mt-1 block">
                                                +R$ {Number(addon.price).toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {/* Conteúdo desktop */}
                                          <div className="flex-1 min-w-0 hidden sm:block">
                                            <div className="flex items-start justify-between mb-2">
                                              <h4 className="font-semibold">{addon.name}</h4>
                                              <span className="font-bold text-lg text-primary flex-shrink-0">
                                                +R$ {Number(addon.price).toFixed(2)}
                                              </span>
                                            </div>
                                            
                                            {addon.description && (
                                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                {addon.description}
                                              </p>
                                            )}
                                          </div>

                                          {/* Descrição mobile */}
                                          {addon.description && (
                                            <p className="text-xs text-muted-foreground sm:hidden line-clamp-2">
                                              {addon.description}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {/* Switches e Botões */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
                                          <div className="flex items-center gap-1.5">
                                            <Switch
                                              checked={addon.is_available}
                                              onCheckedChange={() => handleToggleAvailability(addon.id, addon.is_available)}
                                              className="scale-90"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                              {addon.is_available ? 'Ativo' : 'Inativo'}
                                            </span>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              className="h-7 text-xs flex-1 sm:flex-none"
                                              onClick={() => handleEdit(addon)}
                                            >
                                              <Edit className="w-3 h-3 mr-1" />
                                              Editar
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              className="h-7 text-xs flex-1 sm:flex-none"
                                              onClick={() => handleDelete(addon.id)}
                                            >
                                              <Trash2 className="w-3 h-3 mr-1" />
                                              Excluir
                                            </Button>
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