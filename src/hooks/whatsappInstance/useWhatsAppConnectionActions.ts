// Ações da conexão (desconectar, remover, reiniciar), polling, contagem e QR automático.
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractFunctionError } from "@/lib/whatsappInstance/functionErrors";

export type UseWhatsAppConnectionActionsDeps = { [K in 'storeId' | 'toast' | 'instance' | 'setInstance' | 'actionLoading' | 'setActionLoading' | 'qrCode' | 'setQrCode' | 'pairCode' | 'setPairCode' | 'connectionMode' | 'pairingPhone' | 'qrCountdown' | 'setQrCountdown' | 'autoQrTriedRef' | 'connectUazapiInstance' | 'checkUazapiStatus' | 'callInstanceFunction' | 'connectInstance' | 'checkStatus']: any };

export function useWhatsAppConnectionActions(deps: UseWhatsAppConnectionActionsDeps) {
  const { storeId, toast, instance, setInstance, actionLoading, setActionLoading, qrCode, setQrCode, pairCode, setPairCode, connectionMode, pairingPhone, qrCountdown, setQrCountdown, autoQrTriedRef, connectUazapiInstance, checkUazapiStatus, callInstanceFunction, connectInstance, checkStatus } = deps;
  // Polling para verificar status quando conectando
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (instance?.status === 'connecting') {
      interval = setInterval(() => {
        handleCheckStatus();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [instance?.status]);

  // Countdown timer para QR code / pairing code
  useEffect(() => {
    if (qrCountdown <= 0) return;
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrCountdown > 0]);

  // Auto regenerar quando timer expirar
  useEffect(() => {
    if (qrCountdown === 0 && (qrCode || pairCode) && instance?.status !== 'connected') {
      // Timer expirou, regenerar
      if (isUazapiInstance) {
        connectUazapiInstance(connectionMode === 'paircode' ? pairingPhone : undefined);
      } else {
        connectInstance();
      }
    }
  }, [qrCountdown]);

  // Ao abrir a tela (ou logo após criar a conexão) sem WhatsApp conectado: já mostra o QR Code,
  // sem precisar de um segundo clique. Uma tentativa por visita; se falhar, fica o botão manual.
  useEffect(() => {
    if (autoQrTriedRef.current || !instance || instance.provider !== 'uazapi') return;
    if (instance.status === 'connected' || instance.status === 'banned') return;
    if (qrCode || pairCode || connectionMode !== 'qrcode' || actionLoading) return;
    autoQrTriedRef.current = true;
    connectUazapiInstance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance?.id, instance?.status, instance?.provider]);

  // Determinar se a instância é UaZapi
  const isUazapiInstance = instance?.provider === 'uazapi';

  // Funções que delegam para o provedor correto
  const handleConnect = (phone?: string) => {
    if (isUazapiInstance) {
      connectUazapiInstance(phone);
    } else {
      connectInstance();
    }
  };

  const handleCheckStatus = () => {
    if (isUazapiInstance) {
      checkUazapiStatus();
    } else {
      checkStatus();
    }
  };

  const disconnectInstance = async () => {
    setActionLoading('disconnect');
    try {
      let result;
      if (isUazapiInstance) {
        const response = await supabase.functions.invoke('uazapi-manage', {
          body: { action: 'disconnect_instance', store_id: storeId },
        });
        if (response.error) throw response.error;
        result = response.data;
      } else {
        result = await callInstanceFunction('disconnect');
      }
      
      if (result.success) {
        setInstance((prev: any) => ({ ...prev, status: 'disconnected' }));
        setQrCode(null);
        setPairCode(null);
        setQrCountdown(0);
        toast({
          title: "Desconectado",
          description: "WhatsApp desconectado com sucesso. Gere um novo QR Code ou Código de Pareamento para reconectar.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desconectar",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteInstance = async () => {
    setActionLoading('delete');
    try {
      let result: any;
      if (isUazapiInstance) {
        // Apaga no servidor do WhatsApp e no banco (antes só tirava do banco e a conexão ficava órfã)
        const response = await supabase.functions.invoke('uazapi-instance-admin', {
          body: { action: 'delete_instance', store_id: storeId },
        });
        if (response.error) {
          throw new Error(await extractFunctionError(response.error, response.data, 'Erro ao remover a conexão'));
        }
        result = response.data;
      } else {
        result = await callInstanceFunction('delete');
      }
      
      if (result?.success) {
        setInstance(null);
        setQrCode(null);
        setPairCode(null);
        setQrCountdown(0);
        autoQrTriedRef.current = false;
        toast({
          title: "Conexão removida",
          description: "Para usar de novo, é só tocar em Conectar.",
        });
      } else {
        throw new Error(result?.error || 'Erro ao remover a conexão');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover instância",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const restartInstance = async () => {
    setActionLoading('restart');
    try {
      let result;
      if (isUazapiInstance) {
        const response = await supabase.functions.invoke('uazapi-manage', {
          body: { action: 'restart_instance', store_id: storeId },
        });
        if (response.error) throw response.error;
        result = response.data;
      } else {
        result = await callInstanceFunction('restart');
      }
      
      if (result.success) {
        toast({
          title: "Reiniciando...",
          description: "A instância está sendo reiniciada. Aguarde alguns segundos.",
        });
        setTimeout(() => {
          if (isUazapiInstance) {
            checkUazapiStatus();
          } else {
            checkStatus();
          }
        }, 5000);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reiniciar instância",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return {
    isUazapiInstance,
    handleConnect,
    handleCheckStatus,
    disconnectInstance,
    deleteInstance,
    restartInstance,
  };
}
