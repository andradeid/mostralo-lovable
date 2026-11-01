import { useState, useEffect, useRef } from 'react';
import { StoreInfo, TotemCartItem } from '@/pages/totem/TotemPage';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, QrCode, Clock, CheckCircle, XCircle } from 'lucide-react';
import { brl } from '@/lib/brl';

interface TotemPaymentProps {
  store: StoreInfo;
  config: TotemConfig;
  cart: TotemCartItem[];
  cartTotal: number;
  customerInfo: { phone?: string; cpf?: string; name?: string };
  onBack: () => void;
  /** chargedTotal: total conferido pelo servidor (usado no recibo impresso) */
  onSuccess: (orderId: string, passwordNumber: string, chargedTotal?: number) => void;
}

type PaymentStatus = 'generating' | 'waiting' | 'checking' | 'success' | 'expired' | 'error';

export function TotemPayment({
  store,
  config,
  cart,
  cartTotal,
  customerInfo,
  onBack,
  onSuccess,
}: TotemPaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>('generating');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pixCopiaECola, setPixCopiaECola] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [chargedTotal, setChargedTotal] = useState<number>(cartTotal);
  const [timeRemaining, setTimeRemaining] = useState(config.pix_timeout_seconds || 300);
  const [error, setError] = useState<string | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);
  const chargedTotalRef = useRef<number>(cartTotal);
  chargedTotalRef.current = chargedTotal; // só repassa ao recibo; não entra na conferência do pagamento

  // Pedido criado e conferido pelo servidor (preço pelo catálogo) + Pix do valor do pedido
  useEffect(() => {
    const createOrderAndPix = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('totem-order', {
          body: {
            action: 'create',
            store_id: store.id,
            items: cart.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              addon_ids: item.addons.map(a => a.id),
              notes: item.notes || null,
            })),
            customer: { phone: customerInfo.phone || null, name: customerInfo.name || null },
          },
        });

        if (error) throw error;

        if (data?.qrcode && data?.order_id) {
          setQrCode(data.qrcode);
          setPixCopiaECola(data.pix_copia_e_cola);
          setOrderId(data.order_id);
          setChargedTotal(Number(data.total) || cartTotal);
          if (data.expires_in) setTimeRemaining(Number(data.expires_in));
          setStatus('waiting');
        } else {
          throw new Error(data?.error || 'Resposta inválida do servidor');
        }
      } catch (err) {
        console.error('Erro ao gerar PIX:', err);
        setError('Não foi possível gerar o QR Code. Tente novamente.');
        setStatus('error');
      }
    };

    createOrderAndPix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer de expiração (expirou: cancela o pedido não pago no servidor)
  useEffect(() => {
    if (status !== 'waiting') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'expired' && orderId && !finishedRef.current) {
      finishedRef.current = true;
      supabase.functions.invoke('totem-order', { body: { action: 'cancel', order_id: orderId } }).catch(() => {});
    }
  }, [status, orderId]);

  // Verificar pagamento: o servidor confere na EFI e marca o pedido como pago
  useEffect(() => {
    if (status !== 'waiting' || !orderId) return;

    const checkPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('totem-order', {
          body: { action: 'status', order_id: orderId },
        });

        if (error) throw error;

        if (data?.paid && !finishedRef.current) {
          finishedRef.current = true;
          setStatus('success');
          onSuccess(orderId, String(data.order_number), chargedTotalRef.current);
        } else if (data?.cancelled) {
          setStatus('expired');
        }
      } catch (err) {
        console.error('Erro ao verificar pagamento:', err);
      }
    };

    checkIntervalRef.current = setInterval(checkPayment, 3000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [status, orderId, onSuccess]);

  // Voltar com o Pix aberto: cancela o pedido não pago
  const handleBack = () => {
    if (orderId && status === 'waiting' && !finishedRef.current) {
      finishedRef.current = true;
      supabase.functions.invoke('totem-order', { body: { action: 'cancel', order_id: orderId } }).catch(() => {});
    }
    onBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header
        className="flex items-center gap-3 p-4 border-b"
        style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
      >
        <Button variant="ghost" size="icon" onClick={handleBack} disabled={status === 'checking'}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-lg">Pagamento PIX</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {status === 'generating' && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" style={{ color: config.theme_color }} />
            <p className="text-lg">Gerando QR Code...</p>
          </div>
        )}

        {status === 'waiting' && qrCode && (
          <div className="text-center max-w-sm">
            <div
              className="p-4 rounded-2xl mb-6 inline-block"
              style={{ backgroundColor: '#fff' }}
            >
              <img
                src={qrCode}
                alt="QR Code PIX"
                className="w-64 h-64 mx-auto"
              />
            </div>

            <div className="mb-4">
              <p className="text-xl font-bold" style={{ color: config.theme_color }}>
                {brl(chargedTotal)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
              <Clock className="h-5 w-5" />
              <span>Expira em {formatTime(timeRemaining)}</span>
            </div>

            <p className="text-sm" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
              Escaneie o QR Code com o app do seu banco para pagar
            </p>

            {pixCopiaECola && (
              <div className="mt-4">
                <p className="text-xs mb-2" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
                  Ou copie o código PIX:
                </p>
                <code
                  className="block p-2 rounded text-xs break-all"
                  style={{ backgroundColor: config.dark_mode ? '#333' : '#f3f4f6' }}
                >
                  {pixCopiaECola.substring(0, 50)}...
                </code>
              </div>
            )}
          </div>
        )}

        {status === 'checking' && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" style={{ color: config.theme_color }} />
            <p className="text-lg">Confirmando pagamento...</p>
          </div>
        )}

        {status === 'expired' && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">QR Code Expirado</p>
            <p className="text-sm mb-6" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
              O tempo para pagamento expirou
            </p>
            <Button onClick={onBack} variant="outline">
              Voltar
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Erro</p>
            <p className="text-sm mb-6" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
              {error}
            </p>
            <Button onClick={onBack} variant="outline">
              Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
