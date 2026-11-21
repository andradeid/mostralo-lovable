// Configurações › Entrega: "Envio para todo o Brasil (Melhor Envio)".
// Grava store_shipping_settings direto (RLS: admin da loja) e o token pela RPC set_shipping_token
// (o token nunca volta para o navegador; só "token salvo em <data>").
import { useEffect, useState } from 'react';
import { Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { brl } from '@/lib/brl';
import {
  SHIPPING_SERVICES, deliveryDaysText, fetchShippingSettings, formatCep, lookupCep, normalizeCep, optionLabel, quoteShipping,
  type ShippingOption,
} from '@/lib/shipping/shippingClient';

interface Props { storeId: string }

interface FormState {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  origin: string;
  services: string[];
  weight: string;
  height: string;
  width: string;
  length: string;
  handlingDays: string;
  freeMin: string;
}

const EMPTY: FormState = {
  enabled: false, environment: 'sandbox', origin: '', services: ['1', '2', '3'],
  weight: '0,8', height: '12', width: '22', length: '33', handlingDays: '1', freeMin: '',
};

const toNum = (s: string) => Number(String(s).replace(',', '.'));
const fromNum = (n: unknown) => (n == null || n === '' ? '' : String(Number(n)).replace('.', ','));

export function ShippingSettingsCard({ storeId }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState('');
  const [tokenSavedAt, setTokenSavedAt] = useState<string | null>(null);
  const [originCity, setOriginCity] = useState('');
  const [testCep, setTestCep] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ options?: ShippingOption[]; error?: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [s, status] = await Promise.all([
        fetchShippingSettings(storeId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC nova (tipos gerados ainda não têm)
        (supabase as any).rpc('shipping_token_status', { p_store_id: storeId }),
      ]);
      if (!alive) return;
      if (s) {
        setForm({
          enabled: !!s.enabled,
          environment: s.environment === 'production' ? 'production' : 'sandbox',
          origin: s.origin_postal_code ? formatCep(s.origin_postal_code) : '',
          services: s.services ?? [],
          weight: fromNum(s.default_weight_kg),
          height: fromNum(s.default_height_cm),
          width: fromNum(s.default_width_cm),
          length: fromNum(s.default_length_cm),
          handlingDays: String(s.handling_days ?? 1),
          freeMin: fromNum(s.free_shipping_min),
        });
      }
      setTokenSavedAt(status?.data?.has_token ? (status.data.updated_at ?? 'salvo') : null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [storeId]);

  // Cidade do CEP de origem
  useEffect(() => {
    const cep = normalizeCep(form.origin);
    if (!cep) { setOriginCity(''); return; }
    let alive = true;
    lookupCep(cep).then((a) => alive && setOriginCity(a ? `${a.district ? `${a.district}, ` : ''}${a.city} - ${a.state}` : 'CEP não encontrado'));
    return () => { alive = false; };
  }, [form.origin]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const toggleService = (id: string) =>
    set({ services: form.services.includes(id) ? form.services.filter((s) => s !== id) : [...form.services, id] });

  const save = async () => {
    const origin = normalizeCep(form.origin);
    if (form.enabled && !origin) return toast.error('Informe o CEP de onde sai a mercadoria.');
    if (form.enabled && !tokenSavedAt && !token.trim()) return toast.error('Cole o token do Melhor Envio.');
    if (!form.services.length) return toast.error('Escolha pelo menos uma transportadora.');
    const dims = [form.weight, form.height, form.width, form.length].map(toNum);
    if (dims.some((n) => !(n > 0))) return toast.error('Confira o peso e as medidas da embalagem padrão.');
    const handling = Math.max(0, Math.floor(toNum(form.handlingDays) || 0));
    const freeMin = form.freeMin.trim() ? toNum(form.freeMin) : null;
    if (freeMin !== null && !(freeMin > 0)) return toast.error('Valor de frete grátis inválido.');

    setSaving(true);
    try {
      if (token.trim()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC nova
        const { data, error } = await (supabase as any).rpc('set_shipping_token', { p_store_id: storeId, p_token: token.trim() });
        if (error) throw new Error(error.message);
        setTokenSavedAt(data?.updated_at ?? 'salvo');
        setToken('');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova
      const { error } = await (supabase as any).from('store_shipping_settings').upsert({
        store_id: storeId,
        enabled: form.enabled,
        environment: form.environment,
        origin_postal_code: origin,
        services: form.services,
        default_weight_kg: dims[0],
        default_height_cm: dims[1],
        default_width_cm: dims[2],
        default_length_cm: dims[3],
        handling_days: handling,
        free_shipping_min: freeMin,
      }, { onConflict: 'store_id' });
      if (error) throw new Error(error.message);
      toast.success('Envio salvo.');
    } catch (e) {
      console.error('[frete] Erro ao salvar envio:', e);
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar o envio.');
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    const cep = normalizeCep(testCep);
    if (!cep) return toast.error('CEP de teste inválido.');
    setTesting(true);
    setTestResult(null);
    const r = await quoteShipping({ storeId, postalCode: cep, test: true });
    setTestResult(r.ok === true ? { options: r.options } : { error: (r as { message: string }).message });
    setTesting(false);
  };

  if (loading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Envio para todo o Brasil (Melhor Envio)</CardTitle>
            <p className="text-sm text-muted-foreground max-w-2xl">
              O cliente digita o CEP e vê o preço e o prazo de cada transportadora. O valor vem da sua conta no Melhor Envio, com os descontos dela.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor="ship-enabled" className="text-sm font-semibold">{form.enabled ? 'Ligado' : 'Desligado'}</Label>
            <Switch id="ship-enabled" checked={form.enabled} onCheckedChange={(v) => set({ enabled: v })} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ship-token">Token do Melhor Envio</Label>
            <Input
              id="ship-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={tokenSavedAt ? 'Token salvo — cole outro para trocar' : 'Cole aqui o token'}
            />
            <p className="text-xs text-muted-foreground">
              No Melhor Envio: Integrações › Permissões de acesso › Gerar token (marque “Cotar fretes”). Fica guardado só no servidor.
              {tokenSavedAt && tokenSavedAt !== 'salvo' && ` Salvo em ${new Date(tokenSavedAt).toLocaleDateString('pt-BR')}.`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ship-origin">CEP de onde sai a mercadoria</Label>
              <Input id="ship-origin" inputMode="numeric" value={form.origin} onChange={(e) => set({ origin: e.target.value })} placeholder="00000-000" />
              <p className="text-xs text-muted-foreground">{originCity}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ship-env">Conta</Label>
              <Select value={form.environment} onValueChange={(v) => set({ environment: v as FormState['environment'] })}>
                <SelectTrigger id="ship-env"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Teste (sandbox)</SelectItem>
                  <SelectItem value="production">Real</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">O token precisa ser da mesma conta.</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Transportadoras oferecidas ao cliente</p>
          <div className="flex flex-wrap gap-2">
            {SHIPPING_SERVICES.map((s) => {
              const on = form.services.includes(s.id);
              return (
                <Button key={s.id} type="button" variant={on ? 'default' : 'outline'} size="sm" aria-pressed={on} onClick={() => toggleService(s.id)} className="rounded-full">
                  {s.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 col-span-2 lg:col-span-1">
            <Label>Embalagem padrão (cm)</Label>
            <div className="flex items-center gap-1">
              <Input aria-label="Comprimento" inputMode="decimal" value={form.length} onChange={(e) => set({ length: e.target.value })} />
              <span className="text-muted-foreground">×</span>
              <Input aria-label="Largura" inputMode="decimal" value={form.width} onChange={(e) => set({ width: e.target.value })} />
              <span className="text-muted-foreground">×</span>
              <Input aria-label="Altura" inputMode="decimal" value={form.height} onChange={(e) => set({ height: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">Comprimento × largura × altura. Vale para produto sem medidas.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ship-weight">Peso padrão (kg)</Label>
            <Input id="ship-weight" inputMode="decimal" value={form.weight} onChange={(e) => set({ weight: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ship-days">Dias para postar</Label>
            <Input id="ship-days" inputMode="numeric" value={form.handlingDays} onChange={(e) => set({ handlingDays: e.target.value })} />
            <p className="text-xs text-muted-foreground">Somado ao prazo da transportadora.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ship-free">Frete grátis acima de (R$)</Label>
            <Input id="ship-free" inputMode="decimal" value={form.freeMin} onChange={(e) => set({ freeMin: e.target.value })} placeholder="Opcional" />
            <p className="text-xs text-muted-foreground">Grátis só na opção mais barata.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Label htmlFor="ship-test">Testar cotação para o CEP</Label>
          <Input id="ship-test" inputMode="numeric" value={testCep} onChange={(e) => setTestCep(e.target.value)} placeholder="00000-000" className="w-36" />
          <Button type="button" variant="outline" onClick={test} disabled={testing}>
            {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Testar
          </Button>
          <Button type="button" onClick={save} disabled={saving} className="ml-auto">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar envio
          </Button>
        </div>
        {testResult && (
          <div className="text-sm rounded-md bg-muted/60 p-3 space-y-1" role="status">
            {testResult.error && <p className="text-destructive">{testResult.error}</p>}
            {testResult.options?.map((o) => (
              <p key={o.service_id}>{optionLabel(o)} · {deliveryDaysText(o.delivery_days)} · <strong>{o.free ? 'Grátis' : brl(o.price)}</strong></p>
            ))}
            <p className="text-xs text-muted-foreground">Teste com a configuração já salva (salve antes de testar mudanças).</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
