import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export type DatabaseStatus = "healthy" | "degraded" | "down" | "unknown";

interface DatabaseHealth {
  status: DatabaseStatus;
  latencyMs: number | null;
  consecutiveFailures: number;
  lastCheckedAt: Date | null;
}

const HEALTH_CHECK_INTERVAL_MS = 120000; // 2 minutos
const MAX_FAILURES_BEFORE_DOWN = 3;

/**
 * Hook que monitora a saúde do banco de dados via Edge Function.
 * Roda apenas no contexto admin (deve ser usado apenas em páginas admin).
 */
export function useDatabaseHealth() {
  const { profile } = useAuth();
  const isMasterAdmin = profile?.user_type === "master_admin";

  const [health, setHealth] = useState<DatabaseHealth>({
    status: "unknown",
    latencyMs: null,
    consecutiveFailures: 0,
    lastCheckedAt: null,
  });
  const failuresRef = useRef(0);
  const queryClient = useQueryClient();

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const { data, error } = await supabase.functions.invoke("db-health-check", {
        method: "POST",
      });

      clearTimeout(timeout);

      if (error || !data) {
        failuresRef.current += 1;
        setHealth({
          status: failuresRef.current >= MAX_FAILURES_BEFORE_DOWN ? "down" : "degraded",
          latencyMs: null,
          consecutiveFailures: failuresRef.current,
          lastCheckedAt: new Date(),
        });
        return;
      }

      // Sucesso
      failuresRef.current = 0;
      setHealth({
        status: data.status as DatabaseStatus,
        latencyMs: data.latency_ms,
        consecutiveFailures: 0,
        lastCheckedAt: new Date(),
      });
    } catch {
      failuresRef.current += 1;
      setHealth({
        status: failuresRef.current >= MAX_FAILURES_BEFORE_DOWN ? "down" : "degraded",
        latencyMs: null,
        consecutiveFailures: failuresRef.current,
        lastCheckedAt: new Date(),
      });
    }
  }, []);

  // Reconexão: invalida o cache do React Query e força health check
  const reconnect = useCallback(async () => {
    await queryClient.invalidateQueries();
    await checkHealth();
  }, [queryClient, checkHealth]);

  useEffect(() => {
    // Só roda polling para master_admin — economiza conexões para lojistas
    if (!isMasterAdmin) return;

    // Check imediato
    checkHealth();

    // Polling a cada 2 minutos
    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkHealth, isMasterAdmin]);

  return { ...health, reconnect };
}
