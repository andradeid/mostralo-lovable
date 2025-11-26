import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

const addonCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  is_required: z.boolean(),
  min_selections: z.number().min(0, 'Deve ser maior ou igual a 0'),
  max_selections: z.number().min(1, 'Deve ser maior que 0').optional(),
  display_order: z.number().min(0, 'Deve ser maior ou igual a 0'),
  is_active: z.boolean(),
});

type AddonCategoryFormData = z.infer<typeof addonCategorySchema>;

interface AddonCategoryFormProps {
  category?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddonCategoryForm({ category, onSuccess, onCancel }: AddonCategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [hasMaxLimit, setHasMaxLimit] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddonCategoryFormData>({
    resolver: zodResolver(addonCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      is_required: false,
      min_selections: 0,
      max_selections: undefined,
      display_order: 0,
      is_active: true,
    },
  });

  const isRequired = watch('is_required');
  const minSelections = watch('min_selections');

  useEffect(() => {
    if (category) {
      setValue('name', category.name);
      setValue('description', category.description || '');
      setValue('is_required', category.is_required);
      setValue('min_selections', category.min_selections || 0);
      setValue('display_order', category.display_order || 0);
      setValue('is_active', category.is_active);
      
      // Verifica se tem limite máximo definido (não nulo)
      if (category.max_selections !== null && category.max_selections !== undefined) {
        setValue('max_selections', category.max_selections);
        setHasMaxLimit(true);
      } else {
        setHasMaxLimit(false);
      }
    }
  }, [category, setValue]);

  const onSubmit = async (data: AddonCategoryFormData) => {
    if (!profile) return;

    setLoading(true);
    try {
      // Buscar store_id
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', profile.id)
        .single();

      if (!storeData) {
        throw new Error('Loja não encontrada');
      }

      const formData: any = {
        ...data,
        max_selections: hasMaxLimit ? data.max_selections : null,
        store_id: storeData.id,
      };

      if (category) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('addon_categories')
          .update(formData)
          .eq('id', category.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Categoria atualizada com sucesso',
        });
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('addon_categories')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Categoria criada com sucesso',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar categoria',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Categoria *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ex: Proteínas, Molhos"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_order">Ordem de Exibição</Label>
          <Input
            id="display_order"
            type="number"
            {...register('display_order', { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.display_order && (
            <p className="text-sm text-destructive">{errors.display_order.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descrição opcional da categoria"
          rows={3}
        />
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
        <h4 className="font-medium">Regras de Seleção</h4>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_required"
            {...register('is_required')}
            onCheckedChange={(checked) => setValue('is_required', checked as boolean)}
          />
          <Label htmlFor="is_required" className="text-sm">
            Esta categoria é obrigatória (cliente deve selecionar pelo menos um item)
          </Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min_selections">
              Seleções Mínimas {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="min_selections"
              type="number"
              min="0"
              {...register('min_selections', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.min_selections && (
              <p className="text-sm text-destructive">{errors.min_selections.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_max_limit"
                checked={hasMaxLimit}
                onCheckedChange={(checked) => setHasMaxLimit(checked === true)}
              />
              <Label htmlFor="has_max_limit" className="text-sm">
                Definir limite máximo
              </Label>
            </div>
            {hasMaxLimit && (
              <Input
                type="number"
                min={minSelections + 1}
                {...register('max_selections', { valueAsNumber: true })}
                placeholder="Número máximo"
              />
            )}
            {errors.max_selections && (
              <p className="text-sm text-destructive">{errors.max_selections.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          {...register('is_active')}
          onCheckedChange={(checked) => setValue('is_active', checked as boolean)}
        />
        <Label htmlFor="is_active" className="text-sm">
          Categoria ativa
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : category ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}