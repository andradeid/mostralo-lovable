import { useState, useEffect, useRef } from 'react';
import { StoreInfo, TotemCartItem } from '@/pages/totem/TotemPage';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, QrCode, Clock, CheckCircle, XCircle } from 'lucide-react';
import { assignCustomerLabel } from '@/utils/customerLabelUtils';

interface TotemPaymentProps {
  store: StoreInfo;
  config: TotemConfig;
  cart: TotemCartItem[];
  cartTotal: number;
  customerInfo: { phone?: string; cpf?: string; name?: string };
  onBack: () => void;
  onSuccess: (orderId: string, passwordNumber: string) => void;
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
  const [txid, setTxid] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(config.pix_timeout_seconds || 300);
  const [error, setError] = useState<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gerar cobrança PIX
  useEffect(() => {
    const generatePix = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('efi-create-pix-charge', {
          body: {
            valor: cartTotal.toFixed(2),
            descricao: `Pedido Totem - ${store.name}`,
            expiracao: config.pix_timeout_seconds || 300,
          },
        });

        if (error) throw error;

        if (data?.qrcode && data?.txid) {
          setQrCode(data.qrcode);
          setPixCopiaECola(data.pix_copia_e_cola);
          setTxid(data.txid);
          setStatus('waiting');
        } else {
          throw new Error('Resposta inválida do servidor');
        }
      } catch (err) {
        console.error('Erro ao gerar PIX:', err);
        setError('Não foi possível gerar o QR Code. Tente novamente.');
        setStatus('error');
      }
    };

    generatePix();
  }, [cartTotal, store.name, config.pix_timeout_seconds]);

  // Timer de expiração
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

  // Verificar status do pagamento
  useEffect(() => {
    if (status !== 'waiting' || !txid) return;

    const checkPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('efi-check-pix-status', {
          body: { txid },
        });

        if (error) throw error;

        if (data?.status === 'CONCLUIDA' || data?.status === 'paid') {
          setStatus('checking');
          await createOrder();
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
  }, [status, txid]);

  // Criar pedido após pagamento confirmado
  const createOrder = async () => {
    try {
      // Gerar número do pedido/senha
      const { data: orderNumberData } = await supabase.rpc('get_next_order_number', {
        store_uuid: store.id,
      });

      const orderNumber = orderNumberData || `T${Date.now().toString().slice(-4)}`;

      // Criar pedido
      const orderItems = cart.map(item => ({
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: (item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity,
        notes: item.notes || null,
        addons: item.addons.length > 0 ? item.addons : null,
      }));

      // Buscar ou criar cliente para aplicar etiqueta
      let customerId: string | null = null;
      if (customerInfo.phone) {
        const normalizedPhone = customerInfo.phone.replace(/\D/g, '');
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', normalizedPhone)
          .maybeSingle();
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
              name: customerInfo.name || 'Cliente Totem',
              phone: normalizedPhone,
            })
            .select('id')
            .single();
          customerId = newCustomer?.id || null;
        }
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          store_id: store.id,
          order_number: orderNumber,
          status: 'em_preparo',
          total: cartTotal,
          subtotal: cartTotal,
          customer_id: customerId,
          customer_name: customerInfo.name || null,
          customer_phone: customerInfo.phone || null,
          order_type: 'local',
          source: 'totem',
          items: orderItems,
          payment_method: 'pix',
          payment_status: 'paid',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Aplicar etiqueta "Totem" ao cliente
      if (customerId) {
        await assignCustomerLabel(customerId, store.id, 'Totem');
      }

      // Criar chamada de senha
      const { error: passwordError } = await supabase
        .from('password_calls')
        .insert({
          store_id: store.id,
          order_id: orderData.id,
          call_number: orderNumber,
          customer_name: customerInfo.name || 'Totem',
          status: 'waiting',
        });

      if (passwordError) {
        console.error('Erro ao criar senha:', passwordError);
      }

      setStatus('success');
      onSuccess(orderData.id, orderNumber);
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      setError('Pagamento confirmado, mas houve erro ao criar pedido.');
      setStatus('error');
    }
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
        <Button variant="ghost" size="icon" onClick={onBack} disabled={status === 'checking'}>
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
                R$ {cartTotal.toFixed(2)}
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
