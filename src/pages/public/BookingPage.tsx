// Página pública de agendamento (/agendar/<loja>): serviço → profissional → data/hora → confirmar.
// Só orquestra: dados em src/hooks/bookingPage/, regras puras em src/lib/bookingPage/ e
// blocos visuais em src/components/booking/page/.
import { useBookingThemeOnRoot } from '@/hooks/useBookingThemeOnRoot';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BookingStoreHeader } from '@/components/booking/BookingStoreHeader';

import { BookingSummary } from '@/components/booking/BookingSummary';
import { BookingFloatingSummary } from '@/components/booking/BookingFloatingSummary';
import { useSearchParams } from 'react-router-dom';
import { useStoreSlug } from '@/contexts/StoreSlugContext';
import { shopHomePath } from '@/lib/storePath';
import { cn } from '@/lib/utils';
import { BookingSubscriptionBanner } from '@/components/booking/BookingSubscriptionBanner';
import { buildBookingThemeStyle } from '@/lib/colorUtils';
import { canProceedStep } from '@/lib/bookingPage/rules';
import { useBookingPageData } from '@/hooks/bookingPage/useBookingPageData';
import { useBookingSettings } from '@/hooks/bookingPage/useBookingSettings';
import { useBookingCustomerForm } from '@/hooks/bookingPage/useBookingCustomerForm';
import { useBookingSelection } from '@/hooks/bookingPage/useBookingSelection';
import { useBookingSlots } from '@/hooks/bookingPage/useBookingSlots';
import { useBookingSubmit } from '@/hooks/bookingPage/useBookingSubmit';
import { BookingLoadingScreen, BookingNotFoundScreen, BookingPausedScreen } from '@/components/booking/page/BookingPageScreens';
import { BookingStepsBar } from '@/components/booking/page/BookingStepsBar';
import { BookingServiceStep } from '@/components/booking/page/BookingServiceStep';
import { BookingProfessionalStep } from '@/components/booking/page/BookingProfessionalStep';
import { BookingDateTimeStep } from '@/components/booking/page/BookingDateTimeStep';
import { BookingConfirmStep } from '@/components/booking/page/BookingConfirmStep';
import { BookingStepNavigation } from '@/components/booking/page/BookingStepNavigation';

