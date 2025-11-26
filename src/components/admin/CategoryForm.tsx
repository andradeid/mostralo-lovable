import { useState } from 'react';
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
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      // Buscar a loja do usuário
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
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
      <DialogContent className="sm:max-w-[425px]">
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