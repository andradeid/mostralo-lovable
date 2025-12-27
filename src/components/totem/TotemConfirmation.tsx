import { useState, useEffect } from 'react';
import { StoreInfo, TotemCartItem } from '@/pages/totem/TotemPage';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { Button } from '@/components/ui/button';
import { CheckCircle, RotateCcw } from 'lucide-react';

interface TotemConfirmationProps {
  store: StoreInfo;
  config: TotemConfig;
  orderId: string | null;
  passwordNumber: string;
  cartTotal: number;
  cart: TotemCartItem[];
  onNewOrder: () => void;
}

export function TotemConfirmation({
  store,
  config,
  orderId,
  passwordNumber,
  cartTotal,
  cart,
  onNewOrder,
}: TotemConfirmationProps) {
  const [timeRemaining, setTimeRemaining] = useState(config.password_display_duration_seconds || 15);

  // Timer para voltar à tela inicial
  useEffect(() => {
    if (timeRemaining <= 0) {
      onNewOrder();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, onNewOrder]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      {/* Ícone de Sucesso */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${config.theme_color}20` }}
      >
        <CheckCircle
          className="h-16 w-16"
          style={{ color: config.theme_color }}
        />
      </div>

      {/* Mensagem */}
      <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
      <p className="text-lg mb-8" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
        Pagamento realizado com sucesso
      </p>

      {/* Número da Senha */}
      <div
        className="p-8 rounded-2xl mb-8"
        style={{ backgroundColor: config.theme_color }}
      >
        <p className="text-white text-lg mb-2">Sua senha é</p>
        <p className="text-white text-6xl font-bold">{passwordNumber}</p>
      </div>

      <p className="mb-2" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
        Aguarde ser chamado no painel
      </p>

      {/* Resumo do Pedido */}
      {config.show_order_summary_on_confirmation && (
        <div
          className="w-full max-w-sm p-4 rounded-xl border mb-8"
          style={{
            borderColor: config.dark_mode ? '#333' : '#e5e7eb',
            backgroundColor: config.dark_mode ? '#262626' : '#fff',
          }}
        >
          <h3 className="font-semibold mb-3">Resumo do Pedido</h3>
          <div className="space-y-2 text-sm">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>R$ {((item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div
              className="flex justify-between font-bold pt-2 border-t"
              style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
            >
              <span>Total</span>
              <span style={{ color: config.theme_color }}>R$ {cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Timer e Botão */}
      <div className="space-y-4">
        <p className="text-sm" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
          Voltando em {timeRemaining}s...
        </p>
        <Button
          onClick={onNewOrder}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Novo Pedido
        </Button>
      </div>
    </div>
  );
}