const BookingPage = () => {
  const storeSlug = useStoreSlug();
  const [searchParams] = useSearchParams();
  const preselectedProfessionalId = searchParams.get('profissional');
  const preselectedServiceId = searchParams.get('servico');
  const rescheduleToken = searchParams.get('reagendar');

  const {
    store, hasShop, services, professionals, professionalServices, loading,
    isBookingEnabled, isCheckingChannel, channelMessage,
  } = useBookingPageData(storeSlug);
  const { mostBookedServiceId, bookingSettings } = useBookingSettings(store?.id);
  const form = useBookingCustomerForm(rescheduleToken);
  const sel = useBookingSelection({
    services, professionals, professionalServices, bookingSettings,
    preselectedProfessionalId, preselectedServiceId, rescheduleToken,
  });
  const slots = useBookingSlots({
    storeId: store?.id,
    businessHours: store?.business_hours,
    bookingSettings,
    selectedService: sel.selectedService,
    selectedProfessional: sel.selectedProfessional,
    anyProfessional: sel.anyProfessional,
    eligibleProfessionals: sel.eligibleProfessionals,
    selectedDate: sel.selectedDate,
  });
  const submit = useBookingSubmit({
    store,
    selectedService: sel.selectedService,
    effectiveProfessional: sel.effectiveProfessional,
    selectedDate: sel.selectedDate,
    selectedTime: sel.selectedTime,
    rescheduleToken,
    form,
  });
  const { selectedService, selectedDate, selectedTime, effectiveProfessional, displayProfessional, currentStep } = sel;

  // Tema da loja na página inteira (janelas e popovers inclusive) — antes de qualquer return
  useBookingThemeOnRoot(
    buildBookingThemeStyle({
      theme_primary_color: bookingSettings?.theme_primary_color,
      theme_background_color: bookingSettings?.theme_background_color,
      theme_text_color: bookingSettings?.theme_text_color,
      theme_radius: bookingSettings?.theme_radius,
      theme_font_family: bookingSettings?.theme_font_family,
    }) as any,
    bookingSettings?.theme_mode === 'dark',
    !!bookingSettings
  );

  if (loading || isCheckingChannel) {
    return <BookingLoadingScreen />;
  }

  // Booking channel is disabled - show paused message
  if (!isBookingEnabled && store) {
    return <BookingPausedScreen store={store} channelMessage={channelMessage} />;
  }

  if (!store) {
    return <BookingNotFoundScreen />;
  }

  // Tema customizável + modo embed
  const isEmbed = searchParams.get('embed') === '1';
  const themeStyle = buildBookingThemeStyle({
    theme_primary_color: bookingSettings?.theme_primary_color,
    theme_background_color: bookingSettings?.theme_background_color,
    theme_text_color: bookingSettings?.theme_text_color,
    theme_radius: bookingSettings?.theme_radius,
    theme_font_family: bookingSettings?.theme_font_family,
  });
  const isDarkTheme = bookingSettings?.theme_mode === 'dark';
  const hideHeader = isEmbed && (bookingSettings?.embed_hide_header ?? true);

  if (submit.success && selectedDate && selectedTime && selectedService && effectiveProfessional) {
    return (
      <div
        className={cn('min-h-screen bg-background text-foreground', isDarkTheme && 'dark')}
        style={themeStyle}
      >
        <BookingConfirmation
          variant="full"
          store={store}
          service={{
            name: selectedService.name,
            price: selectedService.price,
            price_type: selectedService.price_type,
            duration_minutes: selectedService.duration_minutes
          }}
          professional={{
            name: effectiveProfessional.name,
            photo_url: effectiveProfessional.photo_url
          }}
          date={selectedDate}
          time={selectedTime}
          onNewBooking={() => window.location.reload()}
          manageToken={submit.manageToken}
          isReschedule={!!rescheduleToken}
          whatsappSent={submit.confirmationWhatsappSent}
          deposit={submit.deposit}
        />
      </div>
    );
  }

  return (
    <div
      className={cn('min-h-screen bg-background text-foreground pb-24 lg:pb-6', isDarkTheme && 'dark')}
      style={themeStyle}
    >
      {/* Header */}
      {!hideHeader && (
        <div>
          <BookingStoreHeader store={store} minimal={currentStep !== 'service'} shopUrl={hasShop ? shopHomePath(store.slug) : null} />
        </div>
      )}
      <div className="container mx-auto px-4">

        {/* Aviso de reagendamento */}
        {rescheduleToken && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            <p className="font-semibold">Reagendando seu horário</p>
            <p className="text-muted-foreground mt-0.5">
              Escolha a nova data e hora. Seu horário atual só será liberado depois que o novo for confirmado.
            </p>
          </div>
        )}

        {/* Subscription Plans Banner */}
        {bookingSettings?.show_subscription_plans && store && (
          <div className="container mx-auto px-4 mt-4">
            <BookingSubscriptionBanner storeId={store.id} storeSlug={store.slug} />
          </div>
        )}
      </div>

      {/* Progress Steps - Premium */}
      <BookingStepsBar visibleSteps={sel.visibleSteps} currentStep={currentStep} goToStep={sel.goToStep} />

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Coluna principal + resumo centralizados (antes ficava tudo à esquerda e metade da tela vazia) */}
        <div className="flex gap-6 max-w-5xl mx-auto">
          {/* Main Column */}
          <div className={cn(
            "flex-1 min-w-0 max-w-2xl mx-auto",
            sel.showDesktopSummary ? "lg:mx-0 lg:max-w-none" : "lg:max-w-3xl"
          )}>

            {/* ==================== STEP 1: SERVICE ==================== */}
            {currentStep === 'service' && (
              <BookingServiceStep
                services={services}
                selectedService={selectedService}
                setSelectedService={sel.setSelectedService}
                mostBookedServiceId={mostBookedServiceId}
                isProfessionalPreselected={sel.isProfessionalPreselected}
                eligibleFor={sel.eligibleFor}
                setCurrentStep={sel.setCurrentStep}
              />
            )}

            {/* ==================== STEP 2: PROFESSIONAL ==================== */}
            {currentStep === 'professional' && (
              <BookingProfessionalStep
                professionals={professionals}
                eligibleProfessionals={sel.eligibleProfessionals}
                anyProfessional={sel.anyProfessional}
                setAnyProfessional={sel.setAnyProfessional}
                selectedProfessional={sel.selectedProfessional}
                setSelectedProfessional={sel.setSelectedProfessional}
                setAssignedProfessional={sel.setAssignedProfessional}
                setSelectedTime={sel.setSelectedTime}
                allowAnyProfessional={sel.allowAnyProfessional}
                nextStep={sel.nextStep}
              />
            )}

            {/* ==================== STEP 3: DATE/TIME ==================== */}
            {currentStep === 'datetime' && (
              <BookingDateTimeStep
                businessHours={store?.business_hours}
                selectedDate={selectedDate}
                setSelectedDate={sel.setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={sel.setSelectedTime}
                maxDate={slots.maxDate}
                workingWeekdays={slots.workingWeekdays}
                loadingSlots={slots.loadingSlots}
                availableSlots={slots.availableSlots}
                getNoSlotsMessage={slots.getNoSlotsMessage}
                anyProfessional={sel.anyProfessional}
                setAssignedProfessional={sel.setAssignedProfessional}
                pickProfessionalForTime={slots.pickProfessionalForTime}
                setCurrentStep={sel.setCurrentStep}
              />
            )}

            {/* ==================== STEP 4: CONFIRM ==================== */}
            {currentStep === 'confirm' && (
              <BookingConfirmStep
                selectedService={selectedService}
                effectiveProfessional={effectiveProfessional}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                expectedDeposit={sel.expectedDeposit}
                bookingSettings={bookingSettings}
                form={form}
              />
            )}

            {/* Navigation Buttons */}
            <BookingStepNavigation
              currentStep={currentStep}
              prevStep={sel.prevStep}
              handleSubmit={submit.handleSubmit}
              canProceed={canProceedStep(currentStep, {
                selectedService,
                selectedProfessional: sel.selectedProfessional,
                anyProfessional: sel.anyProfessional,
                selectedDate,
                selectedTime,
                customerName: form.customerName,
                customerPhone: form.customerPhone,
              })}
              submitting={submit.submitting}
              showConfirmationAnimation={submit.showConfirmationAnimation}
            />
          </div>

          {/* Sidebar Summary - Desktop Only (só depois de escolher o serviço; antes deixava a lista encostada à esquerda) */}
          {sel.showDesktopSummary && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <BookingSummary
                service={selectedService}
                professional={displayProfessional}
                date={selectedDate}
                time={selectedTime}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating Summary - Mobile Only */}
      <BookingFloatingSummary
        service={selectedService}
        professional={displayProfessional}
        date={selectedDate}
        time={selectedTime}
      />
    </div>
  );
};

export default BookingPage;
