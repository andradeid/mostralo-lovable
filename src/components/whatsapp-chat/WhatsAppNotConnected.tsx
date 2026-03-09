import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Loader2, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';


interface WhatsAppNotConnectedProps {
  storeId: string;
}

export function WhatsAppNotConnected({ storeId }: WhatsAppNotConnectedProps) {
  
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');

  // Polling para verificar status quando conectando
  useEffect(() => {
    if (status !== 'connecting') return;

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await supabase.functions.invoke('whatsapp-instance', {
          body: { action: 'status', storeId },
        });

        if (response.data?.status === 'connected') {
          setStatus('connected');
          setQrCode(null);
          toast.success('WhatsApp conectado com sucesso!');
          // Recarregar a página para mostrar o chat
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, storeId]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Tentar conectar (ou criar se não existir)
      const response = await supabase.functions.invoke('whatsapp-instance', {
        body: { action: 'connect', storeId },
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (result?.success && result?.qrcode) {
        setQrCode(result.qrcode);
        setStatus('connecting');
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
      } else if (result?.status === 'connected') {
        setStatus('connected');
        toast.success('WhatsApp já está conectado!');
        setTimeout(() => window.location.reload(), 1500);
      } else if (result?.error?.includes('not found') || result?.error?.includes('não encontrada')) {
        // Instância não existe, tentar criar
        const createResponse = await supabase.functions.invoke('whatsapp-instance', {
          body: { action: 'create', storeId },
        });

        if (createResponse.error) throw createResponse.error;

        const createResult = createResponse.data;
        if (createResult?.success && createResult?.qrcode) {
          setQrCode(createResult.qrcode);
          setStatus('connecting');
          toast.success('Instância criada! Escaneie o QR Code.');
        } else if (createResult?.success) {
          // Criou mas sem QR Code, tentar connect
          const connectResponse = await supabase.functions.invoke('whatsapp-instance', {
            body: { action: 'connect', storeId },
          });
          if (connectResponse.data?.qrcode) {
            setQrCode(connectResponse.data.qrcode);
            setStatus('connecting');
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
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Abra o WhatsApp no seu celular → Menu (⋮) → Aparelhos conectados → Conectar aparelho → Escaneie este QR Code
              </p>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col items-center gap-2 text-primary">
              <Smartphone className="w-10 h-10" />
              <p className="font-medium">Conectado com sucesso!</p>
              <p className="text-sm text-muted-foreground">Redirecionando para o chat...</p>
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
        </CardContent>
      </Card>
    </div>
  );
}