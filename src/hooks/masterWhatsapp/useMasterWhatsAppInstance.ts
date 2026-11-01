import type { useMasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";
// Instância do WhatsApp Master: estado da conexão, criar/status/desconectar/apagar e webhook.
// Código movido da MasterWhatsAppPage sem mudança de comportamento.
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MasterConfig = ReturnType<typeof useMasterWhatsAppConfig>["config"];

export function useMasterWhatsAppInstance(config: MasterConfig) {
  const [instanceName, setInstanceName] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<string>("disconnected");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [connectionMethod, setConnectionMethod] = useState<'qrcode' | 'pairing_code'>('qrcode');
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<{ loaded: boolean; configured: boolean; url?: string; events?: string[] } | null>(null);
  const [editingConnection, setEditingConnection] = useState(false);
  const [editToken, setEditToken] = useState('');
  const [editServerUrl, setEditServerUrl] = useState('');
  const [showEditToken, setShowEditToken] = useState(false);
  const [savingConnection, setSavingConnection] = useState(false);

  useEffect(() => {
    if (config?.instance_name) {
      setInstanceName(config.instance_name);
      setInstanceStatus(config.instance_status || "disconnected");
    }
  }, [config]);

  // Criar instância via Edge Function
  const createInstance = async () => {
    if (!instanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setLoadingAction('create');
    try {
      const uniqueName = `master_${instanceName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;

      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'create', instanceName: uniqueName }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setInstanceStatus('connecting');
      setInstanceName(uniqueName);
      
      if (data?.qrcode) {
        setQrCode(data.qrcode);
      }

      toast.success('Instância criada! Escaneie o QR Code');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar instância');
    } finally {
      setLoadingAction(null);
    }
  };

  // Verificar status via Edge Function
  const checkStatus = async () => {
    if (!config?.instance_name) return;

    setLoadingAction('status');
    try {
      const response = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'status' }
      });

      console.log('[MasterWA] Status response:', response);

      let result = response.data;
      if (typeof result === 'string') {
        try { result = JSON.parse(result); } catch { /* ignore */ }
      }

      if (response.error) throw new Error(response.error.message);
      if (result?.error) throw new Error(result.error);

      const newStatus = result?.status || 'disconnected';
      setInstanceStatus(newStatus);

      if (newStatus === 'connected') {
        toast.success('WhatsApp conectado!');
        setQrCode(null);
      } else if (result?.qrcode) {
        setQrCode(result.qrcode);
      }
    } catch (error) {
      console.error('[MasterWA] Erro status:', error);
      toast.error('Erro ao verificar status');
    } finally {
      setLoadingAction(null);
    }
  };

  // Desconectar via Edge Function
  const disconnect = async () => {
    if (!config?.instance_name) return;

    setLoadingAction('disconnect');
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'disconnect' }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setInstanceStatus('disconnected');
      setQrCode(null);
      toast.success('Desconectado');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao desconectar');
    } finally {
      setLoadingAction(null);
    }
  };

  // Apagar instância via Edge Function
  const deleteInstance = async () => {
    if (!config?.instance_name) return;
    if (!confirm('Tem certeza que deseja apagar a instância? Você precisará criar uma nova.')) return;

    setLoadingAction('delete');
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'delete' }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setInstanceStatus('disconnected');
      setQrCode(null);
      setInstanceName('');
      toast.success('Instância apagada! Crie uma nova para continuar.');
      // Recarregar config
      window.location.reload();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao apagar instância');
    } finally {
      setLoadingAction(null);
    }
  };

  // Buscar status do webhook
  const fetchWebhookStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'getWebhook' }
      });
      if (error || data?.error) {
        setWebhookStatus({ loaded: true, configured: false });
        return;
      }
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const expectedUrl = `${supabaseUrl}/functions/v1/master-whatsapp-webhook`;
      const webhooks = data?.webhooks || [];
      const match = Array.isArray(webhooks) && webhooks.find(
        (wh: any) => wh.url?.includes('master-whatsapp-webhook') && wh.enabled
      );
      setWebhookStatus({
        loaded: true,
        configured: !!match,
        url: match?.url || undefined,
        events: match?.events || undefined,
      });
    } catch {
      setWebhookStatus({ loaded: true, configured: false });
    }
  };

  // Configurar webhook automaticamente na UaZapi
  const configureWebhook = async () => {
    setLoadingAction('webhook');
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'configureWebhook' }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.alreadyConfigured) {
        toast.info('✅ Webhook já está configurado corretamente!');
      } else {
        toast.success('✅ Webhook configurado com sucesso!');
      }
      // Atualizar status após configurar
      await fetchWebhookStatus();
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao configurar webhook');
    } finally {
      setLoadingAction(null);
    }
  };


  return {
    instanceName,
    setInstanceName,
    qrCode,
    setQrCode,
    instanceStatus,
    setInstanceStatus,
    loadingAction,
    setLoadingAction,
    connectionMethod,
    setConnectionMethod,
    pairingPhone,
    setPairingPhone,
    pairingCode,
    setPairingCode,
    webhookStatus,
    setWebhookStatus,
    editingConnection,
    setEditingConnection,
    editToken,
    setEditToken,
    editServerUrl,
    setEditServerUrl,
    showEditToken,
    setShowEditToken,
    savingConnection,
    setSavingConnection,
    createInstance,
    checkStatus,
    disconnect,
    deleteInstance,
    fetchWebhookStatus,
    configureWebhook,
  };
}

export type MasterWhatsAppInstanceApi = ReturnType<typeof useMasterWhatsAppInstance>;
