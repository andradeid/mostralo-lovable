import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Loader2, Smartphone, Wifi, WifiOff, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppNotConnectedProps {
  storeId: string;
}

export function WhatsAppNotConnected({ storeId }: WhatsAppNotConnectedProps) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [provider, setProvider] = useState<'evolution' | 'uazapi' | null>(null);
  const [connectionMode, setConnectionMode] = useState<'qrcode' | 'paircode'>('qrcode');
  const [pairingPhone, setPairingPhone] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Detectar provider da instância
  useEffect(() => {
    async function detectProvider() {
      if (!storeId) return;
      const { data } = await supabase
        .from('whatsapp_instances' as any)
        .select('provider')
        .eq('store_id', storeId)
        .limit(1);

      if (data && data.length > 0) {
        setProvider((data[0] as any).provider || 'evolution');
      }
    }
    detectProvider();
  }, [storeId]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Timer expirou, limpar códigos
          setQrCode(null);
          setPairCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Polling para verificar status quando conectando
  useEffect(() => {
    if (status !== 'connecting') return;

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        if (provider === 'uazapi') {
          // Verificar status via uazapi-manage
          const response = await supabase.functions.invoke('uazapi-manage', {
            body: { action: 'instance_status', store_id: storeId },
          });
          if (response.data?.status === 'connected') {
            setStatus('connected');
            setQrCode(null);
            setPairCode(null);
            setCountdown(0);
            toast.success('WhatsApp conectado com sucesso!');
            setTimeout(() => window.location.reload(), 1500);
          }
        } else {
          // Evolution API
          const response = await supabase.functions.invoke('whatsapp-instance', {
            body: { action: 'status', storeId },
          });
          if (response.data?.status === 'connected') {
            setStatus('connected');
            setQrCode(null);
            setPairCode(null);
            setCountdown(0);
            toast.success('WhatsApp conectado com sucesso!');
            setTimeout(() => window.location.reload(), 1500);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, storeId, provider]);

  // Conectar via Evolution API
  const handleConnectEvolution = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('whatsapp-instance', {
        body: { action: 'connect', storeId },
      });

      if (response.error) throw response.error;
      const result = response.data;

      if (result?.success && result?.qrcode) {
        setQrCode(result.qrcode);
        setStatus('connecting');
        setCountdown(120);
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
      } else if (result?.status === 'connected') {
        setStatus('connected');
        toast.success('WhatsApp já está conectado!');
        setTimeout(() => window.location.reload(), 1500);
      } else if (result?.error?.includes('not found') || result?.error?.includes('não encontrada')) {
        const createResponse = await supabase.functions.invoke('whatsapp-instance', {
          body: { action: 'create', storeId },
        });
        if (createResponse.error) throw createResponse.error;
        const createResult = createResponse.data;
        if (createResult?.success && createResult?.qrcode) {
          setQrCode(createResult.qrcode);
          setStatus('connecting');
          setCountdown(120);
          toast.success('Instância criada! Escaneie o QR Code.');
        } else if (createResult?.success) {
          const connectResponse = await supabase.functions.invoke('whatsapp-instance', {
            body: { action: 'connect', storeId },
          });
          if (connectResponse.data?.qrcode) {
            setQrCode(connectResponse.data.qrcode);
            setStatus('connecting');
            setCountdown(120);
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao conectar WhatsApp:', error);
      toast.error(error.message || 'Erro ao conectar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Conectar via UaZapi
  const handleConnectUazapi = async (phone?: string) => {
    setLoading(true);
    try {
      const invokeBody: any = { action: 'connect_instance', store_id: storeId };
      if (phone?.trim()) {
        invokeBody.phone = phone.trim();
      }

      const response = await supabase.functions.invoke('uazapi-manage', {
        body: invokeBody,
      });

      if (response.error) throw response.error;
      const result = response.data;

      if (result?.success && (result.qrcode || result.paircode)) {
        setQrCode(result.qrcode || null);
        setPairCode(result.paircode || null);
        setStatus('connecting');
        const timeout = result.paircode ? 300 : 120;
        setCountdown(timeout);
        toast.success(
          result.paircode
            ? `Código de pareamento gerado: ${result.paircode}`
            : 'QR Code gerado! Escaneie com seu WhatsApp.'
        );
      } else if (result?.status === 'connected') {
        setStatus('connected');
        toast.success('WhatsApp já está conectado!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(result?.error || 'Não foi possível gerar código de conexão');
      }
    } catch (error: any) {
      console.error('Erro ao conectar WhatsApp:', error);
      toast.error(error.message || 'Erro ao conectar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (provider === 'uazapi') {
      if (connectionMode === 'paircode') {
        handleConnectUazapi(pairingPhone);
      } else {
        handleConnectUazapi();
      }
    } else {
      handleConnectEvolution();
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isUazapi = provider === 'uazapi';

  return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)]">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            {status === 'connecting' ? (
              <Wifi className="w-8 h-8 text-primary animate-pulse" />
            ) : (
              <WifiOff className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-xl">WhatsApp não conectado</CardTitle>
          <CardDescription>
            Conecte o WhatsApp para começar a atender seus clientes por aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status conectado */}
          {status === 'connected' && (
            <div className="flex flex-col items-center gap-2 text-primary">
              <Smartphone className="w-10 h-10" />
              <p className="font-medium">Conectado com sucesso!</p>
              <p className="text-sm text-muted-foreground">Redirecionando para o chat...</p>
            </div>
          )}

          {/* Modo de conexão - UaZapi mostra toggle QR/Pareamento */}
          {status !== 'connected' && isUazapi && (
            <div className="space-y-4">
              {/* Toggle QR Code / Pareamento */}
              <div className="flex gap-2 w-full">
                <Button
                  variant={connectionMode === 'qrcode' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs gap-1"
                  onClick={() => {
                    setConnectionMode('qrcode');
                    setPairCode(null);
                  }}
                  disabled={loading}
                >
                  <QrCode className="w-3 h-3" />
                  QR Code
                </Button>
                <Button
                  variant={connectionMode === 'paircode' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs gap-1"
                  onClick={() => {
                    setConnectionMode('paircode');
                    setQrCode(null);
                  }}
                  disabled={loading}
                >
                  <Hash className="w-3 h-3" />
                  Pareamento
                </Button>
              </div>

              {/* Input telefone para pareamento */}
              {connectionMode === 'paircode' && !pairCode && (
                <div className="flex gap-2">
                  <Input
                    placeholder="5511999999999"
                    value={pairingPhone}
                    onChange={(e) => setPairingPhone(e.target.value)}
                    className="text-sm"
                    disabled={loading}
                  />
                  <Button
                    onClick={() => handleConnectUazapi(pairingPhone)}
                    disabled={loading || !pairingPhone.trim()}
                    size="sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar'}
                  </Button>
                </div>
              )}

              {/* Código de Pareamento */}
              {pairCode && (
                <div className="bg-muted p-4 rounded-lg text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Digite este código no WhatsApp:</p>
                  <p className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-primary">
                    {pairCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar aparelho → Conectar com número de telefone
                  </p>
                  {countdown > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Expira em <span className="font-mono font-semibold">{formatCountdown(countdown)}</span>
                    </p>
                  )}
                </div>
              )}

              {/* QR Code */}
              {qrCode && !pairCode && (
                <div className="flex flex-col items-center gap-3">
                  <div className="border-2 border-primary/20 rounded-xl p-3 bg-white">
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  {countdown > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Expira em <span className="font-mono font-semibold">{formatCountdown(countdown)}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Abra o WhatsApp no seu celular → Menu (⋮) → Aparelhos conectados → Conectar aparelho → Escaneie este QR Code
                  </p>
                </div>
              )}

              {/* Botão Gerar QR (modo qrcode, sem código ainda) */}
              {connectionMode === 'qrcode' && !qrCode && !pairCode && (
                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  Gerar QR Code
                </Button>
              )}

              {/* Loading indicator quando conectando */}
              {status === 'connecting' && (qrCode || pairCode) && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Aguardando conexão...</span>
                </div>
              )}
            </div>
          )}

          {/* Evolution API - fluxo original */}
          {status !== 'connected' && !isUazapi && (
            <>
              {qrCode && status === 'connecting' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="border-2 border-primary/20 rounded-xl p-3 bg-white">
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aguardando leitura do QR Code...</span>
                  </div>
                  {countdown > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Expira em <span className="font-mono font-semibold">{formatCountdown(countdown)}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Abra o WhatsApp no seu celular → Menu (⋮) → Aparelhos conectados → Conectar aparelho → Escaneie este QR Code
                  </p>
                </div>
              )}

              {status === 'idle' && (
                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  Conectar WhatsApp
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
