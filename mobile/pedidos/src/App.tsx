import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { askNotificationPermission, beep } from './lib/alarm';
import { buildTestReceipt, brl } from './lib/receipt';
import { printerLabel, scanBluetooth, scanNetwork, sendToPrinter, type Printer } from './lib/printers';
import { loadSettings, saveSettings, type Settings } from './lib/settings';
import { myStores, supabase, type Store } from './lib/supabase';
import { useOrderWatcher } from './useOrderWatcher';

const STATUS: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento', entrada: 'Novo', confirmado: 'Confirmado', em_preparo: 'Em preparo',
  aguarda_retirada: 'Pronto', em_transito: 'Saiu para entrega', concluido: 'Concluído', cancelado: 'Cancelado',
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(loadSettings());
  const setSettings = (patch: Partial<Settings>) => setSettingsState(s => { const n = { ...s, ...patch }; saveSettings(n); return n; });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    KeepAwake.keepAwake().catch(() => undefined);
    void askNotificationPermission();
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="center">Carregando…</div>;
  if (!session) return <Login />;
  if (!settings.storeId) return <StorePicker userId={session.user.id} onPick={s => setSettings({ storeId: s.id, storeName: s.name })} />;
  return <Main settings={settings} setSettings={setSettings} />;
}

function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  return <header><div className="brand"><span className="logo">M</span>{title}</div>{right}</header>;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError('E-mail ou senha incorretos.');
  };
  return (
    <div className="page">
      <Header title="Mostralo Pedidos" />
      <form className="card" onSubmit={submit}>
        <h1>Entrar</h1>
        <p className="muted">Use o mesmo e-mail e senha do painel do Mostralo.</p>
        <label>E-mail<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  );
}

function StorePicker({ userId, onPick }: { userId: string; onPick: (s: Store) => void }) {
  const [stores, setStores] = useState<Store[] | null>(null);
  useEffect(() => { myStores(userId).then(setStores).catch(() => setStores([])); }, [userId]);
  return (
    <div className="page">
      <Header title="Escolha a loja" right={<button className="link" onClick={() => supabase.auth.signOut()}>Sair</button>} />
      <div className="card">
        {stores === null ? <p>Carregando lojas…</p> : stores.length === 0 ? <p>Nenhuma loja encontrada nesta conta.</p> :
          stores.map(s => <button key={s.id} className="row" onClick={() => onPick(s)}>{s.name}<span>›</span></button>)}
      </div>
    </div>
  );
}

