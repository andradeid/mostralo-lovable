import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { useCheckSalesChannel } from '@/hooks/useCheckSalesChannel';
import { Loader2 } from 'lucide-react';
import { TotemWelcome } from '@/components/totem/TotemWelcome';
import { TotemProducts } from '@/components/totem/TotemProducts';
import { TotemCart } from '@/components/totem/TotemCart';
import { TotemPayment } from '@/components/totem/TotemPayment';
import { TotemConfirmation } from '@/components/totem/TotemConfirmation';
import { TotemInactivityWarning } from '@/components/totem/TotemInactivityWarning';
import { SalesChannelPausedBanner } from '@/components/shared/SalesChannelPausedBanner';

export interface TotemCartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  notes: string;
  addons: Array<{ id: string; name: string; price: number }>;
}

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

type TotemStep = 'welcome' | 'products' | 'cart' | 'payment' | 'confirmation';

export default function TotemPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [config, setConfig] = useState<TotemConfig | null>(null);
  const [step, setStep] = useState<TotemStep>('welcome');
  const [cart, setCart] = useState<TotemCartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<{ phone?: string; cpf?: string; name?: string }>({});
  const [orderId, setOrderId] = useState<string | null>(null);
  const [passwordNumber, setPasswordNumber] = useState<string | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Verificar se o canal totem está ativo
  const { isEnabled: isTotemEnabled, isLoading: isChannelLoading, message: channelMessage } = useCheckSalesChannel(store?.id, 'totem_enabled');
  const salesPaused = !isTotemEnabled;

  // Buscar dados da loja e configuração
  useEffect(() => {
    const fetchData = async () => {
      if (!storeSlug) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }

      try {
        // Buscar loja
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, slug, logo_url')
          .eq('slug', storeSlug)
          .single();

        if (storeError || !storeData) {
          setError('Loja não encontrada');
          setLoading(false);
          return;
        }

        setStore(storeData);

        // Buscar configuração do totem
        const { data: configData } = await supabase
          .from('store_totem_config')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_enabled', true)
          .maybeSingle();

        if (!configData) {
          setError('Totem não está ativo para esta loja');
          setLoading(false);
          return;
        }

        setConfig(configData as TotemConfig);
      } catch (err) {
        console.error('Erro ao carregar totem:', err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeSlug]);

  // Timer de inatividade
  useEffect(() => {
    if (!config || step === 'welcome' || step === 'confirmation') return;

    const warningTime = (config.inactivity_timeout_seconds - (config.inactivity_warning_seconds || 30)) * 1000;
    const resetTime = config.inactivity_timeout_seconds * 1000;

    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= resetTime) {
        // Reset para tela inicial
        handleReset();
      } else if (elapsed >= warningTime) {
        setShowInactivityWarning(true);
      }
    };

    const interval = setInterval(checkInactivity, 1000);
    return () => clearInterval(interval);
  }, [config, step, lastActivity]);

  // Registrar atividade
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowInactivityWarning(false);
  }, []);

  // Event listeners para atividade
  useEffect(() => {
    const events = ['touchstart', 'mousedown', 'keydown'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => events.forEach(event => window.removeEventListener(event, handleActivity));
  }, [handleActivity]);

  // Reset completo
  const handleReset = () => {
    setStep('welcome');
    setCart([]);
    setCustomerInfo({});
    setOrderId(null);
    setPasswordNumber(null);
    setShowInactivityWarning(false);
    setLastActivity(Date.now());
  };

  // Adicionar item ao carrinho
  const addToCart = (item: TotemCartItem) => {
    setCart(prev => {
      const existing = prev.find(
        i => i.product_id === item.product_id && 
             i.notes === item.notes && 
             JSON.stringify(i.addons) === JSON.stringify(item.addons)
      );
      if (existing) {
        return prev.map(i =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
    handleActivity();
  };

  // Atualizar quantidade
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.id !== itemId));
    } else {
      setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
    }
    handleActivity();
  };

  // Remover item
  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
    handleActivity();
  };

  // Calcular total
  const cartTotal = cart.reduce((sum, item) => {
    const addonsTotal = item.addons.reduce((a, addon) => a + addon.price, 0);
    return sum + (item.price + addonsTotal) * item.quantity;
  }, 0);

  // Estilos do tema
  const themeStyles = config ? {
    '--totem-primary': config.theme_color,
    '--totem-bg': config.dark_mode ? '#1a1a1a' : config.background_color,
    '--totem-text': config.dark_mode ? '#ffffff' : '#1a1a1a',
    '--totem-muted': config.dark_mode ? '#a1a1a1' : '#6b7280',
  } as React.CSSProperties : {};

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !store || !config) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">Totem Indisponível</h1>
        <p className="text-muted-foreground text-center">{error || 'Não foi possível carregar o totem'}</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{
        ...themeStyles,
        backgroundColor: 'var(--totem-bg)',
        color: 'var(--totem-text)',
      }}
    >
      {/* Banner de vendas pausadas */}
      {salesPaused && step !== 'welcome' && (
        <SalesChannelPausedBanner message={channelMessage} className="rounded-none border-x-0 border-t-0" />
      )}

      {step === 'welcome' && (
        <TotemWelcome
          store={store}
          config={config}
          onStart={() => {
            handleActivity();
            setStep('products');
          }}
        />
      )}

      {step === 'products' && (
        <TotemProducts
          store={store}
          config={config}
          cart={cart}
          cartTotal={cartTotal}
          onAddToCart={addToCart}
          onViewCart={() => setStep('cart')}
          onBack={handleReset}
          salesPaused={salesPaused}
        />
      )}

      {step === 'cart' && (
        <TotemCart
          store={store}
          config={config}
          cart={cart}
          cartTotal={cartTotal}
          customerInfo={customerInfo}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onUpdateCustomerInfo={setCustomerInfo}
          onBack={() => setStep('products')}
          onCheckout={() => setStep('payment')}
          salesPaused={salesPaused}
        />
      )}

      {step === 'payment' && (
        <TotemPayment
          store={store}
          config={config}
          cart={cart}
          cartTotal={cartTotal}
          customerInfo={customerInfo}
          onBack={() => setStep('cart')}
          onSuccess={(newOrderId, password) => {
            setOrderId(newOrderId);
            setPasswordNumber(password);
            setStep('confirmation');
          }}
        />
      )}

      {step === 'confirmation' && passwordNumber && (
        <TotemConfirmation
          store={store}
          config={config}
          orderId={orderId}
          passwordNumber={passwordNumber}
          cartTotal={cartTotal}
          cart={cart}
          onNewOrder={handleReset}
        />
      )}

      {showInactivityWarning && (
        <TotemInactivityWarning
          secondsRemaining={config.inactivity_warning_seconds || 30}
          onContinue={handleActivity}
          onCancel={handleReset}
        />
      )}
    </div>
  );
}
