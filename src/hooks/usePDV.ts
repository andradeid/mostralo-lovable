import { useState, useCallback, useRef, useMemo } from 'react';
import { useComandas, CreateComandaInput, AddItemInput, CloseComandaInput, Comanda, ComandaItem } from './useComandas';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lastCartItem, mergeScannedItem } from '@/lib/pdv/cartScan';

export interface CartItem {
  id: string;
  product_id?: string;
  product_name: string;
  image_url?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  addons?: Record<string, any>;
  notes?: string;
  /** Código de barras do produto (só na tela: coluna Código do modo Lista). */
  barcode?: string | null;
  /** Produto vendido por quilo: peso em kg (só na tela; no banco vai no nome do item). */
  weight_kg?: number;
  /** Preço do kg usado no cálculo (só na tela). */
  price_per_kg?: number;
  /** Ordem do último toque: define o "último item" (modo Lista, F2, Delete). */
  touched?: number;
}

export function usePDV() {
  const { toast } = useToast();
  const { createComanda, addItem, closeComanda, isCreating, isAddingItem, isClosing } = useComandas();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const touchRef = useRef(0);
  const nextTouch = () => ++touchRef.current;

  // Adicionar item ao carrinho
  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'total_price'>) => {
    const newItem: CartItem = {
      ...item,
      id: crypto.randomUUID(),
      total_price: item.unit_price * item.quantity,
      touched: nextTouch(),
    };

    setCart(prev => [...prev, newItem]);
  }, []);

  // Leitor de código de barras: o mesmo produto lido de novo soma na linha que já está no carrinho
  const addScannedToCart = useCallback((item: Omit<CartItem, 'id' | 'total_price'>) => {
    const stamp = nextTouch();
    setCart(prev => mergeScannedItem(prev, item, () => crypto.randomUUID(), stamp));
  }, []);

  // Troca uma linha inteira (ex.: pesar de novo um item por quilo), mantendo a posição
  const replaceCartItem = useCallback((itemId: string, item: Omit<CartItem, 'id' | 'total_price'>) => {
    const stamp = nextTouch();
    setCart(prev => prev.map(line => line.id === itemId
      ? { ...item, id: itemId, total_price: item.unit_price * item.quantity, touched: stamp }
      : line));
  }, []);

  // Atualizar quantidade de item no carrinho
  const updateCartItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
      return;
    }

    const stamp = nextTouch();
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total_price: item.unit_price * quantity,
          touched: stamp,
        };
      }
      return item;
    }));
  }, []);

  // Remover item do carrinho
  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Último item mexido (modo Lista em destaque, F2 e Delete)
  const lastItem = useMemo(() => lastCartItem(cart), [cart]);

  const removeLastItem = useCallback(() => {
    setCart(prev => {
      const last = lastCartItem(prev);
      return last ? prev.filter(item => item.id !== last.id) : prev;
    });
  }, []);

  // Calcular subtotal (em centavos para não acumular erro de ponto flutuante)
  const subtotal = Math.round(cart.reduce((acc, item) => acc + item.total_price * 100, 0)) / 100;

  // Tipo de retorno para impressão
  interface FinalizeSaleResult {
    comanda: Comanda;
    items: ComandaItem[];
  }

  // Finalizar venda (venda rápida de balcão)
  const finalizeSale = useCallback(async (paymentMethod: string, discount: number = 0, paymentDetails?: Record<string, any>): Promise<FinalizeSaleResult | null> => {
    if (cart.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione itens ao carrinho antes de finalizar.',
        variant: 'destructive',
      });
      return null;
    }

    setIsProcessing(true);

    try {
      // 1. Criar comanda de balcão
      const comanda = await createComanda({
        type: 'balcao',
      });

      if (!comanda) throw new Error('Falha ao criar comanda');

      // 2. Adicionar todos os itens
      for (const item of cart) {
        await addItem({
          comanda_id: comanda.id,
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          addons: item.addons,
          notes: item.notes,
        });
      }

      // 3. Fechar comanda
      await closeComanda({
        comanda_id: comanda.id,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        discount,
      });

      // 4. Buscar a comanda atualizada com totais corretos
      const { data: updatedComanda } = await supabase
        .from('comandas')
        .select('*')
        .eq('id', comanda.id)
        .single();

      // 5. Buscar itens criados para impressão
      const { data: createdItems } = await supabase
        .from('comanda_items')
        .select('*')
        .eq('comanda_id', comanda.id);

      // 6. Limpar carrinho
      clearCart();

      toast({
        title: 'Venda finalizada',
        description: `Venda #${comanda.number} concluída com sucesso!`,
      });

      return {
        comanda: (updatedComanda || comanda) as Comanda,
        items: (createdItems || []) as ComandaItem[],
      };
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      const msg = (error as { message?: string })?.message || '';
      toast({
        title: 'Erro',
        description: msg.includes('caixa') ? msg : 'Não foi possível finalizar a venda.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [cart, createComanda, addItem, closeComanda, clearCart, toast]);

  // Abrir comanda de mesa (não finaliza automaticamente)
  const openTableComanda = useCallback(async (tableNumber: string, customerName?: string) => {
    try {
      const comanda = await createComanda({
        type: 'mesa',
        table_number: tableNumber,
        customer_name: customerName,
      });

      return comanda;
    } catch (error) {
      console.error('Erro ao abrir comanda de mesa:', error);
      return null;
    }
  }, [createComanda]);

  return {
    cart,
    subtotal,
    cartItemsCount: cart.length,
    addToCart,
    addScannedToCart,
    replaceCartItem,
    updateCartItemQuantity,
    removeFromCart,
    lastItem,
    removeLastItem,
    clearCart,
    finalizeSale,
    openTableComanda,
    isProcessing: isProcessing || isCreating || isAddingItem || isClosing,
  };
}
