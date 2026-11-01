// Escolhas do cliente e passos da página de agendamento: serviço, profissional (ou "qualquer
// profissional"), data e hora; pré-seleção pela URL (?profissional=, ?servico=), atalho do
// reagendamento e o passo "profissional" que some quando só um profissional faz o serviço.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BookingService, Professional, ProfessionalServiceLink, Step } from '@/lib/bookingPage/types';
import { eligibleProfessionalsFor, expectedBookingDeposit, nextStepOf, prevStepOf } from '@/lib/bookingPage/rules';
import type { PublicBookingSettings } from './useBookingSettings';

interface Params {
  services: BookingService[];
  professionals: Professional[];
  professionalServices: ProfessionalServiceLink[];
  bookingSettings: PublicBookingSettings;
  preselectedProfessionalId: string | null;
  preselectedServiceId: string | null;
  rescheduleToken: string | null;
}

export function useBookingSelection({
  services,
  professionals,
  professionalServices,
  bookingSettings,
  preselectedProfessionalId,
  preselectedServiceId,
  rescheduleToken,
}: Params) {
  // Selection state
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [isProfessionalPreselected, setIsProfessionalPreselected] = useState(false);
  // Só um profissional faz o serviço escolhido (ou a loja tem um só): escolhido automaticamente e o passo some
  const [isProfessionalAuto, setIsProfessionalAuto] = useState(false);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  // "Qualquer profissional": o cliente escolhe o horário e o sistema atribui quem estiver livre
  const [anyProfessional, setAnyProfessional] = useState(false);
  const [assignedProfessional, setAssignedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Pre-selecionar profissional se vier da URL (aceita tanto ID quanto slug)
  useEffect(() => {
    if (preselectedProfessionalId && professionals.length > 0 && !selectedProfessional) {
      const professional = professionals.find(
        p => p.id === preselectedProfessionalId || p.slug === preselectedProfessionalId
      );
      if (professional) {
        setSelectedProfessional(professional);
        setIsProfessionalPreselected(true);
        // Manter no step de serviço
        if (!selectedService) {
          setCurrentStep('service');
        }
      }
    }
  }, [preselectedProfessionalId, professionals, selectedProfessional, selectedService]);

  // Pré-selecionar serviço via URL (usado no fluxo de reagendamento)
  useEffect(() => {
    if (!preselectedServiceId || selectedService || services.length === 0) return;
    const service = services.find(s => s.id === preselectedServiceId);
    if (service) {
      setSelectedService(service);
    }
  }, [preselectedServiceId, services, selectedService]);

  // No reagendamento, avançar direto para data/hora quando serviço e profissional estiverem prontos
  useEffect(() => {
    if (!rescheduleToken) return;
    if (selectedService && selectedProfessional && currentStep === 'service') {
      setCurrentStep('datetime');
    }
  }, [rescheduleToken, selectedService, selectedProfessional, currentStep]);

  // Sinal previsto (mesma conta do servidor) para avisar antes de confirmar
  const expectedDeposit = useMemo(
    () => expectedBookingDeposit(bookingSettings, selectedService),
    [bookingSettings, selectedService]
  );

  // Profissionais que fazem o serviço escolhido. Loja sem vínculo cadastrado para o serviço: todos.
  // Profissional sem nenhum serviço marcado também aparece em todos (nunca foi configurado).
  const eligibleProfessionals = useMemo(
    () => eligibleProfessionalsFor(selectedService, professionals, professionalServices),
    [professionals, professionalServices, selectedService]
  );

  // Mesma regra do eligibleProfessionals, para um serviço qualquer (usado no clique, antes do estado atualizar)
  const eligibleFor = useCallback(
    (service: BookingService | null) => eligibleProfessionalsFor(service, professionals, professionalServices),
    [professionals, professionalServices]
  );

  useEffect(() => {
    if (isProfessionalPreselected || !selectedService) return;
    if (eligibleProfessionals.length === 1) {
      if (selectedProfessional?.id !== eligibleProfessionals[0].id || !isProfessionalAuto) {
        setSelectedProfessional(eligibleProfessionals[0]);
        setAnyProfessional(false);
        setIsProfessionalAuto(true);
      }
    } else if (isProfessionalAuto) {
      setIsProfessionalAuto(false);
      setSelectedProfessional(null);
    }
  }, [eligibleProfessionals, selectedService, isProfessionalPreselected, isProfessionalAuto, selectedProfessional]);

  // Loja com um só profissional: o passo nem aparece na barra, desde o início
  const skipProfessionalStep = isProfessionalPreselected || isProfessionalAuto || professionals.length === 1;
  const visibleSteps: Step[] = skipProfessionalStep
    ? ['service', 'datetime', 'confirm']
    : ['service', 'professional', 'datetime', 'confirm'];

  const showDesktopSummary = !!selectedService && currentStep !== 'service';
  const allowAnyProfessional = (bookingSettings?.allow_any_professional ?? true) && eligibleProfessionals.length > 1;

  // Profissional que de fato vai atender (o escolhido, ou o atribuído no "qualquer profissional")
  const effectiveProfessional = anyProfessional ? assignedProfessional : selectedProfessional;
  const ANY_PROFESSIONAL_DISPLAY: Professional = { id: 'any', name: 'Qualquer profissional', slug: null, photo_url: null, specialty: null };
  const displayProfessional = effectiveProfessional ?? (anyProfessional ? ANY_PROFESSIONAL_DISPLAY : null);

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    const next = nextStepOf(currentStep, skipProfessionalStep);
    if (next) setCurrentStep(next);
  };

  const prevStep = () => {
    const prev = prevStepOf(currentStep, skipProfessionalStep);
    if (prev) setCurrentStep(prev);
  };

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups: Record<string, BookingService[]> = {};
    services.forEach(s => {
      const key = s.category_id || '_uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [services]);

  return {
    currentStep, setCurrentStep,
    isProfessionalPreselected,
    selectedService, setSelectedService,
    selectedProfessional, setSelectedProfessional,
    anyProfessional, setAnyProfessional,
    assignedProfessional, setAssignedProfessional,
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    expectedDeposit,
    eligibleProfessionals,
    eligibleFor,
    skipProfessionalStep,
    visibleSteps,
    showDesktopSummary,
    allowAnyProfessional,
    effectiveProfessional,
    displayProfessional,
    goToStep,
    nextStep,
    prevStep,
    groupedServices,
  };
}

export type BookingSelection = ReturnType<typeof useBookingSelection>;
