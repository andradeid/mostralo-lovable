// Formulário das configurações de agendamento: carrega o que está salvo, troca campos
// e salva (com a checagem do sinal antes). Código movido da BookingSettingsPage sem mudança.
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { useBooking } from '@/hooks/useBooking';
import {
  DEFAULT_SETTINGS,
  bookingSettingsFormFromRow,
  type SectionKey,
} from '@/lib/bookingSettings/bookingSettingsForm';

type BookingApi = ReturnType<typeof useBooking>;

interface Params {
  storeId: string | null;
  bookingSettings: BookingApi['bookingSettings'];
  updateSettings: BookingApi['updateSettings'];
  efiInfo: { active: boolean; commission: number };
  setActiveSection: (section: SectionKey) => void;
}

export function useBookingSettingsForm({ storeId, bookingSettings, updateSettings, efiInfo, setActiveSection }: Params) {
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (bookingSettings) {
      setFormData(bookingSettingsFormFromRow(bookingSettings));
    }
  }, [bookingSettings]);

  const handleSave = async () => {
    if (!storeId) return;
    if (formData.require_deposit) {
      if (formData.deposit_payment_mode === 'store' && !formData.pix_key?.trim()) {
        setActiveSection('pagamentos');
        toast.error('Informe a chave Pix da loja para receber o sinal');
        return;
      }
      if (formData.deposit_payment_mode === 'mostralo' && !efiInfo.active) {
        setActiveSection('pagamentos');
        toast.error('Ative a conta de pagamento online (EFI) para receber o sinal pelo Mostralo');
        return;
      }
    }
    setIsSaving(true);
    try { await updateSettings({ store_id: storeId, ...formData }); } finally { setIsSaving(false); }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return { formData, setFormData, isSaving, handleSave, updateField };
}
