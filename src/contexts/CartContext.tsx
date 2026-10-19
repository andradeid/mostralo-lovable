import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isCustomDomainHost } from '@/lib/storePath';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, initialQuantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// ---------------------------------------------------------------------------
// Persistência: o carrinho fica salvo no navegador, separado por loja, para
// sobreviver a recarregar a página, abrir por link direto ou voltar depois.
// ---------------------------------------------------------------------------
const STORAGE_PREFIX = 'mostralo_cart:';
const ACTIVE_KEY = 'mostralo_cart_active_store';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // carrinho salvo vale por 24h

const safeGet = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ }
};
const safeRemove = (key: string) => {
  try { localStorage.removeItem(key); } catch { /* armazenamento indisponível */ }
};

/** Identifica a loja pela URL; fora da vitrine (ex.: /checkout) mantém a última loja visitada. */
function storeKeyFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/loja\/([^/?#]+)/);
  if (match) return `slug:${decodeURIComponent(match[1]).toLowerCase()}`;
  if (isCustomDomainHost()) return `host:${window.location.hostname.toLowerCase()}`;
  return safeGet(ACTIVE_KEY);
}

function loadItems(storeKey: string | null): CartItem[] {
  if (!storeKey) return [];
  const raw = safeGet(STORAGE_PREFIX + storeKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { items?: CartItem[]; savedAt?: number };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      safeRemove(STORAGE_PREFIX + storeKey);
      return [];
    }
    return (parsed.items || []).filter(
      (i) => i && typeof i.id === 'string' && Number.isFinite(Number(i.price)) && Number(i.quantity) > 0
    ).map((i) => ({ ...i, price: Number(i.price), quantity: Number(i.quantity) }));
  } catch {
    return [];
  }
}

function saveItems(storeKey: string | null, items: CartItem[]) {
  if (!storeKey) return;
  if (items.length === 0) {
    safeRemove(STORAGE_PREFIX + storeKey);
  } else {
    safeSet(STORAGE_PREFIX + storeKey, JSON.stringify({ items, savedAt: Date.now() }));
  }
}

/** Ids dos itens têm o formato "<produto>_<variação>_<adicionais>"; o produto é o primeiro pedaço. */
const productIdOf = (itemId: string) => itemId.split('_')[0];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const location = useLocation();
  const storeKey = storeKeyFromPath(location.pathname);

  // Carrega de forma síncrona para o checkout não achar o carrinho vazio ao recarregar
  const [cartStoreKey, setCartStoreKey] = useState<string | null>(storeKey);
  const [items, setItems] = useState<CartItem[]>(() => loadItems(storeKey));
  const validatedKeys = useRef(new Set<string>());

  // Trocou de loja: carrega o carrinho daquela loja
  useEffect(() => {
    if (storeKey === cartStoreKey) return;
    setCartStoreKey(storeKey);
    setItems(loadItems(storeKey));
  }, [storeKey, cartStoreKey]);

  // Lembrar a loja ativa (para /checkout e outras rotas sem slug)
  useEffect(() => {
    if (cartStoreKey && (cartStoreKey.startsWith('slug:') || cartStoreKey.startsWith('host:'))) {
      safeSet(ACTIVE_KEY, cartStoreKey);
    }
  }, [cartStoreKey]);

  // Salvar a cada mudança
  useEffect(() => {
    saveItems(cartStoreKey, items);
  }, [cartStoreKey, items]);

  // Carrinho restaurado: tirar produtos que foram desativados ou excluídos desde então
  useEffect(() => {
    if (!cartStoreKey || validatedKeys.current.has(cartStoreKey) || items.length === 0) return;
    validatedKeys.current.add(cartStoreKey);
    const ids = Array.from(new Set(items.map((i) => productIdOf(i.id)).filter((id) => UUID_RE.test(id))));
    if (ids.length === 0) return;
    supabase
      .from('products')
      .select('id, is_available')
      .in('id', ids)
      .then(({ data, error }) => {
        if (error || !data) return; // sem rede: mantém como está
        const available = new Set(data.filter((p: any) => p.is_available !== false).map((p: any) => p.id));
        setItems((current) => current.filter((i) => {
          const pid = productIdOf(i.id);
          return !UUID_RE.test(pid) || available.has(pid);
        }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartStoreKey, items.length]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>, initialQuantity: number = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id);

      if (existingItem) {
        return currentItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + initialQuantity }
            : item
        );
      }

      return [...currentItems, { ...newItem, quantity: initialQuantity }];
    });
  };

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    saveItems(cartStoreKey, []);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
