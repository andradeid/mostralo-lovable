import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { CategoryMultiFlavorSection, type MultiFlavorValue } from './CategoryMultiFlavorSection';

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
}

export const CategoryForm = ({ open, onOpenChange, onSuccess, category }: CategoryFormProps) => {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const EMPTY_MF: MultiFlavorValue = { enabled: false, pricing: 'average', max: {} };
  const [multiFlavor, setMultiFlavor] = useState<MultiFlavorValue>(EMPTY_MF);
  const [multiFlavorLoaded, setMultiFlavorLoaded] = useState(false);
  const { user } = useAuth();
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const { toast } = useToast();

  // Sincronizar estados quando o dialog abre ou a categoria muda
  useEffect(() => {
    if (open) {
      setName(category?.name || '');
      setDescription(category?.description || '');
      setIsActive(category?.is_active ?? true);
      setMultiFlavor(EMPTY_MF);
      setMultiFlavorLoaded(false);
    }
  }, [open, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || storeAccessLoading || !hasAccess) return;

    setLoading(true);
    try {
      // Buscar a loja do usuário
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq(validatedStoreId ? 'id' : 'owner_id', validatedStoreId ?? user.id)
        .single();

      if (!storeData) {
        toast({
          title: 'Erro',
          description: 'Loja não encontrada.',
          variant: 'destructive'
        });
        return;
      }

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

        if (error) {
          console.error('Erro ao atualizar categoria:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao atualizar categoria.',
            variant: 'destructive'
          });
          return;
        }

        // Meio a meio (gravado à parte: só depois que a seção carregou a configuração atual)
        if (multiFlavorLoaded) {
          const { error: mfError } = await supabase
            .from('categories')
            .update({
              multi_flavor_enabled: multiFlavor.enabled,
              multi_flavor_pricing: multiFlavor.pricing,
              multi_flavor_max: multiFlavor.max,
            } as any)
            .eq('id', category.id);
          if (mfError) {
            console.error('Erro ao salvar meio a meio:', mfError);
            toast({ title: 'Atenção', description: 'Categoria salva, mas a configuração de sabores não foi salva.', variant: 'destructive' });
          }
        }

        toast({
          title: 'Sucesso',
          description: 'Categoria atualizada com sucesso.',
        });
      } else {
        // Buscar a maior ordem atual
        const { data: maxOrderData } = await supabase
          .from('categories')
          .select('display_order')
          .eq('store_id', storeData.id)
          .order('display_order', { ascending: false })
          .limit(1);

        const nextOrder = maxOrderData && maxOrderData.length > 0 
          ? (maxOrderData[0].display_order || 0) + 1 
          : 1;

        // Criar nova categoria
        const { error } = await supabase
          .from('categories')
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            is_active: isActive,
            store_id: storeData.id,
            display_order: nextOrder,
          });

        if (error) {
          console.error('Erro ao criar categoria:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao criar categoria.',
            variant: 'destructive'
          });
          return;
        }

        toast({
          title: 'Sucesso',
          description: 'Categoria criada com sucesso.',
        });
      }

      // Resetar formulário
      setName('');
      setDescription('');
      setIsActive(true);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar categoria.',
        variant: 'destructive'
      });
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
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
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

          {category && (
            <CategoryMultiFlavorSection
              categoryId={category.id}
              value={multiFlavor}
              onChange={setMultiFlavor}
              onLoaded={(v) => { setMultiFlavor(v); setMultiFlavorLoaded(true); }}
            />
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