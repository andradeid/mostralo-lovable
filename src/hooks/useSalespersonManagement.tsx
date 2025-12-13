import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSalespersonManagement() {
  const [loading, setLoading] = useState(false);

  const blockSalesperson = async (salespersonId: string, reason: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Atualizar vendedor
      const { error } = await supabase
        .from("salespeople")
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_by: user.id,
          blocked_reason: reason,
        })
        .eq("id", salespersonId);

      if (error) throw error;

      // Registrar no log de auditoria
      await supabase.from("admin_audit_log").insert({
        admin_id: user.id,
        target_user_id: salespersonId,
        action: "block_salesperson",
        details: { reason },
      });

      toast.success("Vendedor bloqueado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao bloquear vendedor:", error);
      toast.error("Erro ao bloquear vendedor");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unblockSalesperson = async (salespersonId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Atualizar vendedor
      const { error } = await supabase
        .from("salespeople")
        .update({
          is_blocked: false,
          blocked_at: null,
          blocked_by: null,
          blocked_reason: null,
        })
        .eq("id", salespersonId);

      if (error) throw error;

      // Registrar no log de auditoria
      await supabase.from("admin_audit_log").insert({
        admin_id: user.id,
        target_user_id: salespersonId,
        action: "unblock_salesperson",
        details: {},
      });

      toast.success("Vendedor desbloqueado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao desbloquear vendedor:", error);
      toast.error("Erro ao desbloquear vendedor");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    blockSalesperson,
    unblockSalesperson,
  };
}
