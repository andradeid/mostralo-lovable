import { useEffect, useState } from 'react';
import { Bluetooth, Loader2, Printer as PrinterIcon, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildTestReceipt } from '@/lib/thermal/receipt';
import { CODE_PAGE_OPTIONS, type CodePage } from '@/lib/thermal/escpos';
import {
  cleanPrinter, remoteLog, WEB_VERSION, loadPrintSettings, printerKey, printerLabel, savePrintSettings, scanBluetooth, scanNetwork, sendToPrinter,
  type NativePrintSettings, type Printer,
} from '@/lib/thermal/nativePrinter';

/** Aba "Impressora" do app: procurar, escolher e testar a térmica; quando imprimir. */
export function NativePrinterSettings({ storeName }: { storeName: string }) {
  const [s, setS] = useState<NativePrintSettings>(loadPrintSettings);
  const [found, setFound] = useState<Printer[]>([]);
  const [scanning, setScanning] = useState<'' | 'bt' | 'net'>('');
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) => { remoteLog(line); setLog(prev => [...prev, `${new Date().toLocaleTimeString('pt-BR')} ${line}`].slice(-200)); };
  // Ao abrir a aba, já roda a busca no Bluetooth uma vez (mostra o registro sem precisar tocar)
  // Ao abrir a aba sem impressora escolhida, já procura no Bluetooth
  useEffect(() => { addLog(`Aba Impressora aberta · ${WEB_VERSION} · ${location.href}`); if (!loadPrintSettings().printer) void scan('bt'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [searchOpen, setSearchOpen] = useState(() => !loadPrintSettings().printer);
  const [showAll, setShowAll] = useState(false);

  const update = (patch: Partial<NativePrintSettings>) => setS(prev => { const n = { ...prev, ...patch }; savePrintSettings(n); return n; });
  const merge = (list: Printer[]) => setFound(prev => {
    const m = new Map(prev.map(p => [printerKey(p), p])); list.forEach(p => m.set(printerKey(p), p)); return [...m.values()];
  });

  const scan = async (kind: 'bt' | 'net') => {
    setScanning(kind); setMsg(''); setPct(0);
    try {
      if (kind === 'bt') {
        let total = 0;
        setLog([]);
        addLog('Toquei em Bluetooth');
        await scanBluetooth(list => { total = list.length; merge(list); }, 12000, addLog);
        if (total === 0) setMsg('Nenhuma impressora Bluetooth. Ligue a impressora, pareie nas configurações de Bluetooth do celular (senha costuma ser 0000 ou 1234) e toque em Bluetooth de novo.');
      }
      else {
        setLog([]);
        addLog('Toquei em Wi-Fi / rede');
        let total = 0;
        const auto = await scanNetwork(s.subnets.split(',').map(x => x.trim()).filter(x => /^\d+\.\d+\.\d+$/.test(x)), list => { total = list.length; merge(list); }, setPct, addLog);
        // guarda a rede do celular na lista, para as próximas buscas
        const known = s.subnets.split(',').map(x => x.trim()).filter(Boolean);
        const add = auto.filter(a => !known.includes(a));
        if (add.length) update({ subnets: [...add, ...known].join(', ') });
        if (total === 0) setMsg('Nenhuma impressora de rede. Confira se o celular está no mesmo Wi-Fi da impressora e se ela está ligada no cabo/Wi-Fi. Se souber o IP (sai no autoteste da impressora), digite abaixo.');
      }
    } catch (e) {
      addLog(`Falhou: ${(e as Error).message}`);
      setMsg(kind === 'bt' ? `Bluetooth: ${(e as Error).message}. Ligue o Bluetooth e permita "Dispositivos por perto".` : `Rede: ${(e as Error).message}`);
    }
    setScanning('');
  };

  const test = async () => {
    if (!s.printer) return;
    setMsg('Imprimindo teste…');
    addLog(`Imprimir teste em ${printerLabel(s.printer)}`);
    try {
      await sendToPrinter(s.printer, buildTestReceipt({ paper: s.paper, codepage: s.codepage, cutter: s.cutter, semAcentos: s.semAcentos, storeName, printerName: printerLabel(s.printer) }), addLog);
      setMsg('Teste enviado. Veja qual linha numerada saiu com os acentos certos e escolha esse número em "Acentos", logo abaixo.');
    } catch (e) { addLog(`Não imprimiu: ${(e as Error).message}`); setMsg(`Não imprimiu: ${(e as Error).message}`); }
  };

  const viaList: { id: 'complete' | 'kitchen' | 'delivery'; label: string }[] = [
    { id: 'complete', label: 'Completa' }, { id: 'kitchen', label: 'Cozinha' }, { id: 'delivery', label: 'Entregador' },
  ];
  const toggleVia = (id: 'complete' | 'kitchen' | 'delivery') => {
    const cur = s.vias ?? [];
    const next = cur.includes(id) ? cur.filter(v => v !== id) : [...cur, id];
    const ordered = viaList.map(v => v.id).filter(v => next.includes(v));
    update({ vias: ordered }); addLog(`Vias: ${ordered.join(', ') || 'conforme a loja'}`);
  };
  // Lista: impressoras e o que parece impressora primeiro; som de carro/fone só em "mostrar todos"
  const printers = found.filter(p => p.kind === 'network' || !p.paired || p.likely || (s.printer && printerKey(s.printer) === printerKey(p)));
  const hidden = found.length - printers.length;
  const list = showAll ? found : printers;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Impressora</CardTitle>
          <CardDescription>{s.printer ? printerLabel(s.printer) : 'Nenhuma escolhida ainda. Procure abaixo.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-12" disabled={!s.printer} onClick={test}><PrinterIcon className="mr-2 h-4 w-4" />Imprimir teste</Button>
            <Button variant="outline" className="h-12" onClick={() => setSearchOpen(o => !o)}>{searchOpen ? 'Fechar busca' : s.printer ? 'Trocar impressora' : 'Procurar'}</Button>
          </div>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </CardContent>
      </Card>

      {searchOpen && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Procurar impressoras</CardTitle>
            <CardDescription>Ligue a impressora. No Bluetooth, pareie antes nas configurações do celular.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12" disabled={!!scanning} onClick={() => scan('bt')}>
                {scanning === 'bt' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bluetooth className="mr-2 h-4 w-4" />}Bluetooth
              </Button>
              <Button variant="outline" className="h-12" disabled={!!scanning} onClick={() => scan('net')}>
                {scanning === 'net' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{pct}%</> : <><Wifi className="mr-2 h-4 w-4" />Wi-Fi / rede</>}
              </Button>
            </div>
            {list.map(p => {
              const chosen = s.printer && printerKey(s.printer) === printerKey(p);
              return (
                <button key={printerKey(p)} type="button"
                  onClick={() => { update({ printer: cleanPrinter(p) }); addLog(`Escolhi ${printerLabel(p)}`); setMsg('Impressora escolhida. Toque em Imprimir teste.'); setSearchOpen(false); }}
                  className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm ${chosen ? 'border-primary bg-primary/5' : ''}`}>
                  <span className="flex min-w-0 items-center gap-2">{p.kind === 'bluetooth' ? <Bluetooth className="h-4 w-4 shrink-0" /> : <Wifi className="h-4 w-4 shrink-0" />}
                    <span className="min-w-0 break-words">{printerLabel(p)}{p.kind === 'bluetooth' && p.paired && <span className="block text-xs text-muted-foreground">{p.likely ? 'Pareada · parece impressora' : 'Pareada'}</span>}</span></span>
                  <span className="shrink-0 font-semibold text-primary">{chosen ? 'Escolhida' : 'Usar'}</span>
                </button>
              );
            })}
            {hidden > 0 && (
              <button type="button" className="min-h-10 w-full text-sm text-muted-foreground underline" onClick={() => setShowAll(v => !v)}>
                {showAll ? 'Mostrar só impressoras' : `Mostrar todos os aparelhos (+${hidden}: fones, som de carro…)`}
              </button>
            )}
            <details className="text-sm">
              <summary className="min-h-10 cursor-pointer py-2 text-muted-foreground">Não achou? Digitar o IP da impressora</summary>
              <div className="flex gap-2">
                <Input placeholder="192.168.0.100" value={manualIp} onChange={e => setManualIp(e.target.value)} className="h-11" />
                <Button variant="outline" className="h-11" onClick={() => { if (/^\d+\.\d+\.\d+\.\d+$/.test(manualIp.trim())) { update({ printer: { kind: 'network', name: 'Impressora de rede', ip: manualIp.trim(), port: 9100 } }); addLog(`Escolhi IP digitado ${manualIp.trim()}:9100`); setSearchOpen(false); } else addLog(`IP inválido: ${manualIp}`); }}>Usar</Button>
              </div>
              <Label className="mt-3 block">Redes procuradas</Label>
              <Input value={s.subnets} onChange={e => update({ subnets: e.target.value })} className="mt-1 h-11" />
            </details>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Como imprimir</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="print-accept" className="text-sm">Imprimir sozinho ao aceitar o pedido</Label>
            <Switch id="print-accept" checked={s.printOnAccept} onCheckedChange={v => update({ printOnAccept: v })} />
          </div>
          <div>
            <Label className="text-sm">Vias que saem em cada pedido</Label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {viaList.map(v => {
                const on = (s.vias ?? []).includes(v.id);
                return (
                  <button key={v.id} type="button" onClick={() => toggleVia(v.id)}
                    className={`min-h-11 rounded-lg border px-2 text-sm font-semibold ${on ? 'border-primary bg-primary text-primary-foreground' : ''}`}>{v.label}</button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.vias?.length ? 'Escolhidas aqui neste celular.' : 'Nenhuma marcada: segue a Configuração de Impressão da loja.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Papel</Label>
              <Select value={String(s.paper)} onValueChange={v => update({ paper: Number(v) as 58 | 80 })}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="58">58 mm</SelectItem><SelectItem value="80">80 mm</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Cópias</Label>
              <Select value={String(s.copies)} onValueChange={v => update({ copies: Number(v) })}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">1 cópia</SelectItem><SelectItem value="2">2 cópias</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Tamanho dos itens na via da cozinha</Label>
            <Select value={s.kitchenSize ?? 'mid'} onValueChange={v => { update({ kitchenSize: v as 'normal' | 'mid' | 'big' }); addLog(`Cozinha: ${v}`); }}>
              <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (negrito)</SelectItem>
                <SelectItem value="mid">Médio (letra alta)</SelectItem>
                <SelectItem value="big">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Acentos (use o número da linha certa no teste)</Label>
            <Select value={s.codepage && s.codepage !== 'gbk' ? s.codepage : (s.semAcentos || s.codepage === 'gbk' ? 'none' : 'pc850')}
              onValueChange={v => { update({ codepage: v as CodePage, semAcentos: v === 'none' }); addLog(`Acentos: ${v}`); }}>
              <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CODE_PAGE_OPTIONS.map((p, i) => <SelectItem key={p.id} value={p.id}>{i + 1}) {p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="cutter" className="text-sm">Impressora corta o papel sozinha (guilhotina)</Label>
            <Switch id="cutter" checked={s.cutter ?? s.paper === 80} onCheckedChange={v => { update({ cutter: v }); addLog(`Guilhotina: ${v ? 'sim' : 'não'}`); }} />
          </div>
        </CardContent>
      </Card>

      <details className="rounded-lg border bg-card p-4 text-sm">
        <summary className="min-h-10 cursor-pointer font-semibold">Registro (para o suporte)</summary>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">{log.length ? log.join('\n') : 'Nada ainda.'}</pre>
        <Button variant="outline" className="mt-2 h-11 w-full" disabled={!log.length}
          onClick={() => { void navigator.clipboard?.writeText(log.join('\n')).then(() => setMsg('Registro copiado'), () => setMsg('Não deu para copiar: selecione o texto e copie')); }}>
          Copiar registro
        </Button>
      </details>
    </div>
  );
}
