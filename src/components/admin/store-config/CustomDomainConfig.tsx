import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle2, Clock, Copy, Loader2, ShieldCheck, Trash2, Info } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CustomDomainConfigProps {
  customDomain: string;
  verified: boolean;
  requestedAt: string | null;
  storeSlug: string;
  onUpdate: (domain: string, verified: boolean) => void;
}

type DomainState = "idle" | "pending" | "ssl" | "active";

interface VerifyResponse {
  verified?: boolean;
  domain?: string;
  hostnameStatus?: string;
  sslStatus?: string;
  message?: string;
  error?: string;
}

const CNAME_TARGET = "lojas.mostralo.com.br";
const POLL_MS = 60_000;
const POLL_MAX_MS = 30 * 60_000;

/** Lê a mensagem real de erro de uma edge function */
async function readError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body?.error || body?.message || "Erro ao verificar domínio";
    } catch { /* ignora */ }
  }
  return error instanceof Error ? error.message : "Erro ao verificar domínio";
}

export function CustomDomainConfig({ customDomain, verified, storeSlug, onUpdate }: CustomDomainConfigProps) {
  const [domain, setDomain] = useState(customDomain || "");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<DomainState>(verified ? "active" : customDomain ? "pending" : "idle");
  const [message, setMessage] = useState("");
  const pollStart = useRef<number | null>(null);
  // Só habilita a reconsulta automática depois do clique em "Verificar agora"
  const [manualChecked, setManualChecked] = useState(false);
  const { toast } = useToast();

  // Resolve o id da loja pelo slug (o lojista logado pode ler a própria loja)
  useEffect(() => {
    if (!storeSlug) return;
    supabase.from("stores").select("id").eq("slug", storeSlug).maybeSingle()
      .then(({ data }) => setStoreId(data?.id ?? null));
  }, [storeSlug]);

  const verify = useCallback(async (silent = false) => {
    if (!storeId || !domain.trim()) {
      if (!silent) toast({ title: "Digite o domínio", description: "Ex.: www.sualoja.com.br", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke<VerifyResponse>("verify-domain", { body: { storeId, domain } });
      if (error) throw new Error(await readError(error));
      const res = data ?? {};
      const next: DomainState = res.verified ? "active" : res.hostnameStatus === "active" ? "ssl" : "pending";
      setState(next);
      setMessage(res.message ?? "");
      if (res.domain) setDomain(res.domain);
      onUpdate(res.domain ?? domain, !!res.verified);
      if (next !== "active" && pollStart.current === null) pollStart.current = Date.now();
      if (next === "active") pollStart.current = null;
      if (!silent) toast({ title: res.verified ? "Domínio ativo!" : "Verificação feita", description: res.message });
    } catch (e) {
      if (!silent) toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }, [storeId, domain, onUpdate, toast]);

  // Loja já verificada: mostra "Ativo"
  useEffect(() => {
    if (verified) setState("active");
  }, [verified]);

  // Reconsulta a cada 60 s só após "Verificar agora" nesta sessão e enquanto não estiver ativo (máx. 30 min)
  useEffect(() => {
    if (verified || !manualChecked || (state !== "pending" && state !== "ssl")) return;
    const t = setInterval(() => {
      if (pollStart.current && Date.now() - pollStart.current > POLL_MAX_MS) return clearInterval(t);
      void verify(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [state, verify, manualChecked, verified]);

  const remove = async () => {
    if (!storeId) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("verify-domain", { body: { storeId, action: "remove" } });
      if (error) throw new Error(await readError(error));
      setDomain("");
      setState("idle");
      setMessage("");
      pollStart.current = null;
      onUpdate("", false);
      toast({ title: "Domínio removido" });
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: text });
  };

  const rootDomain = (domain || "www.lojadele.com.br").replace(/^www\./, "");

  const badge = {
    idle: null,
    pending: <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Aguardando DNS</Badge>,
    ssl: <Badge variant="secondary"><ShieldCheck className="w-3 h-3 mr-1" />Gerando SSL</Badge>,
    active: <Badge><CheckCircle2 className="w-3 h-3 mr-1" />Ativo</Badge>,
  }[state];

  const records: Array<[string, string]> = [["Tipo", "CNAME"], ["Nome", "www"], ["Valor", CNAME_TARGET]];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Domínio Personalizado (Opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom-domain">Domínio Personalizado</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="custom-domain"
              placeholder="www.sualoja.com.br"
              value={domain}
              onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
              className="flex-1 min-w-[200px]"
            />
            {badge}
          </div>
          <p className="text-xs text-muted-foreground">Use o endereço com www</p>
        </div>

        <div className="space-y-3 p-3 rounded-lg border bg-muted/50">
          <p className="text-sm">
            Crie este registro no painel onde você comprou o domínio (Registro.br, Hostinger, GoDaddy…).
            A ativação leva de alguns minutos a algumas horas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {records.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-background">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-mono text-sm truncate">{value}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Copiar ${label}`} onClick={() => copy(value)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {message}
              {state !== "active" && state !== "idle" && " Verificando de novo automaticamente a cada minuto."}
            </AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Dica: para que {rootDomain} (sem www) também abra a loja, configure no seu registrador um
          redirecionamento para www.{rootDomain}.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="button" onClick={() => { setManualChecked(true); void verify(false); }} disabled={busy || !storeId || !domain} className="flex-1">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Verificar agora
          </Button>
          {(customDomain || state !== "idle") && (
            <Button type="button" variant="outline" onClick={remove} disabled={busy || !storeId}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remover domínio
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
