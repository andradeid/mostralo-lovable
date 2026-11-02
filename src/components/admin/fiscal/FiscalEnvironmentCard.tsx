// Ambiente (homologação = teste sem valor fiscal; produção = nota de verdade) e tipos de nota ligados.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import type { FiscalFormProps } from './types';

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function FiscalEnvironmentCard({ form, onChange }: FiscalFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ambiente e tipos de nota</CardTitle>
        <CardDescription>Comece em homologação para testar. Só mude para produção depois de emitir notas de teste sem erro.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RadioGroup value={form.environment} onValueChange={(v) => onChange({ environment: v as typeof form.environment })} className="grid sm:grid-cols-2 gap-3">
          <Label htmlFor="env-h" className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
            <RadioGroupItem id="env-h" value="homologacao" className="mt-0.5" />
            <span><b>Homologação (teste)</b><span className="block text-xs text-muted-foreground font-normal">Notas sem valor fiscal, para conferir se está tudo certo.</span></span>
          </Label>
          <Label htmlFor="env-p" className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
            <RadioGroupItem id="env-p" value="producao" className="mt-0.5" />
            <span><b>Produção</b><span className="block text-xs text-muted-foreground font-normal">Notas de verdade, enviadas à SEFAZ.</span></span>
          </Label>
        </RadioGroup>
        {form.environment === 'producao' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Em produção cada nota tem valor fiscal. Cancelar só é possível em até 30 min (cupom) ou 24 h (NF-e).</AlertDescription>
          </Alert>
        )}
        <Toggle id="nfce-enabled" label="Cupom fiscal (NFC-e) no PDV" hint="Venda no balcão para consumidor, com ou sem CPF."
          checked={form.nfce_enabled} onChange={(v) => onChange({ nfce_enabled: v })} />
        <Toggle id="nfe-enabled" label="NF-e nos pedidos" hint="Nota completa, com endereço. Obrigatória para vender a CNPJ."
          checked={form.nfe_enabled} onChange={(v) => onChange({ nfe_enabled: v })} />
        <Toggle id="service-fee" label="Taxa de serviço no cupom" hint="Os 10% da comanda entram como outras despesas."
          checked={form.include_service_fee} onChange={(v) => onChange({ include_service_fee: v })} />
        <div className="space-y-1.5">
          <Label htmlFor="pix-code">PIX no cupom</Label>
          <Select value={form.pix_payment_code} onValueChange={(v) => onChange({ pix_payment_code: v })}>
            <SelectTrigger id="pix-code" className="sm:w-80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="17">PIX dinâmico (QR gerado a cada cobrança)</SelectItem>
              <SelectItem value="20">PIX estático (chave ou QR fixo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
