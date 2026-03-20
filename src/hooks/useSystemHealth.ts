import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";

export interface ConnectionsData {
  total: number;
  active: number;
  idle: number;
  max: number;
  byState: { state: string; count: number }[];
}

export interface DatabaseStatsData {
  cacheHitRatio: number;
  txCommit: number;
  txRollback: number;
  tupReturned: number;
  tupFetched: number;
  tupInserted: number;
  tupUpdated: number;
  tupDeleted: number;
}

export interface RealtimeData {
  activeSubscriptions: number;
}

export interface ModuleStoreData {
  storeName: string;
  storeId: string;
  totalModules: number;
  enabledModules: number;
  disabledModules: number;
}

export interface TopTableData {
  tableName: string;
  liveRows: number;
  seqScans: number;
  idxScans: number;
}

export interface SystemHealthData {
  timestamp: string;
  queryTimeMs: number;
  connections: ConnectionsData;
  database: DatabaseStatsData;
  realtime: RealtimeData;
  modules: ModuleStoreData[];
  topTables: TopTableData[];
}

const REFRESH_INTERVAL = 60000; // 60 seconds
const MANUAL_COOLDOWN = 10000; // 10 seconds

/**
 * Hook para monitorar saúde do sistema.
 * Roda APENAS quando a página está visível e o componente montado.
 * Polling a cada 60s, sem Realtime.
 */
export function useSystemHealth() {
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [lastManualRefresh, setLastManualRefresh] = useState(0);

  // Page Visibility API
  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const query = useQuery<SystemHealthData>({
    queryKey: ["system-health"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("system-health-check");
      if (error) throw new Error(error.message || "Falha ao buscar saúde do sistema");
      return data as SystemHealthData;
    },
    refetchInterval: isPageVisible ? REFRESH_INTERVAL : false,
    refetchOnWindowFocus: false,
    staleTime: 55000, // 55s — quase igual ao intervalo para evitar refetch duplo
    gcTime: 120000, // 2min cache
    retry: 1,
  });

  const manualRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastManualRefresh < MANUAL_COOLDOWN) return;
    setLastManualRefresh(now);
    query.refetch();
  }, [lastManualRefresh, query]);

  const canManualRefresh = Date.now() - lastManualRefresh >= MANUAL_COOLDOWN;

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    manualRefresh,
    canManualRefresh,
    isPageVisible,
  };
}
