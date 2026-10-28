import { useState } from 'react';
import { Bluetooth, Loader2, Printer as PrinterIcon, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildTestReceipt } from '@/lib/thermal/receipt';
import {
  loadPrintSettings, printerKey, printerLabel, savePrintSettings, scanBluetooth, scanNetwork, sendToPrinter,
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

  const update = (patch: Partial<NativePrintSettings>) => setS(prev => { const n = { ...prev, ...patch }; savePrintSettings(n); return n; });
  const merge = (list: Printer[]) => setFound(prev => {
    const m = new Map(prev.map(p => [printerKey(p), p])); list.forEach(p => m.set(printerKey(p), p)); return [...m.values()];
  });

  const scan = async (kind: 'bt' | 'net') => {
    setScanning(kind); setMsg(''); setPct(0);
    try {
      if (kind === 'bt') await scanBluetooth(merge);
      else await scanNetwork(s.subnets.split(',').map(x => x.trim()).filter(x => /^\d+\.\d+\.\d+$/.test(x)), merge, setPct);
    } catch (e) {
      setMsg(kind === 'bt' ? `Bluetooth: ${(e as Error).message}. Ligue o Bluetooth e permita "Dispositivos por perto".` : `Rede: ${(e as Error).message}`);
    }
    setScanning('');
  };

  const test = async () => {
    if (!s.printer) return;
    setMsg('Imprimindo teste…');
    try {
      await sendToPrinter(s.printer, buildTestReceipt({ paper: s.paper, semAcentos: s.semAcentos, storeName, printerName: printerLabel(s.printer) }));
      setMsg('Teste enviado. Se os acentos saírem errados, ligue "Imprimir sem acentos".');
    } catch (e) { setMsg(`Não imprimiu: ${(e as Error).message}`); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Impressora escolhida</CardTitle>
          <CardDescription>{s.printer ? printerLabel(s.printer) : 'Nenhuma ainda. Procure abaixo.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="h-12 w-full" disabled={!s.printer} onClick={test}><PrinterIcon className="mr-2 h-4 w-4" />Imprimir teste</Button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </CardContent>
      </Card>

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
          {found.map(p => {
            const chosen = s.printer && printerKey(s.printer) === printerKey(p);
            return (
              <button key={printerKey(p)} type="button" onClick={() => update({ printer: p })}
                className={`flex min-h-12 w-full items-center justify-between rounded-lg border px-3 text-left text-sm ${chosen ? 'border-primary bg-primary/5' : ''}`}>
                <span className="flex items-center gap-2">{p.kind === 'bluetooth' ? <Bluetooth className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}{printerLabel(p)}</span>
                <span className="font-semibold text-primary">{chosen ? 'Escolhida' : 'Usar'}</span>
              </button>
            );
          })}
          <details className="text-sm">
            <summary className="min-h-10 cursor-pointer py-2 text-muted-foreground">Não achou? Digitar o IP da impressora</summary>
            <div className="flex gap-2">
              <Input placeholder="192.168.0.100" value={manualIp} onChange={e => setManualIp(e.target.value)} className="h-11" />
              <Button variant="outline" className="h-11" onClick={() => /^\d+\.\d+\.\d+\.\d+$/.test(manualIp.trim()) && update({ printer: { kind: 'network', name: 'Impressora de rede', ip: manualIp.trim(), port: 9100 } })}>Usar</Button>
            </div>
            <Label className="mt-3 block">Redes procuradas</Label>
            <Input value={s.subnets} onChange={e => update({ subnets: e.target.value })} className="mt-1 h-11" />
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Como imprimir</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="print-accept" className="text-sm">Imprimir sozinho ao aceitar o pedido</Label>
            <Switch id="print-accept" checked={s.printOnAccept} onCheckedChange={v => update({ printOnAccept: v })} />
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
              <Label className="text-sm">Vias</Label>
              <Select value={String(s.copies)} onValueChange={v => update({ copies: Number(v) })}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">1 via</SelectItem><SelectItem value="2">2 vias</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="sem-acentos" className="text-sm">Imprimir sem acentos</Label>
            <Switch id="sem-acentos" checked={s.semAcentos} onCheckedChange={v => update({ semAcentos: v })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