function Main({ settings, setSettings }: { settings: Settings; setSettings: (p: Partial<Settings>) => void }) {
  const [tab, setTab] = useState<'orders' | 'printer'>(settings.printer ? 'orders' : 'printer');
  const { orders, log, online, printOrder } = useOrderWatcher(settings);
  return (
    <div className="page">
      <Header title={settings.storeName} right={<span className={online ? 'dot ok' : 'dot off'}>{online ? 'Online' : 'Sem internet'}</span>} />
      <nav>
        <button className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>Pedidos</button>
        <button className={tab === 'printer' ? 'on' : ''} onClick={() => setTab('printer')}>Impressora{settings.printer ? '' : ' ⚠️'}</button>
      </nav>
      {tab === 'orders' ? (
        <>
          <div className={settings.autoPrint && settings.printer ? 'banner ok' : 'banner warn'}>
            {settings.printer
              ? settings.autoPrint ? `Impressão automática ligada (${settings.when === 'arrive' ? 'ao chegar' : 'ao aceitar no painel'}) · ${printerLabel(settings.printer)}` : 'Impressão automática desligada'
              : 'Escolha a impressora na aba Impressora'}
          </div>
          <div className="list">
            {orders.length === 0 && <p className="muted center">Nenhum pedido hoje ainda. Deixe o app aberto: o pedido novo toca e imprime sozinho.</p>}
            {orders.map(o => (
              <div key={o.id} className={`order ${o.status}`}>
                <div>
                  <b>#{o.order_number}</b> · {o.customer_name ?? 'Cliente'}
                  <div className="muted">{new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {o.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'} · {brl(o.total)}</div>
                  <span className="pill">{STATUS[o.status] ?? o.status}</span>
                </div>
                <button className="ghost" onClick={() => printOrder(o, true)}>Imprimir</button>
              </div>
            ))}
          </div>
          <details className="card log"><summary>Registro ({log.length})</summary>{log.map((l, i) => <div key={i} className={l.ok ? '' : 'error'}>{l.at} · {l.text}</div>)}</details>
        </>
      ) : <PrinterTab settings={settings} setSettings={setSettings} />}
    </div>
  );
}

function PrinterTab({ settings, setSettings }: { settings: Settings; setSettings: (p: Partial<Settings>) => void }) {
  const [found, setFound] = useState<Printer[]>([]);
  const [scanning, setScanning] = useState<'' | 'bt' | 'net'>('');
  const [progress, setProgress] = useState('');
  const [msg, setMsg] = useState('');
  const [manualIp, setManualIp] = useState('');

  const merge = (list: Printer[]) => setFound(prev => {
    const key = (p: Printer) => (p.kind === 'bluetooth' ? p.address : `${p.ip}:${p.port}`);
    const m = new Map(prev.map(p => [key(p), p])); list.forEach(p => m.set(key(p), p)); return [...m.values()];
  });

  const scanBt = async () => {
    setScanning('bt'); setMsg('');
    try { await scanBluetooth(merge); } catch (e) { setMsg(`Bluetooth: ${(e as Error).message}. Ligue o Bluetooth e permita "Dispositivos por perto".`); }
    setScanning('');
  };
  const scanNet = async () => {
    setScanning('net'); setMsg('');
    const subnets = settings.subnets.split(',').map(s => s.trim()).filter(s => /^\d+\.\d+\.\d+$/.test(s));
    try { await scanNetwork(subnets, merge, (d, t) => setProgress(`${Math.round((d / t) * 100)}%`)); } catch (e) { setMsg(`Rede: ${(e as Error).message}`); }
    setScanning(''); setProgress('');
  };
  const test = async () => {
    if (!settings.printer) return;
    setMsg('Imprimindo teste…');
    try {
      await sendToPrinter(settings.printer, buildTestReceipt({ paper: settings.paper, semAcentos: settings.semAcentos, storeName: settings.storeName, printerName: printerLabel(settings.printer) }));
      setMsg('Teste enviado. Saiu certinho? Se os acentos saíram errados, ligue "Imprimir sem acentos".');
    } catch (e) { setMsg(`Não imprimiu: ${(e as Error).message}`); }
  };

  return (
    <div className="list">
      <div className="card">
        <h2>Impressora escolhida</h2>
        <p>{settings.printer ? printerLabel(settings.printer) : 'Nenhuma ainda'}</p>
        <div className="btns">
          <button className="primary" disabled={!settings.printer} onClick={test}>Imprimir teste</button>
          <button className="ghost" onClick={() => beep()}>Testar alarme</button>
        </div>
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="card">
        <h2>Procurar impressoras</h2>
        <div className="btns">
          <button className="primary" disabled={!!scanning} onClick={scanBt}>{scanning === 'bt' ? 'Procurando…' : 'Bluetooth'}</button>
          <button className="primary" disabled={!!scanning} onClick={scanNet}>{scanning === 'net' ? `Procurando na rede ${progress}` : 'Wi-Fi / rede'}</button>
        </div>
        {found.length === 0 && !scanning && <p className="muted">Ligue a impressora. No Bluetooth, de preferência já pareie a impressora nas configurações do celular.</p>}
        {found.map(p => (
          <button key={p.kind === 'bluetooth' ? p.address : p.ip} className="row" onClick={() => setSettings({ printer: p })}>
            <span>{p.kind === 'bluetooth' ? '🔵 ' : '📶 '}{printerLabel(p)}</span><span>{JSON.stringify(settings.printer) === JSON.stringify(p) ? '✓' : 'Usar'}</span>
          </button>
        ))}
        <details><summary className="muted">Não achou? Digitar o IP</summary>
          <div className="btns"><input placeholder="192.168.0.100" value={manualIp} onChange={e => setManualIp(e.target.value)} />
            <button className="ghost" onClick={() => /^\d+\.\d+\.\d+\.\d+$/.test(manualIp.trim()) && setSettings({ printer: { kind: 'network', name: 'Impressora de rede', ip: manualIp.trim(), port: 9100 } })}>Usar</button></div>
          <label>Redes para procurar<input value={settings.subnets} onChange={e => setSettings({ subnets: e.target.value })} /></label>
        </details>
      </div>

      <div className="card">
        <h2>Como imprimir</h2>
        <label className="check"><input type="checkbox" checked={settings.autoPrint} onChange={e => setSettings({ autoPrint: e.target.checked })} />Imprimir sozinho</label>
        <label>Quando<select value={settings.when} onChange={e => setSettings({ when: e.target.value as Settings['when'] })}>
          <option value="arrive">Assim que o pedido chegar</option>
          <option value="accept">Quando o pedido for aceito no painel</option>
        </select></label>
        <label>Papel<select value={settings.paper} onChange={e => setSettings({ paper: Number(e.target.value) as 58 | 80 })}>
          <option value={58}>58 mm</option><option value={80}>80 mm</option>
        </select></label>
        <label>Vias<select value={settings.copies} onChange={e => setSettings({ copies: Number(e.target.value) })}>
          <option value={1}>1 via</option><option value={2}>2 vias</option>
        </select></label>
        <label className="check"><input type="checkbox" checked={settings.semAcentos} onChange={e => setSettings({ semAcentos: e.target.checked })} />Imprimir sem acentos</label>
      </div>

      <div className="card">
        <h2>Conta</h2>
        <p className="muted">Loja: {settings.storeName}</p>
        <div className="btns">
          <button className="ghost" onClick={() => setSettings({ storeId: null, storeName: '' })}>Trocar loja</button>
          <button className="ghost" onClick={() => { setSettings({ storeId: null, storeName: '' }); void supabase.auth.signOut(); }}>Sair</button>
        </div>
        <p className="muted small">Deixe o app aberto na tela de Pedidos (a tela fica acesa sozinha). Versão de teste 0.1.</p>
      </div>
    </div>
  );
}
