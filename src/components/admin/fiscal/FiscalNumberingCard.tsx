// Série e próximo número: a Focus numera sozinha. Aqui é só referência (ou para quem já emitia antes).
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { FiscalSettingsForm } from '@/lib/fiscal/settingsForm';
import { FiscalField } from './FiscalField';
import type { FiscalFormProps } from './types';

export function FiscalNumberingCard({ form, errors, onChange }: FiscalFormProps) {
  const input = (key: keyof FiscalSettingsForm, label: string) => (
    <FiscalField id={`fn-${key}`} label={label} error={errors[key]}>
      <Input id={`fn-${key}`} inputMode="numeric" value={String(form[key] ?? '')} onChange={(e) => onChange({ [key]: e.target.value })} />
    </FiscalField>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Numeração</CardTitle>
        <CardDescription>
          A numeração é controlada na Focus. Se a loja já emitia por outro sistema, informe a série e o próximo
          número também no cadastro da empresa na Focus para não repetir notas.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {input('nfce_serie', 'Série NFC-e')}
        {input('nfce_proximo_numero', 'Próximo nº NFC-e')}
        {input('nfe_serie', 'Série NF-e')}
        {input('nfe_proximo_numero', 'Próximo nº NF-e')}
      </CardContent>
    </Card>
  );
}
