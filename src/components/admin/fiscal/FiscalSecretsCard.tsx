// Chaves de acesso (tokens da Focus e CSC): só gravar. O navegador nunca lê os valores salvos;
// a tela mostra "configurado ✓" (fiscal_secrets_status). Campo vazio = mantém o que já estava.
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import type { FiscalSecretsStatus } from '@/lib/fiscal/settingsForm';
import type { SecretsInput } from '@/hooks/fiscal/useFiscalSettings';
import { FiscalField } from './FiscalField';

const FIELDS: { key: keyof SecretsInput; label: string; status: keyof FiscalSecretsStatus }[] = [
  { key: 'focus_token_homologacao', label: 'Token da Focus — homologação', status: 'token_homologacao' },
  { key: 'focus_token_producao', label: 'Token da Focus — produção', status: 'token_producao' },
  { key: 'csc_id_homologacao', label: 'ID do CSC — homologação', status: 'csc_homologacao' },
  { key: 'csc_homologacao', label: 'CSC — homologação', status: 'csc_homologacao' },
  { key: 'csc_id_producao', label: 'ID do CSC — produção', status: 'csc_producao' },
  { key: 'csc_producao', label: 'CSC — produção', status: 'csc_producao' },
];

export function FiscalSecretsCard({ status, onSave, saving }: {
  status: FiscalSecretsStatus | null; saving: boolean; onSave: (input: SecretsInput) => Promise<unknown>;
}) {
  const [values, setValues] = useState<SecretsInput>({});
  const filled = Object.values(values).some((v) => v && v.trim());

  const save = async () => {
    try {
      await onSave(values);
      setValues({});
      toast.success('Chaves salvas');
    } catch (e) {
      console.error('Erro ao salvar chaves fiscais:', e);
      toast.error((e as { message?: string })?.message || 'Não foi possível salvar as chaves.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5" />Chaves de acesso</CardTitle>
        <CardDescription>
          Ficam guardadas só no servidor; depois de salvas não aparecem mais aqui. Para trocar, digite a nova.
          Se o Mostralo usa uma conta única na Focus, o suporte cuida dos tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <FiscalField key={f.key} id={`sec-${f.key}`} label={f.label}
              hint={status?.[f.status] ? <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="h-3 w-3" />Configurado</span> : 'Não configurado'}>
              <Input id={`sec-${f.key}`} type="password" autoComplete="new-password" placeholder={status?.[f.status] ? '••••••••' : ''}
                value={values[f.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            </FiscalField>
          ))}
        </div>
        <Button onClick={save} disabled={!filled || saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar chaves
        </Button>
      </CardContent>
    </Card>
  );
}
