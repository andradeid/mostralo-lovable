import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuditLog {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: string;
  details: any;
  created_at: string;
  admin?: {
    full_name: string;
    email: string;
  };
}

export function useUserManagement() {
  const [loading, setLoading] = useState(false);

  const blockUser = async (userId: string, reason: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_by: (await supabase.auth.getUser()).data.user?.id,
          blocked_reason: reason,
        })
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'block',
        p_target_user_id: userId,
        p_details: { reason },
      });

      toast.success('Usuário bloqueado com sucesso');
    } catch (error: any) {
      console.error('Erro ao bloquear usuário:', error);
      toast.error('Erro ao bloquear usuário: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: false,
          blocked_at: null,
          blocked_by: null,
          blocked_reason: null,
        })
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'unblock',
        p_target_user_id: userId,
      });

      toast.success('Usuário desbloqueado com sucesso');
    } catch (error: any) {
      console.error('Erro ao desbloquear usuário:', error);
      toast.error('Erro ao desbloquear usuário: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, reason?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'delete',
        p_target_user_id: userId,
        p_details: reason ? { reason } : {},
      });

      toast.success('Usuário excluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const restoreUser = async (userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
        })
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'restore',
        p_target_user_id: userId,
      });

      toast.success('Usuário restaurado com sucesso');
    } catch (error: any) {
      console.error('Erro ao restaurar usuário:', error);
      toast.error('Erro ao restaurar usuário: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, data: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'edit',
        p_target_user_id: userId,
        p_details: { changes: data },
      });

      toast.success('Usuário atualizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: string, storeId?: string) => {
    setLoading(true);
    try {
      // Validação de roles conflitantes
      if (role === 'customer' || role === 'store_admin') {
        const conflictingRole = role === 'customer' ? 'store_admin' : 'customer';
        
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', conflictingRole)
          .maybeSingle();

        if (existingRole) {
          toast.error(`Não é possível adicionar role ${role}. Usuário já possui role ${conflictingRole}.`);
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: role as any,
        store_id: storeId,
      });

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'role_change',
        p_target_user_id: userId,
        p_details: { action: 'add', role, store_id: storeId },
      });

      toast.success('Role adicionada com sucesso');
    } catch (error: any) {
      console.error('Erro ao adicionar role:', error);
      toast.error('Erro ao adicionar role: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (roleId: string, userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: 'role_change',
        p_target_user_id: userId,
        p_details: { action: 'remove', role_id: roleId },
      });

      toast.success('Role removida com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover role:', error);
      toast.error('Erro ao remover role: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAuditLog = async (userId: string): Promise<AuditLog[]> => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar informações dos admins separadamente
      const adminIds = [...new Set(data?.map(log => log.admin_id) || [])];
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', adminIds);

      // Combinar os dados
      const logsWithAdmin = data?.map(log => ({
        ...log,
        admin: admins?.find(a => a.id === log.admin_id) || undefined,
      })) || [];

      return logsWithAdmin as AuditLog[];
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao buscar histórico: ' + error.message);
      return [];
    }
  };

  return {
    blockUser,
    unblockUser,
    deleteUser,
    restoreUser,
    updateUser,
    addRole,
    removeRole,
    getAuditLog,
    loading,
  };
}
