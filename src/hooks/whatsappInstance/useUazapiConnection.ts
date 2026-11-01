// Conexão UaZapi: criar, conectar (QR/pareamento), status e webhook.
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";
import { extractFunctionError } from "@/lib/whatsappInstance/functionErrors";

export type UseUazapiConnectionDeps = { [K in 'storeId' | 'toast' | 'setInstance' | 'storeName' | 'storeSlug' | 'fetchInstance' | 'setActionLoading' | 'setQrCode' | 'setPairCode' | 'setQrCountdown' | 'setUazapiCreating' | 'autoQrTriedRef']: any };

export function useUazapiConnection(deps: UseUazapiConnectionDeps) {
  const { storeId, toast, setInstance, storeName, storeSlug, fetchInstance, setActionLoading, setQrCode, setPairCode, setQrCountdown, setUazapiCreating, autoQrTriedRef } = deps;
  const createUazapiInstance = async () => {
    setUazapiCreating(true);
    try {
      const instanceName = `${storeSlug || storeName || 'loja'}-mostralo`.replace(/\s+/g, '-').toLowerCase();
      
      const response = await supabase.functions.invoke('uazapi-manage', {
        body: { 
          action: 'create_instance', 
          instance_name: instanceName,
          store_id: storeId,
        },
      });

      if (response.error) throw response.error;
      const result = response.data;

      if (result?.success) {
        toast({
          title: "Quase lá!",
          description: 'Gerando o QR Code para você ler com o WhatsApp do celular.',
        });
        // Carrega a conexão recém-criada; o QR Code é gerado automaticamente em seguida
        autoQrTriedRef.current = false;
        await fetchInstance();
      } else {
        throw new Error(result?.error || 'Erro ao criar instância UaZapi');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar instância UaZapi",
        variant: "destructive",
      });
    } finally {
      setUazapiCreating(false);
    }
  };

  // Conectar instância UaZapi (gerar QR Code ou Código de Pareamento)
  const connectUazapiInstance = async (phone?: string) => {
    setActionLoading('connect');
    try {
      const invokeBody: any = { action: 'connect_instance', store_id: storeId };
      if (phone?.trim()) {
        invokeBody.phone = phone.trim();
      }

      // Garante um token de sessão válido antes de chamar a Edge Function
      // (sessão expirada era devolvida como 401 genérico "non-2xx status code")
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Sessão expirada (401).\n\n💡 Sua sessão de login expirou por segurança. Saia do sistema, faça login novamente e clique em Conectar para gerar o QR Code.');
      }

      const response = await supabase.functions.invoke('uazapi-manage', {
        body: invokeBody,
      });

      const result = response.data as any;

      if (response.error) {
        const message = await extractFunctionError(
          response.error,
          result,
          'Erro ao conectar instância UaZapi'
        );
        throw new Error(message);
      }

      if (result?.success && (result.qrcode || result.paircode)) {
        setQrCode(result.qrcode || null);
        setPairCode(result.paircode || null);
        setInstance((prev: any) => ({ ...prev, status: 'connecting' }));
        
        // Definir countdown: 2 min para QR, 5 min para pareamento
        const timeout = result.paircode ? 300 : 120;
        setQrCountdown(timeout);

        toast({
          title: result.paircode ? "Código de Pareamento Gerado" : "QR Code Gerado",
          description: result.paircode 
            ? `Use o código ${result.paircode} no WhatsApp` 
            : "Escaneie o QR Code com seu WhatsApp",
        });
      } else if (result?.status === 'connected') {
        setInstance((prev: any) => ({ ...prev, status: 'connected' }));
        setQrCode(null);
        setPairCode(null);
        setQrCountdown(0);
        toast({ title: "Conectado!", description: "WhatsApp já está conectado" });
      } else {
        throw new Error(result?.error || 'Não foi possível gerar código de conexão');
      }
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao conectar UaZapi:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao conectar instância UaZapi",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Verificar status da instância UaZapi
  const checkUazapiStatus = async () => {
    try {
      const response = await supabase.functions.invoke('uazapi-manage', {
        body: { action: 'instance_status', store_id: storeId },
      });

      if (response.error) throw response.error;
      const result = response.data;

      // Recarregar instância do banco para pegar dados atualizados
      const { data } = await supabase
        .from('whatsapp_instances' as any)
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (data) {
        setInstance(data);
        if ((data as any).status === 'connected') {
          setQrCode(null);
          setPairCode(null);
          setQrCountdown(0);
        }
      }

      toast({
        title: "Status atualizado",
        description: `Status: ${result?.status || 'desconhecido'}`,
      });
    } catch (error: any) {
      console.error('Erro ao verificar status UaZapi:', error);
    }
  };

  // Verificar e reconfigurar webhook da instância UaZapi
  const checkAndFixUazapiWebhook = async () => {
    setActionLoading('webhook');
    try {
      // Primeiro verificar webhook atual
      const getRes = await supabase.functions.invoke('uazapi-manage', {
        body: { action: 'get_instance_webhook', store_id: storeId },
      });

      const webhooks = getRes.data?.webhooks;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const expectedUrl = `${supabaseUrl}/functions/v1/uazapi-webhook`;
      
      // Verificar se já tem webhook correto configurado
      const hasCorrectWebhook = Array.isArray(webhooks) && webhooks.some(
        (wh: any) => wh.enabled && wh.url === expectedUrl
      );

      if (hasCorrectWebhook) {
        toast({
          title: "✅ Webhook OK",
          description: "O webhook da instância está configurado corretamente.",
        });
      } else {
        // Reconfigurar webhook
        const setRes = await supabase.functions.invoke('uazapi-manage', {
          body: { action: 'set_instance_webhook', store_id: storeId },
        });

        if (setRes.data?.success) {
          toast({
            title: "✅ Webhook Reconfigurado",
            description: "O webhook foi atualizado com a configuração padrão do Mostralo.",
          });
        } else {
          throw new Error('Falha ao configurar webhook');
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar webhook",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return {
    createUazapiInstance,
    connectUazapiInstance,
    checkUazapiStatus,
    checkAndFixUazapiWebhook,
  };
}
