import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

const addonSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  category_id: z.string().optional(),
  display_order: z.number().min(0, 'Deve ser maior ou igual a 0'),
  is_available: z.boolean(),
});

type AddonFormData = z.infer<typeof addonSchema>;

interface AddonFormProps {
  addon?: any;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddonForm({ addon, categories, onSuccess, onCancel }: AddonFormProps) {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddonFormData>({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category_id: '',
      display_order: 0,
      is_available: true,
    },
  });

  const selectedCategory = watch('category_id');

  useEffect(() => {
    if (addon) {
      setValue('name', addon.name);
      setValue('description', addon.description || '');
      setValue('price', addon.price || 0);
      
      // Verificar se a categoria ainda existe
      const categoryExists = categories.find(cat => cat.id === addon.category_id);
      const categoryValue = addon.category_id && categoryExists ? addon.category_id : 'none';
      setValue('category_id', categoryValue);
      
      setValue('display_order', addon.display_order || 0);
      setValue('is_available', addon.is_available);
    }
  }, [addon, setValue, categories]);

  const onSubmit = async (data: AddonFormData) => {
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
        category_id: data.category_id === 'none' || data.category_id === '' ? null : data.category_id,
        store_id: storeData.id,
      };

      if (addon) {
        // Atualizar adicional existente
        const { error } = await supabase
          .from('addons')
          .update(formData)
          .eq('id', addon.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Adicional atualizado com sucesso',
        });
      } else {
        // Criar novo adicional
        const { error } = await supabase
          .from('addons')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Adicional criado com sucesso',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar adicional:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar adicional',
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
          <Label htmlFor="name">Nome do Adicional *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ex: Bacon, Queijo Extra"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register('price', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            key={addon?.id || 'new'}
            value={selectedCategory || 'none'}
            onValueChange={(value) => setValue('category_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          placeholder="Descrição opcional do adicional"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_hidden"
          checked={!watch('is_available')}
          onCheckedChange={(checked) => setValue('is_available', !checked)}
        />
        <Label htmlFor="is_hidden" className="text-sm">
          Ocultar item
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : addon ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}