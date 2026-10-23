import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, RefreshCw, Smartphone, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ErrorRow {
  id: string;
  created_at: string;
  kind: string;
  message: string;
  stack: string | null;
  path: string | null;
  store_slug: string | null;
  host: string | null;
  user_agent: string | null;
  app_version: string | null;
  user_id: string | null;
  visitor_id: string | null;
}

const KIND_LABEL: Record<string, string> = {
  error: "Erro de script",
  unhandledrejection: "Falha não tratada",
  react: "Tela quebrou",
  chunk: "App desatualizado / não carregou",
  manual: "Registrado pelo app",
};

const PERIODS = [
  { label: "24 horas", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
];

function device(ua: string | null) {
  if (!ua) return { mobile: false, label: "—" };
  const mobile = /Android|iPhone|iPad|Mobile/i.test(ua);
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iPhone" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "Mac" : "Outro";
  const browser = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Outro";
  return { mobile, label: `${os} · ${browser}` };
}

/** Erros que aconteceram no navegador de visitantes e lojistas (master). Agrupados pela mensagem. */
export default function ClientErrorsPage() {
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["client-error-logs", days],
    queryFn: async (): Promise<ErrorRow[]> => {
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      const { data, error } = await (supabase as any)
        .from("client_error_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as ErrorRow[]) ?? [];
    },
  });

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; kind: string; message: string; rows: ErrorRow[] }>();
    for (const r of data ?? []) {
      const key = `${r.kind}|${r.message.slice(0, 160)}`;
      const g = map.get(key) ?? { key, kind: r.kind, message: r.message, rows: [] };
      g.rows.push(r);
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.rows.length - a.rows.length);
  }, [data]);

  const total = data?.length ?? 0;
  const visitors = new Set((data ?? []).map((r) => r.visitor_id).filter(Boolean)).size;
  const stores = new Set((data ?? []).map((r) => r.store_slug).filter(Boolean)).size;

  return (
    <div className="space-y-4 p-1 sm:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold sm:text-2xl">Erros do site</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">O que deu errado no navegador de visitantes e lojistas. Registros ficam guardados por 60 dias.</p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <Button key={p.days} size="sm" variant={days === p.days ? "default" : "outline"} onClick={() => setDays(p.days)}>{p.label}</Button>
          ))}
          <Button size="icon" variant="ghost" onClick={() => refetch()} aria-label="Atualizar">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[["Ocorrências", total], ["Pessoas afetadas", visitors], ["Lojas envolvidas", stores]].map(([l, v]) => (
          <Card key={String(l)}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-bold">{v}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Erros agrupados</CardTitle>
          <CardDescription>Do mais frequente para o menos frequente. Toque para ver onde e em quais aparelhos aconteceu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : groups.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum erro registrado no período. 🎉</p>
          ) : (
            groups.map((g) => {
              const last = g.rows[0];
              const isOpen = open === g.key;
              const affected = new Set(g.rows.map((r) => r.visitor_id).filter(Boolean)).size;
              const storeList = [...new Set(g.rows.map((r) => r.store_slug).filter(Boolean))];
              return (
                <div key={g.key} className="rounded-lg border">
                  <button type="button" className="flex w-full items-start gap-3 p-3 text-left" onClick={() => setOpen(isOpen ? null : g.key)}>
                    {isOpen ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />}
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">{g.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="secondary">{KIND_LABEL[g.kind] ?? g.kind}</Badge>
                        <span>{g.rows.length}× · {affected} pessoa(s)</span>
                        <span>· última {format(new Date(last.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        {storeList.length > 0 && <span>· {storeList.slice(0, 3).join(", ")}{storeList.length > 3 ? ` +${storeList.length - 3}` : ""}</span>}
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t p-3">
                      {g.rows.slice(0, 20).map((r) => {
                        const d = device(r.user_agent);
                        return (
                          <div key={r.id} className="rounded-md bg-muted/40 p-2 text-xs">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-medium">{format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</span>
                              <span className="flex items-center gap-1">{d.mobile ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}{d.label}</span>
                              <span className="break-all">{r.host}{r.path}</span>
                              {r.app_version && <span className="text-muted-foreground">versão {r.app_version}</span>}
                              {r.user_id && <span className="text-muted-foreground">logado</span>}
                            </div>
                            {r.stack && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-muted-foreground">Detalhes técnicos</summary>
                                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px]">{r.stack}</pre>
                              </details>
                            )}
                          </div>
                        );
                      })}
                      {g.rows.length > 20 && <p className="text-xs text-muted-foreground">+{g.rows.length - 20} ocorrências</p>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
