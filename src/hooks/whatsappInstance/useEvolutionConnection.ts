// Conexão Evolution (legado): criar, conectar e status.
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";

export type UseEvolutionConnectionDeps = { [K in 'storeId' | 'toast' | 'instance' | 'setInstance' | 'setActionLoading' | 'setQrCode' | 'setPairCode' | 'setQrCountdown']: any };

export function useEvolutionConnection(deps: UseEvolutionConnectionDeps) {
  const { storeId, toast, instance, setInstance, setActionLoading, setQrCode, setPairCode, setQrCountdown } = deps;
  const callInstanceFunction = async (action: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const response = await supabase.functions.invoke('whatsapp-instance', {
      body: { action, storeId },
    });

    if (response.error) throw response.error;
    return response.data;
  };

  const createInstance = async () => {
    setActionLoading('create');
    try {
      const result = await callInstanceFunction('create');
      
      if (result.success) {
        setInstance(result.instance);
        setQrCode(result.qrcode);
        toast({
          title: "Instância Criada",
          description: "Escaneie o QR Code para conectar seu WhatsApp",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar instância",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const connectInstance = async () => {
    setActionLoading('connect');
    try {
      const result = await callInstanceFunction('connect');
      
      if (result.success && result.qrcode) {
        setQrCode(result.qrcode);
        setPairCode(null);
        setQrCountdown(120); // 2 min para Evolution QR
        setInstance((prev: any) => ({ ...prev, status: 'connecting' }));
        toast({
          title: "QR Code Gerado",
          description: "Escaneie o QR Code com seu WhatsApp",
        });
      } else if (result.status === 'connected') {
        setInstance((prev: any) => ({ ...prev, status: 'connected' }));
        setQrCode(null);
        toast({
          title: "Conectado!",
          description: "WhatsApp já está conectado",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar QR Code",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const checkStatus = async () => {
    try {
      const result = await callInstanceFunction('status');
      
      if (result.success) {
        setInstance(result.instance);
        if (result.status === 'connected') {
          setQrCode(null);
          setPairCode(null);
          setQrCountdown(0);
          toast({
            title: "Conectado!",
            description: "WhatsApp conectado com sucesso",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  return {
    callInstanceFunction,
    createInstance,
    connectInstance,
    checkStatus,
  };
}
