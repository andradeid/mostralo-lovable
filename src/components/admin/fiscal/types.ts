import type { FiscalFormErrors, FiscalSettingsForm } from '@/lib/fiscal/settingsForm';

export interface FiscalFormProps {
  form: FiscalSettingsForm;
  errors: FiscalFormErrors;
  onChange: (patch: Partial<FiscalSettingsForm>) => void;
}
