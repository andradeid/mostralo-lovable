// Dados do emitente: CNPJ, IE, regime e endereço fiscal (iguais ao cadastro na Focus/SEFAZ).
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REGIME_OPTIONS, icmsOptionsFor, type FiscalSettingsForm } from '@/lib/fiscal/settingsForm';
import { UFS } from '../../../../supabase/functions/_shared/fiscal-doc';
import { FiscalField } from './FiscalField';
import type { FiscalFormProps } from './types';

export function FiscalCompanyCard({ form, errors, onChange }: FiscalFormProps) {
  const input = (key: keyof FiscalSettingsForm, label: string, className = '', extra: Record<string, unknown> = {}) => (
    <FiscalField id={`fs-${key}`} label={label} error={errors[key]} className={className}>
      <Input id={`fs-${key}`} value={String(form[key] ?? '')} onChange={(e) => onChange({ [key]: e.target.value })} {...extra} />
    </FiscalField>
  );
  const changeRegime = (regime: string) => {
    const options = icmsOptionsFor(regime).map((o) => o.value);
    onChange({ regime_tributario: regime, default_icms_situacao: options.includes(form.default_icms_situacao) ? form.default_icms_situacao : options[0] });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Empresa</CardTitle>
        <CardDescription>Dados que saem na nota. Precisam ser iguais aos da SEFAZ.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        {input('cnpj', 'CNPJ', 'sm:col-span-3', { inputMode: 'numeric' })}
        {input('inscricao_estadual', 'Inscrição estadual (no DF: CF/DF)', 'sm:col-span-3', { placeholder: 'Só números' })}
        {input('razao_social', 'Razão social', 'sm:col-span-3')}
        {input('nome_fantasia', 'Nome fantasia', 'sm:col-span-3')}
        <FiscalField id="fs-regime" label="Regime tributário" className="sm:col-span-6" hint="Simples Nacional usa CSOSN; Regime Normal usa CST.">
          <Select value={form.regime_tributario} onValueChange={changeRegime}>
            <SelectTrigger id="fs-regime"><SelectValue /></SelectTrigger>
            <SelectContent>{REGIME_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </FiscalField>
        {input('cep', 'CEP', 'sm:col-span-2', { inputMode: 'numeric' })}
        {input('logradouro', 'Rua / avenida', 'sm:col-span-4')}
        {input('numero', 'Número', 'sm:col-span-2')}
        {input('complemento', 'Complemento', 'sm:col-span-4')}
        {input('bairro', 'Bairro', 'sm:col-span-3')}
        {input('municipio', 'Cidade', 'sm:col-span-2')}
        <FiscalField id="fs-uf" label="UF" error={errors.uf} className="sm:col-span-1">
          <Select value={form.uf.toUpperCase()} onValueChange={(v) => onChange({ uf: v })}>
            <SelectTrigger id="fs-uf"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>{UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
          </Select>
        </FiscalField>
        {input('codigo_municipio', 'Código IBGE da cidade (opcional)', 'sm:col-span-3', { inputMode: 'numeric' })}
        {input('telefone', 'Telefone', 'sm:col-span-3', { inputMode: 'tel' })}
      </CardContent>
    </Card>
  );
}
