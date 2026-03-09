import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Permissões disponíveis para atendentes
export const ATTENDANT_PERMISSIONS = [
  { key: 'pdv', label: 'PDV', description: 'Acesso ao Ponto de Venda', icon: 'Monitor' },
  { key: 'comandas', label: 'Comandas/Mesas', description: 'Abertura e gestão de mesas e comandas', icon: 'ClipboardList' },
  { key: 'kds', label: 'Cozinha (KDS)', description: 'Visualizar e gerenciar pedidos na cozinha', icon: 'UtensilsCrossed' },
  { key: 'pedidos_delivery', label: 'Pedidos Delivery', description: 'Ver pedidos que chegam por delivery', icon: 'Truck' },
  { key: 'pedidos_balcao', label: 'Pedidos Balcão', description: 'Ver pedidos do PDV/balcão', icon: 'ShoppingCart' },
  { key: 'produtos', label: 'Produtos', description: 'Gerenciar cardápio e produtos', icon: 'Package' },
  { key: 'clientes', label: 'Clientes', description: 'Visualizar e gerenciar clientes', icon: 'Users' },
  { key: 'relatorios', label: 'Relatórios', description: 'Acesso a relatórios e estatísticas', icon: 'BarChart3' },
  { key: 'whatsapp_chat', label: 'Chat WhatsApp', description: 'Atender clientes pelo WhatsApp', icon: 'MessageSquare' },
] as const;

// Notificações disponíveis para atendentes
export const ATTENDANT_NOTIFICATIONS = [
  { key: 'novo_pedido', label: 'Novo Pedido', description: 'Alerta quando chegar um novo pedido' },
  { key: 'pedido_pronto', label: 'Pedido Pronto', description: 'Alerta quando um pedido ficar pronto' },
  { key: 'mesa_chamou', label: 'Mesa Chamando', description: 'Alerta quando uma mesa chamar o garçom' },
  { key: 'pedido_cancelado', label: 'Pedido Cancelado', description: 'Alerta quando um pedido for cancelado' },
] as const;

export type PermissionKey = typeof ATTENDANT_PERMISSIONS[number]['key'];
export type NotificationKey = typeof ATTENDANT_NOTIFICATIONS[number]['key'];

// Mapeamento: permissão do atendente → módulo necessário (key do módulo)
// Se null, a permissão não depende de módulo específico
export const PERMISSION_MODULE_MAP: Record<PermissionKey, string | null> = {
  'pdv': 'pdv_comandas',           // Requer módulo PDV e Comandas
  'comandas': 'pdv_comandas',      // Requer módulo PDV e Comandas
  'kds': 'kds',                    // Requer módulo KDS
  'pedidos_delivery': null,        // Não depende de módulo específico
  'pedidos_balcao': null,          // Não depende de módulo específico
  'produtos': 'digital_menu',      // Requer módulo Cardápio Digital
  'clientes': null,                // Não depende de módulo específico
  'relatorios': 'reports',         // Requer módulo Relatórios
  'whatsapp_chat': 'whatsapp_recovery', // Requer módulo WhatsApp Recuperação
};

interface AttendantPermission {
  id: string;
  permission_key: string;
  is_enabled: boolean;
}

interface AttendantNotification {
  id: string;
  notification_key: string;
  is_enabled: boolean;
}

interface UseAttendantPermissionsOptions {
  userId: string;
  storeId: string;
}

export function useAttendantPermissions({ userId, storeId }: UseAttendantPermissionsOptions) {
  const [permissions, setPermissions] = useState<AttendantPermission[]>([]);
  const [notifications, setNotifications] = useState<AttendantNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Buscar permissões e notificações do atendente
  const fetchData = useCallback(async () => {
    if (!userId || !storeId) return;
    
    setLoading(true);
    try {
      // Buscar permissões
      const { data: permData, error: permError } = await supabase
        .from('attendant_permissions')
        .select('id, permission_key, is_enabled')
        .eq('user_id', userId)
        .eq('store_id', storeId);

      if (permError) throw permError;
      setPermissions(permData || []);

      // Buscar notificações
      const { data: notifData, error: notifError } = await supabase
        .from('attendant_notifications')
        .select('id, notification_key, is_enabled')
        .eq('user_id', userId)
        .eq('store_id', storeId);

      if (notifError) throw notifError;
      setNotifications(notifData || []);
    } catch (error) {
      console.error('Erro ao buscar permissões do atendente:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Verificar se uma permissão está habilitada (default: true se não existe registro)
  const hasPermission = useCallback((key: PermissionKey): boolean => {
    const permission = permissions.find(p => p.permission_key === key);
    return permission ? permission.is_enabled : true; // Default: liberado
  }, [permissions]);

  // Verificar se uma notificação está habilitada (default: true se não existe registro)
  const hasNotification = useCallback((key: NotificationKey): boolean => {
    const notification = notifications.find(n => n.notification_key === key);
    return notification ? notification.is_enabled : true; // Default: ligada
  }, [notifications]);

  // Atualizar uma permissão (upsert)
  const updatePermission = useCallback(async (key: PermissionKey, enabled: boolean): Promise<boolean> => {
    setSaving(true);
    try {
      const existing = permissions.find(p => p.permission_key === key);

      if (existing) {
        // Update
        const { error } = await supabase
          .from('attendant_permissions')
          .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('attendant_permissions')
          .insert({
            user_id: userId,
            store_id: storeId,
            permission_key: key,
            is_enabled: enabled
          });

        if (error) throw error;
      }

      await fetchData();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, storeId, permissions, fetchData]);

  // Atualizar uma notificação (upsert)
  const updateNotification = useCallback(async (key: NotificationKey, enabled: boolean): Promise<boolean> => {
    setSaving(true);
    try {
      const existing = notifications.find(n => n.notification_key === key);

      if (existing) {
        // Update
        const { error } = await supabase
          .from('attendant_notifications')
          .update({ is_enabled: enabled })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('attendant_notifications')
          .insert({
            user_id: userId,
            store_id: storeId,
            notification_key: key,
            is_enabled: enabled
          });

        if (error) throw error;
      }

      await fetchData();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, storeId, notifications, fetchData]);

  // Obter lista de permissões habilitadas
  const getEnabledPermissions = useCallback((): PermissionKey[] => {
    return ATTENDANT_PERMISSIONS
      .filter(p => hasPermission(p.key))
      .map(p => p.key);
  }, [hasPermission]);

  return {
    loading,
    saving,
    permissions,
    notifications,
    hasPermission,
    hasNotification,
    updatePermission,
    updateNotification,
    getEnabledPermissions,
    refetch: fetchData,
  };
}
