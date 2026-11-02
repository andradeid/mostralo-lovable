// Padrões de imposto (usados quando o produto não tem dados fiscais próprios) e natureza da operação.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ORIGEM_OPTIONS, PIS_COFINS_OPTIONS, icmsOptionsFor, type FiscalSettingsForm } from '@/lib/fiscal/settingsForm';
import { FiscalField } from './FiscalField';
import type { FiscalFormProps } from './types';

export function FiscalDefaultsCard({ form, errors, onChange }: FiscalFormProps) {
  const input = (key: keyof FiscalSettingsForm, label: string, hint?: string, extra: Record<string, unknown> = {}) => (
    <FiscalField id={`fd-${key}`} label={label} error={errors[key]} hint={hint}>
      <Input id={`fd-${key}`} value={String(form[key] ?? '')} onChange={(e) => onChange({ [key]: e.target.value })} {...extra} />
    </FiscalField>
  );
  const select = (key: keyof FiscalSettingsForm, label: string, options: { value: string; label: string }[], placeholder?: string) => (
    <FiscalField id={`fd-${key}`} label={label} error={errors[key]}>
      <Select value={String(form[key] ?? '')} onValueChange={(v) => onChange({ [key]: v })}>
        <SelectTrigger id={`fd-${key}`}><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </FiscalField>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Impostos padrão</CardTitle>
        <CardDescription>
          Valem para todo produto sem "Dados fiscais" próprios. Confirme com o contador: o Mostralo não faz
          classificação tributária.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {input('default_ncm', 'NCM padrão', 'Opcional. Sem ele, cada produto precisa do seu NCM.', { inputMode: 'numeric', placeholder: '8 dígitos' })}
        {input('default_cfop', 'CFOP padrão', '5102 = revenda dentro do estado', { inputMode: 'numeric' })}
        {select('default_icms_origem', 'Origem', ORIGEM_OPTIONS)}
        {select('default_icms_situacao', form.regime_tributario === '3' ? 'CST do ICMS' : 'CSOSN', icmsOptionsFor(form.regime_tributario))}
        {select('default_pis_cst', 'CST do PIS', PIS_COFINS_OPTIONS, 'Escolha (peça ao contador)')}
        {select('default_cofins_cst', 'CST do COFINS', PIS_COFINS_OPTIONS, 'Escolha (peça ao contador)')}
        {input('default_unidade', 'Unidade padrão', 'UN, KG, LT…')}
        <div />
        {input('nfce_natureza_operacao', 'Natureza da operação (cupom)')}
        {input('nfe_natureza_operacao', 'Natureza da operação (NF-e)')}
      </CardContent>
    </Card>
  );
}
