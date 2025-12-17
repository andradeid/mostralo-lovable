import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BotSession {
  remoteJid: string;
  sessionId: string;
  status: "opened" | "paused" | "closed";
  pushName?: string;
  createdAt?: string;
  updateAt?: string;
}

export function useBotSessions(storeId: string | null) {
  const [sessions, setSessions] = useState<BotSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke("whatsapp-bot-sessions", {
        body: {
          action: "get_sessions",
          storeId,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        setSessions(response.data.sessions || []);
      } else {
        throw new Error(response.data?.error || "Erro ao buscar sessões");
      }
    } catch (err: any) {
      console.error("Erro ao buscar sessões:", err);
      setError(err.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchSessions();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const changeSessionStatus = async (
    remoteJid: string,
    status: "opened" | "paused" | "closed"
  ) => {
    setActionLoading(remoteJid);
    try {
      const response = await supabase.functions.invoke("whatsapp-bot-sessions", {
        body: {
          action: "change_status",
          storeId,
          remoteJid,
          status,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        // Atualizar lista local
        setSessions((prev) =>
          prev.map((session) =>
            session.remoteJid === remoteJid ? { ...session, status } : session
          )
        );
        return { success: true };
      } else {
        throw new Error(response.data?.error || "Erro ao alterar status");
      }
    } catch (err: any) {
      console.error("Erro ao alterar status:", err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(null);
    }
  };

  const pauseSession = (remoteJid: string) =>
    changeSessionStatus(remoteJid, "paused");

  const closeSession = (remoteJid: string) =>
    changeSessionStatus(remoteJid, "closed");

  const openSession = (remoteJid: string) =>
    changeSessionStatus(remoteJid, "opened");

  const deleteSession = async (remoteJid: string) => {
    setActionLoading(remoteJid);
    try {
      const response = await supabase.functions.invoke("whatsapp-bot-sessions", {
        body: {
          action: "delete_session",
          storeId,
          remoteJid,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        // Remover da lista local
        setSessions((prev) =>
          prev.filter((session) => session.remoteJid !== remoteJid)
        );
        return { success: true };
      } else {
        throw new Error(response.data?.error || "Erro ao excluir sessão");
      }
    } catch (err: any) {
      console.error("Erro ao excluir sessão:", err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(null);
    }
  };

  return {
    sessions,
    loading,
    actionLoading,
    error,
    refetch: fetchSessions,
    pauseSession,
    closeSession,
    openSession,
    deleteSession,
  };
}
