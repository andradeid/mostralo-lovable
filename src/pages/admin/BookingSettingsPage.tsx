import { useState } from 'react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking } from '@/hooks/useBooking';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import { useStoreModules } from '@/hooks/useStoreModules';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { getSectionStatus, type SectionKey } from '@/lib/bookingSettings/bookingSettingsForm';
import { useBookingSettingsStore } from '@/hooks/bookingSettings/useBookingSettingsStore';
import { useBookingSettingsForm } from '@/hooks/bookingSettings/useBookingSettingsForm';
import { useBookingSettingsTests } from '@/hooks/bookingSettings/useBookingSettingsTests';
import { BookingSettingsHeader } from '@/components/admin/booking-settings/BookingSettingsHeader';
import { BookingSettingsTabs } from '@/components/admin/booking-settings/BookingSettingsTabs';
import { AgendaSection } from '@/components/admin/booking-settings/AgendaSection';
import { RegrasSection } from '@/components/admin/booking-settings/RegrasSection';
import { LocalizacaoSection } from '@/components/admin/booking-settings/LocalizacaoSection';
import { AparenciaSection } from '@/components/admin/booking-settings/AparenciaSection';
import { AutomacaoSection } from '@/components/admin/booking-settings/AutomacaoSection';
import { ComunicacaoSection } from '@/components/admin/booking-settings/ComunicacaoSection';
import { PagamentosSection } from '@/components/admin/booking-settings/PagamentosSection';
import { AvaliacoesSection } from '@/components/admin/booking-settings/AvaliacoesSection';
import { TestesSection } from '@/components/admin/booking-settings/TestesSection';

// Configurações de Agendamento do painel. Só orquestra: dados e ações em
// src/hooks/bookingSettings/, uma aba por componente em src/components/admin/booking-settings/
// e regras puras em src/lib/bookingSettings/.
export default function BookingSettingsPage() {
  const { storeId } = useStoreAccess();
  const { bookingSettings, updateSettings } = useBooking(storeId);
  const { hasConnectedWhatsApp, isLoading: isLoadingWhatsApp } = useWhatsAppStatus(storeId);
  const { hasModule, loading: isLoadingModules } = useStoreModules(storeId);

  const hasWhatsAppModule = hasModule('whatsapp_connection') || hasModule('whatsapp_chat') || hasModule('whatsapp_recovery');

  const [activeSection, setActiveSection] = useState<SectionKey>('agenda');
  const store = useBookingSettingsStore(storeId);
  const { storeLocation, efiInfo } = store;
  const { formData, setFormData, isSaving, handleSave, updateField } = useBookingSettingsForm({
    storeId, bookingSettings, updateSettings, efiInfo, setActiveSection,
  });
  const tests = useBookingSettingsTests({ storeId, formData, storeLocation });

  const whatsapp = { isLoadingModules, isLoadingWhatsApp, hasConnectedWhatsApp };

  const sectionRenderers: Record<SectionKey, () => JSX.Element> = {
    agenda: () => <AgendaSection storeLocation={storeLocation} handleBusinessHoursChange={store.handleBusinessHoursChange} />,
    regras: () => <RegrasSection formData={formData} updateField={updateField} />,
    localizacao: () => (
      <LocalizacaoSection
        storeId={storeId}
        storeLocation={storeLocation}
        showMapPicker={store.showMapPicker}
        setShowMapPicker={store.setShowMapPicker}
        handleLocationSelect={store.handleLocationSelect}
        formData={formData}
        updateField={updateField}
      />
    ),
    aparencia: () => <AparenciaSection formData={formData} setFormData={setFormData} storeLocation={storeLocation} />,
    automacao: () => <AutomacaoSection formData={formData} setFormData={setFormData} updateField={updateField} />,
    comunicacao: () => (
      <ComunicacaoSection storeId={storeId} formData={formData} updateField={updateField} hasWhatsAppModule={hasWhatsAppModule} {...whatsapp} />
    ),
    pagamentos: () => <PagamentosSection formData={formData} updateField={updateField} efiInfo={efiInfo} />,
    avaliacoes: () => (
      <AvaliacoesSection
        formData={formData}
        updateField={updateField}
        shortenedUrl={tests.shortenedUrl}
        setShortenedUrl={tests.setShortenedUrl}
        isShortening={tests.isShortening}
        handleShortenUrl={tests.handleShortenUrl}
        testPhone={tests.testPhone}
        setTestPhone={tests.setTestPhone}
        handleTestReview={tests.handleTestReview}
        isSendingTest={tests.isSendingTest}
      />
    ),
    testes: () => (
      <TestesSection
        formData={formData}
        storeLocation={storeLocation}
        testPhone={tests.testPhone}
        setTestPhone={tests.setTestPhone}
        sendingTestType={tests.sendingTestType}
        sendTestNotification={tests.sendTestNotification}
        {...whatsapp}
      />
    ),
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header fixo */}
      <BookingSettingsHeader handleSave={handleSave} isSaving={isSaving} />

      {/* Horizontal tabs */}
      <BookingSettingsTabs
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        getSectionStatus={(key) => getSectionStatus(key, formData, hasConnectedWhatsApp, storeLocation)}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto pt-4 pb-6">
        {sectionRenderers[activeSection]()}
      </div>

      {/* Botão salvar mobile */}
      <div className="md:hidden border-t pt-3 mt-3">
        <Button onClick={handleSave} disabled={isSaving} className="w-full h-10">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
