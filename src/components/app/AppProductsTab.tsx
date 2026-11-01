// Aba "Produtos" do app Mostralo Pedidos: abrir/fechar a loja e ligar/desligar produtos (como no GloriaFood).
// Usa os mesmos campos do painel: stores.business_hours.service_paused e products.is_available.
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { StoreQuickToggle } from '@/components/admin/dashboard/StoreQuickToggle';
import { remoteLog } from '@/lib/thermal/nativePrinter';

type Product = { id: string; name: string; price: number | null; is_available: boolean; category_id: string | null; display_order: number | null; image_url: string | null };
type Category = { id: string; name: string; display_order: number | null };

const brl = (v: number | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

export function AppProductsTab({ storeId }: { storeId: string | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [onlyOff, setOnlyOff] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      supabase.from('products').select('id, name, price, is_available, category_id, display_order, image_url').eq('store_id', storeId).order('display_order', { ascending: true, nullsFirst: false }).order('name'),
      supabase.from('categories').select('id, name, display_order').eq('store_id', storeId).order('display_order', { ascending: true, nullsFirst: false }),
    ]).then(([p, c]) => {
      if (!alive) return;
      if (p.error) toast.error('Não deu para carregar os produtos');
      setProducts((p.data ?? []) as Product[]);
      setCategories((c.data ?? []) as Category[]);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [storeId]);

  const toggle = async (p: Product) => {
    const next = !p.is_available;
    setSaving(p.id);
    setProducts(list => list.map(x => (x.id === p.id ? { ...x, is_available: next } : x)));
    const { error } = await supabase.from('products').update({ is_available: next }).eq('id', p.id);
    setSaving(null);
    if (error) {
      setProducts(list => list.map(x => (x.id === p.id ? { ...x, is_available: !next } : x)));
      toast.error(`Não deu para ${next ? 'ativar' : 'desativar'} ${p.name}`);
      return;
    }
    remoteLog(`Produto ${next ? 'ativado' : 'desativado'}: ${p.name}`, 'produtos');
    toast.success(next ? `${p.name} voltou ao cardápio` : `${p.name} saiu do cardápio`);
  };

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const match = (p: Product) => (!onlyOff || !p.is_available) && (!term || p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(term));
    const byCat = new Map<string, Product[]>();
    for (const p of products.filter(match)) {
      const k = p.category_id ?? 'sem';
      byCat.set(k, [...(byCat.get(k) ?? []), p]);
    }
    const ordered = categories.filter(c => byCat.has(c.id)).map(c => ({ id: c.id, name: c.name, items: byCat.get(c.id)! }));
    const rest = [...byCat.entries()].filter(([k]) => !categories.some(c => c.id === k)).flatMap(([, v]) => v);
    if (rest.length) ordered.push({ id: 'sem', name: 'Outros', items: rest });
    return ordered;
  }, [products, categories, q, onlyOff]);

  const offCount = products.filter(p => !p.is_available).length;

  return (
    <div className="space-y-4">
      <StoreQuickToggle storeId={storeId} variant="full" onStatusChange={paused => remoteLog(`Loja ${paused ? 'fechada' : 'aberta'} pelo app`, 'produtos')} />

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar produto" className="h-11 pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setOnlyOff(false)} className={`min-h-11 rounded-lg border text-sm font-semibold ${!onlyOff ? 'border-foreground bg-foreground text-background' : ''}`}>Todos ({products.length})</button>
          <button type="button" onClick={() => setOnlyOff(true)} className={`min-h-11 rounded-lg border text-sm font-semibold ${onlyOff ? 'border-foreground bg-foreground text-background' : ''}`}>Desativados ({offCount})</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{onlyOff ? 'Nenhum produto desativado.' : 'Nenhum produto encontrado.'}</p>
      ) : groups.map(g => (
        <section key={g.id} className="overflow-hidden rounded-lg border bg-card">
          <h3 className="bg-muted/50 px-3 py-2 text-sm font-bold">{g.name}</h3>
          <ul className="divide-y">
            {g.items.map(p => (
              <li key={p.id}>
                <label className={`flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 ${p.is_available ? '' : 'opacity-60'}`}>
                  {p.image_url
                    ? <img src={p.image_url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                    : <span className="h-10 w-10 shrink-0 rounded-md bg-muted" />}
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{brl(p.price)} · {p.is_available ? 'No cardápio' : 'Desativado'}</span>
                  </span>
                  {saving === p.id
                    ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                    : <Switch checked={p.is_available} onCheckedChange={() => void toggle(p)} aria-label={`${p.is_available ? 'Desativar' : 'Ativar'} ${p.name}`} />}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
