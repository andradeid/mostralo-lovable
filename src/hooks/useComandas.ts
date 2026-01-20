import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStoreAccess } from '@/hooks/useStoreAccess';

export interface Comanda {
  id: string;
  number: string;
  type: 'balcao' | 'mesa';
  status: 'open' | 'closed' | 'cancelled';
  table_number: string | null;
  customer_name: string | null;
  customer_id: string | null;
  source: 'garcom' | 'pdv' | 'self_service' | null;
  subtotal: number;
  discount: number;
  service_fee: number;
  total: number;
  notes: string | null;
  payment_method: string | null;
  payment_details: Record<string, any> | null;
  opened_at: string;
  closed_at: string | null;
  opened_by: string | null;
  closed_by: string | null;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface ComandaItem {
  id: string;
  comanda_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  addons: Record<string, any> | null;
  notes: string | null;
  added_by: string | null;
  added_at: string;
  preparation_status: 'pending' | 'preparing' | 'ready';
  preparation_started_at: string | null;
  prepared_at: string | null;
  requires_approval: boolean | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface CreateComandaInput {
  type: 'balcao' | 'mesa';
  table_number?: string;
  customer_name?: string;
  notes?: string;
}

export interface AddItemInput {
  comanda_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  addons?: Record<string, any>;
  notes?: string;
}

export interface CloseComandaInput {
  comanda_id: string;
  payment_method: string;
  payment_details?: Record<string, any>;
  discount?: number;
  service_fee?: number;
}

export function useComandas() {
  const { storeId } = useStoreAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as comandas da loja
  const { data: comandas = [], isLoading: loadingComandas, refetch: refetchComandas } = useQuery({
    queryKey: ['comandas', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('comandas')
        .select('*')
        .eq('store_id', storeId)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      return data as Comanda[];
    },
    enabled: !!storeId,
  });

  // Buscar contagem de itens pendentes de aprovação por comanda
  const { data: pendingApprovalsByComanda = {} } = useQuery({
    queryKey: ['pending-approvals', storeId],
    queryFn: async () => {
      if (!storeId) return {};
      
      const { data, error } = await supabase
        .from('comanda_items')
        .select('comanda_id')
        .eq('requires_approval', true)
        .is('approved_at', null);

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.comanda_id] = (counts[item.comanda_id] || 0) + 1;
      });
      
      return counts;
    },
    enabled: !!storeId,
    refetchInterval: 10000,
  });

  // Buscar comandas abertas
  const openComandas = comandas.filter(c => c.status === 'open');

  // Buscar uma comanda específica com seus itens
  const useComandaDetail = (comandaId: string | undefined) => {
    return useQuery({
      queryKey: ['comanda', comandaId],
      queryFn: async () => {
        if (!comandaId) return null;
        
        const { data: comanda, error: comandaError } = await supabase
          .from('comandas')
          .select('*')
          .eq('id', comandaId)
          .single();

        if (comandaError) throw comandaError;

        const { data: items, error: itemsError } = await supabase
          .from('comanda_items')
          .select('*')
          .eq('comanda_id', comandaId)
          .order('added_at', { ascending: true });

        if (itemsError) throw itemsError;

        return {
          comanda: comanda as Comanda,
          items: items as ComandaItem[],
        };
      },
      enabled: !!comandaId,
    });
  };

  // Criar nova comanda
  const createComandaMutation = useMutation({
    mutationFn: async (input: CreateComandaInput) => {
      if (!storeId) throw new Error('Store ID não encontrado');

      // Buscar próximo número da comanda
      const { data: nextNumber, error: numberError } = await supabase
        .rpc('get_next_comanda_number', { p_store_id: storeId });

      if (numberError) throw numberError;

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('comandas')
        .insert({
          store_id: storeId,
          number: nextNumber,
          type: input.type,
          table_number: input.table_number || null,
          customer_name: input.customer_name || null,
          notes: input.notes || null,
          status: 'open',
          opened_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Comanda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', storeId] });
      toast({
        title: 'Comanda aberta',
        description: 'Nova comanda criada com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar comanda:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a comanda.',
        variant: 'destructive',
      });
    },
  });

  // Adicionar item à comanda
  const addItemMutation = useMutation({
    mutationFn: async (input: AddItemInput) => {
      // Decrementar estoque se o produto tiver controle de estoque
      if (input.product_id) {
        const { data: stockResult, error: stockError } = await supabase
          .rpc('decrement_product_stock', {
            p_product_id: input.product_id,
            p_variant_id: input.variant_id || null,
            p_quantity: input.quantity
          });

        if (stockError) {
          console.error('Erro ao decrementar estoque:', stockError);
          throw new Error('Erro ao verificar estoque do produto');
        }

        // Cast para o tipo esperado
        const result = stockResult as { success: boolean; message?: string; available?: number } | null;
        if (result && !result.success && result.message === 'Estoque insuficiente') {
          throw new Error(`Estoque insuficiente. Disponível: ${result.available ?? 0} unidades`);
        }
      }

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('comanda_items')
        .insert({
          comanda_id: input.comanda_id,
          product_id: input.product_id || null,
          product_name: input.product_name,
          unit_price: input.unit_price,
          quantity: input.quantity,
          total_price: input.unit_price * input.quantity,
          addons: input.addons || null,
          notes: input.notes || null,
          added_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ComandaItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comanda', data.comanda_id] });
      queryClient.invalidateQueries({ queryKey: ['comandas', storeId] });
      toast({
        title: 'Item adicionado',
        description: 'Item adicionado à comanda.',
      });
    },
    onError: (error) => {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o item.',
        variant: 'destructive',
      });
    },
  });

  // Remover item da comanda
  const removeItemMutation = useMutation({
    mutationFn: async ({ itemId, comandaId }: { itemId: string; comandaId: string }) => {
      const { error } = await supabase
        .from('comanda_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { itemId, comandaId };
    },
    onSuccess: ({ comandaId }) => {
      queryClient.invalidateQueries({ queryKey: ['comanda', comandaId] });
      queryClient.invalidateQueries({ queryKey: ['comandas', storeId] });
      toast({
        title: 'Item removido',
        description: 'Item removido da comanda.',
      });
    },
    onError: (error) => {
      console.error('Erro ao remover item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o item.',
        variant: 'destructive',
      });
    },
  });

  // Fechar comanda
  const closeComandaMutation = useMutation({
    mutationFn: async (input: CloseComandaInput) => {
      const { data: user } = await supabase.auth.getUser();

      // Calcular total com taxa de serviço e desconto
      const serviceFee = input.service_fee || 0;
      const discount = input.discount || 0;

      // Buscar subtotal atual da comanda
      const { data: comandaData } = await supabase
        .from('comandas')
        .select('subtotal')
        .eq('id', input.comanda_id)
        .single();

      const subtotal = comandaData?.subtotal || 0;
      const total = subtotal + serviceFee - discount;

      const { data, error } = await supabase
        .from('comandas')
        .update({
          status: 'closed',
          payment_method: input.payment_method,
          payment_details: input.payment_details || null,
          discount: discount,
          service_fee: serviceFee,
          total: total,
          closed_at: new Date().toISOString(),
          closed_by: user?.user?.id || null,
        })
        .eq('id', input.comanda_id)
        .select()
        .single();

      if (error) throw error;
      return data as Comanda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', storeId] });
      toast({
        title: 'Comanda fechada',
        description: 'Comanda finalizada com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Erro ao fechar comanda:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fechar a comanda.',
        variant: 'destructive',
      });
    },
  });

  // Cancelar comanda
  const cancelComandaMutation = useMutation({
    mutationFn: async (comandaId: string) => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('comandas')
        .update({
          status: 'cancelled',
          closed_at: new Date().toISOString(),
          closed_by: user?.user?.id || null,
        })
        .eq('id', comandaId)
        .select()
        .single();

      if (error) throw error;
      return data as Comanda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', storeId] });
      toast({
        title: 'Comanda cancelada',
        description: 'A comanda foi cancelada.',
      });
    },
    onError: (error) => {
      console.error('Erro ao cancelar comanda:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a comanda.',
        variant: 'destructive',
      });
    },
  });

  return {
    comandas,
    openComandas,
    loadingComandas,
    refetchComandas,
    pendingApprovalsByComanda,
    useComandaDetail,
    createComanda: createComandaMutation.mutateAsync,
    isCreating: createComandaMutation.isPending,
    addItem: addItemMutation.mutateAsync,
    isAddingItem: addItemMutation.isPending,
    removeItem: removeItemMutation.mutateAsync,
    isRemovingItem: removeItemMutation.isPending,
    closeComanda: closeComandaMutation.mutateAsync,
    isClosing: closeComandaMutation.isPending,
    cancelComanda: cancelComandaMutation.mutateAsync,
    isCancelling: cancelComandaMutation.isPending,
  };
}
