// Formulário de produto: "Dados fiscais" (NCM, CFOP, CEST, origem, CSOSN/CST, PIS/COFINS, unidade).
// Só aparece com NFC-e ou NF-e ligada; vazio = usa o padrão da configuração fiscal da loja.
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CSOSN_OPTIONS, CST_OPTIONS, ORIGEM_OPTIONS, PIS_COFINS_OPTIONS } from '@/lib/fiscal/settingsForm';
import type { ProductFiscalApi } from '@/hooks/fiscal/useProductFiscal';
import type { ProductFiscalForm } from '@/lib/fiscal/productFiscal';
import { FiscalField } from './FiscalField';

const DEFAULT = '__default__';

export function ProductFiscalSection({ fiscal }: { fiscal: ProductFiscalApi }) {
  if (!fiscal.enabled) return null;
  const { form, update, errors } = fiscal;

  const text = (key: keyof ProductFiscalForm, label: string, placeholder: string, hint?: string) => (
    <FiscalField id={`pf-${key}`} label={label} error={errors[key]} hint={hint}>
      <Input id={`pf-${key}`} value={form[key]} placeholder={placeholder} inputMode={key === 'unidade' ? 'text' : 'numeric'}
        onChange={(e) => update({ [key]: e.target.value })}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
    </FiscalField>
  );
  const select = (key: keyof ProductFiscalForm, label: string, options: { value: string; label: string }[]) => (
    <FiscalField id={`pf-${key}`} label={label}>
      <Select value={form[key] || DEFAULT} onValueChange={(v) => update({ [key]: v === DEFAULT ? '' : v })}>
        <SelectTrigger id={`pf-${key}`}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT}>Padrão da loja</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </FiscalField>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Dados fiscais</h3>
        <p className="text-xs text-muted-foreground">
          Usados no cupom fiscal e na NF-e. Peça ao contador. Em branco = padrão das configurações fiscais da loja.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {text('ncm', 'NCM', 'Ex.: 21069090', 'Classificação do produto (8 dígitos)')}
        {text('cfop', 'CFOP', 'Ex.: 5102', '5405 para produto com substituição tributária')}
        {text('cest', 'CEST', 'Só com ST (7 dígitos)')}
        {text('unidade', 'Unidade', 'UN, KG, LT…')}
        {select('icms_origem', 'Origem', ORIGEM_OPTIONS)}
        {select('icms_situacao', 'CSOSN / CST do ICMS', [...CSOSN_OPTIONS, ...CST_OPTIONS])}
        {select('pis_cst', 'CST do PIS', PIS_COFINS_OPTIONS)}
        {select('cofins_cst', 'CST do COFINS', PIS_COFINS_OPTIONS)}
      </div>
    </div>
  );
}
