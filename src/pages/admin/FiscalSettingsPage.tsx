// Configurações fiscais da loja (/dashboard/fiscal): ambiente, empresa, impostos padrão, numeração,
// certificado A1 (orientação) e chaves de acesso. Só dono/admin. Peças em components/admin/fiscal.
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { usePageSEO } from '@/hooks/useSEO';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useFiscalSettings } from '@/hooks/fiscal/useFiscalSettings';
import { emptyFiscalForm, fiscalReadiness, formFromRow, validateFiscalForm, type FiscalSettingsForm } from '@/lib/fiscal/settingsForm';
import { FiscalIntroCard } from '@/components/admin/fiscal/FiscalIntroCard';
import { FiscalEnvironmentCard } from '@/components/admin/fiscal/FiscalEnvironmentCard';
import { FiscalCompanyCard } from '@/components/admin/fiscal/FiscalCompanyCard';
import { FiscalDefaultsCard } from '@/components/admin/fiscal/FiscalDefaultsCard';
import { FiscalNumberingCard } from '@/components/admin/fiscal/FiscalNumberingCard';
import { FiscalCertificateStep } from '@/components/admin/fiscal/FiscalCertificateStep';
import { FiscalSecretsCard } from '@/components/admin/fiscal/FiscalSecretsCard';

const FiscalSettingsPage = () => {
  usePageSEO({ title: 'Nota fiscal - Mostralo', description: 'Configuração de NFC-e e NF-e da loja.' });
  const { storeId, hasAccess, isLoading: accessLoading } = useStoreAccess();
  const fiscal = useFiscalSettings(hasAccess ? storeId : null);
  const [form, setForm] = useState<FiscalSettingsForm>(emptyFiscalForm);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!fiscal.loading) setForm(formFromRow(fiscal.row));
  }, [fiscal.row, fiscal.loading]);

  const errors = useMemo(() => validateFiscalForm(form), [form]);
  const readiness = useMemo(() => fiscalReadiness(form, fiscal.secrets), [form, fiscal.secrets]);
  const change = (patch: Partial<FiscalSettingsForm>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (Object.keys(errors).length) {
      setShowErrors(true);
      toast.error(`Confira os campos: ${Object.values(errors)[0]}`);
      return;
    }
    try {
      await fiscal.save.mutateAsync(form);
      setShowErrors(false);
      toast.success('Configuração fiscal salva');
    } catch (e) {
      console.error('Erro ao salvar configuração fiscal:', e);
      toast.error('Não foi possível salvar. Tente de novo.');
    }
  };

  if (accessLoading || (hasAccess && fiscal.loading)) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (fiscal.loadError) {
    return (
      <Alert variant="destructive" className="max-w-3xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>O módulo fiscal ainda não está disponível nesta conta. Fale com o suporte do Mostralo.</AlertDescription>
      </Alert>
    );
  }

  const shown = showErrors ? errors : {};
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      <FiscalIntroCard items={readiness} environment={form.environment} />
      <FiscalEnvironmentCard form={form} errors={shown} onChange={change} />
      <FiscalCompanyCard form={form} errors={shown} onChange={change} />
      <FiscalDefaultsCard form={form} errors={shown} onChange={change} />
      <FiscalNumberingCard form={form} errors={shown} onChange={change} />
      <div className="flex justify-end">
        <Button onClick={save} disabled={fiscal.save.isPending}>
          {fiscal.save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar configuração
        </Button>
      </div>
      <FiscalCertificateStep />
      <FiscalSecretsCard status={fiscal.secrets} saving={fiscal.saveSecrets.isPending} onSave={(v) => fiscal.saveSecrets.mutateAsync(v)} />
    </div>
  );
};

export default FiscalSettingsPage;
