import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type HomeOption = "auto" | "store" | "booking";

const OPTIONS: Array<{ value: HomeOption; label: string }> = [
  { value: "auto", label: "Automático" },
  { value: "store", label: "Loja (produtos)" },
  { value: "booking", label: "Agendamento" },
];

/** Verifica se o módulo "booking" está ativo para a loja (override da loja > plano). */
async function hasBookingModule(storeId: string): Promise<boolean> {
  const { data: mod } = await supabase.from("modules").select("id").eq("key", "booking").eq("is_active", true).maybeSingle();
  if (!mod) return false;
  const { data: override } = await supabase
    .from("store_modules").select("is_enabled").eq("store_id", storeId).eq("module_id", mod.id).maybeSingle();
  if (override) return !!override.is_enabled;
  const { data: store } = await supabase.from("stores").select("plan_id").eq("id", storeId).maybeSingle();
  if (!store?.plan_id) return false;
  const { data: pm } = await supabase
    .from("plan_modules").select("module_id").eq("plan_id", store.plan_id).eq("module_id", mod.id).maybeSingle();
  return !!pm;
}

/** Seletor "Ao abrir meu domínio, mostrar:" — só aparece com o módulo de agendamento ativo. */
export function CustomDomainHomeSelect({ storeId }: { storeId: string | null }) {
  const [enabled, setEnabled] = useState(false);
  const [value, setValue] = useState<HomeOption>("auto");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    (async () => {
      const [ok, { data }] = await Promise.all([
        hasBookingModule(storeId),
        supabase.from("stores").select("custom_domain_home" as never).eq("id", storeId).maybeSingle(),
      ]);
      if (cancelled) return;
      setEnabled(ok);
      const home = (data as { custom_domain_home?: string } | null)?.custom_domain_home;
      if (home === "store" || home === "booking" || home === "auto") setValue(home);
    })();
    return () => { cancelled = true; };
  }, [storeId]);

  if (!storeId || !enabled) return null;

  const save = async (next: HomeOption) => {
    const prev = value;
    setValue(next);
    setSaving(true);
    const { error } = await supabase.from("stores").update({ custom_domain_home: next } as never).eq("id", storeId);
    setSaving(false);
    if (error) {
      setValue(prev);
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preferência salva", description: "Pode levar alguns minutos para valer para quem já abriu o site." });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="custom-domain-home">Ao abrir meu domínio, mostrar:</Label>
      <Select value={value} onValueChange={(v) => save(v as HomeOption)} disabled={saving}>
        <SelectTrigger id="custom-domain-home" className="w-full sm:w-64"><SelectValue /></SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {value === "auto" && (
        <p className="text-xs text-muted-foreground">Abre o agendamento se a loja tiver até 3 produtos; senão, abre a loja.</p>
      )}
    </div>
  );
}
