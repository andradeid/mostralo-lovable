import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package } from 'lucide-react';

interface AddonCategoryOption {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean | null;
}

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  category?: {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    display_order: number;
  } | null;
  storeId?: string | null;
}

export const CategoryForm = ({ open, onOpenChange, onSuccess, category, storeId: propStoreId }: CategoryFormProps) => {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [addonCategories, setAddonCategories] = useState<AddonCategoryOption[]>([]);
  const [selectedAddonCategoryIds, setSelectedAddonCategoryIds] = useState<string[]>([]);
  const [resolvedStoreId, setResolvedStoreId] = useState<string | null>(propStoreId || null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(category?.name || '');
      setDescription(category?.description || '');
      setIsActive(category?.is_active ?? true);
      
      // Resolve storeId if not passed as prop
      if (propStoreId) {
        setResolvedStoreId(propStoreId);
        fetchAddonCategories(propStoreId);
      } else {
        resolveStoreId();
      }
      
      if (category?.id) {
        fetchLinkedAddonCategories(category.id);
      } else {
        setSelectedAddonCategoryIds([]);
      }
    }
  }, [open, category, propStoreId]);

  const resolveStoreId = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('stores').select('id').eq('owner_id', user.id).single();
      if (data?.id) {
        setResolvedStoreId(data.id);
        fetchAddonCategories(data.id);
      }
    } catch (error) {
      console.error('Erro ao resolver storeId:', error);
    }
  };

  const fetchAddonCategories = async (storeId: string) => {
    try {
      const { data } = await supabase
        .from('addon_categories')
        .select('id, name, description, is_required')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order');
      if (data) setAddonCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias de adicionais:', error);
    }
  };

  const fetchLinkedAddonCategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_addon_categories')
        .select('addon_category_id')
        .eq('category_id', categoryId);
      
      if (error) {
        console.error('Erro ao buscar vínculos:', error);
        return;
      }
      if (data) {
        setSelectedAddonCategoryIds(data.map(d => d.addon_category_id));
      }
    } catch (error) {
      console.error('Erro ao buscar vínculos de adicionais:', error);
    }
  };

  const toggleAddonCategory = (addonCategoryId: string) => {
    setSelectedAddonCategoryIds(prev =>
      prev.includes(addonCategoryId)
        ? prev.filter(id => id !== addonCategoryId)
        : [...prev, addonCategoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    const storeId = resolvedStoreId;
    console.log('📝 CategoryForm handleSubmit:', { storeId, userId: user.id, categoryId: category?.id, selectedAddonCategoryIds });
    
    if (!storeId) {
      console.error('❌ CategoryForm: storeId não encontrado');
      toast({ title: 'Erro', description: 'Loja não encontrada.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let categoryId = category?.id;

      if (category) {
        // Editar categoria existente
        const { error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', category.id);
        if (error) throw error;
      } else {
        // Criar nova categoria
        const { data: maxOrderData } = await supabase
          .from('categories')
          .select('display_order')
          .eq('store_id', storeId)
          .order('display_order', { ascending: false })
          .limit(1);

        const nextOrder = maxOrderData && maxOrderData.length > 0
          ? (maxOrderData[0].display_order || 0) + 1
          : 1;

        const { data: newCat, error } = await supabase
          .from('categories')
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            is_active: isActive,
            store_id: storeId,
            display_order: nextOrder,
          })
          .select('id')
          .single();
        if (error) throw error;
        categoryId = newCat?.id;
      }

      // Salvar vínculos de categorias de adicionais
      console.log('🔗 Salvando vínculos:', { categoryId, selectedAddonCategoryIds, storeId });
      
      if (categoryId) {
        // Remover todos os vínculos existentes
        const { error: deleteError, count: deleteCount } = await supabase
          .from('category_addon_categories')
          .delete()
          .eq('category_id', categoryId);

        console.log('🗑️ Delete vínculos:', { deleteError, deleteCount });

        if (deleteError) {
          console.error('❌ Erro ao remover vínculos:', deleteError);
        }

        // Inserir novos vínculos
        if (selectedAddonCategoryIds.length > 0) {
          const links = selectedAddonCategoryIds.map(addonCatId => ({
            category_id: categoryId!,
            addon_category_id: addonCatId,
            store_id: storeId,
          }));
          console.log('📤 Inserindo vínculos:', links);
          
          const { error: linkError, data: linkData } = await supabase
            .from('category_addon_categories')
            .insert(links);
          
          console.log('📥 Resultado insert vínculos:', { linkError, linkData });
          
          if (linkError) {
            console.error('❌ Erro ao salvar vínculos:', linkError);
            throw linkError;
          }
        }
      }

      toast({
        title: 'Sucesso',
        description: category ? 'Categoria atualizada com sucesso.' : 'Categoria criada com sucesso.',
      });

      setName('');
      setDescription('');
      setIsActive(true);
      setSelectedAddonCategoryIds([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar categoria.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(category?.name || '');
      setDescription(category?.description || '');
      setIsActive(category?.is_active ?? true);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
          <DialogDescription>
            {category
              ? 'Atualize as informações da categoria.'
              : 'Crie uma nova categoria para organizar seus produtos.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da categoria *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bebidas, Lanches, Sobremesas..."
              required
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional da categoria..."
              className="min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 caracteres
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active" className="text-sm">
              Categoria ativa (visível na loja)
            </Label>
          </div>

          {/* Categorias de Adicionais */}
          {addonCategories.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Categorias de Adicionais</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Selecione quais categorias de adicionais serão aplicadas automaticamente a todos os produtos desta categoria.
              </p>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {addonCategories.map((addonCat) => (
                  <div
                    key={addonCat.id}
                    className="flex items-start space-x-3 p-2.5 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleAddonCategory(addonCat.id)}
                  >
                    <Checkbox
                      id={`addon-cat-${addonCat.id}`}
                      checked={selectedAddonCategoryIds.includes(addonCat.id)}
                      onCheckedChange={() => toggleAddonCategory(addonCat.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{addonCat.name}</span>
                        {addonCat.is_required && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Obrigatória
                          </Badge>
                        )}
                      </div>
                      {addonCat.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {addonCat.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedAddonCategoryIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  ✅ {selectedAddonCategoryIds.length} categoria(s) de adicionais vinculada(s)
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {category ? 'Atualizar' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
