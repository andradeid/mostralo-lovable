import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Loader2, 
  ChevronLeft,
  ChevronRight,
  Check,
  Phone,
  Mail,
  Store,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatBrazilianPhone, formatInternationalPhone } from '@/lib/utils';
import { z } from 'zod';
import { useCheckSalesChannel } from '@/hooks/useCheckSalesChannel';
import { SalesChannelPausedBanner } from '@/components/shared/SalesChannelPausedBanner';
import { useQuery } from '@tanstack/react-query';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { WhatsAppProfilePreview } from '@/components/leads/WhatsAppProfilePreview';

// Types
interface Professional {
  id: string;
  name: string;
  photo_url: string | null;
  specialty: string | null;
}

interface BookingService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes?: number;
  price: number;
  price_type: 'fixed' | 'from';
}

interface StoreInfo {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
}

// TimeSlot interface removed - now using string[] for availableSlots

// Validation schema
const bookingSchema = z.object({
  customerName: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  customerPhone: z.string().trim().min(10, 'Telefone inválido').max(20),
  customerEmail: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().max(500).optional()
});

// Steps
type Step = 'service' | 'professional' | 'datetime' | 'confirm';

const BookingPage = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [searchParams] = useSearchParams();
  const preselectedProfessionalId = searchParams.get('profissional');
  
  // Store data
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Selection state
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [isProfessionalPreselected, setIsProfessionalPreselected] = useState(false);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Customer data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  // WhatsApp validation
  const [countryCode, setCountryCode] = useState('+55');
  const [whatsappValidating, setWhatsappValidating] = useState(false);
  const [whatsappValid, setWhatsappValid] = useState<boolean | null>(null);
  const [whatsappProfile, setWhatsappProfile] = useState<{
    pictureUrl: string | null;
    pushName: string | null;
    formattedNumber: string | null;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if booking channel is enabled
  const { isEnabled: isBookingEnabled, isLoading: isCheckingChannel, message: channelMessage } = useCheckSalesChannel(store?.id, 'booking_enabled');

  // Fetch store and services data
  useEffect(() => {
    const fetchData = async () => {
      if (!storeSlug) return;
      
      setLoading(true);
      try {
        // Fetch store
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, logo_url, slug')
          .eq('slug', storeSlug)
          .single();
        
        if (storeError || !storeData) {
          toast.error('Estabelecimento não encontrado');
          return;
        }
        
        setStore(storeData);
        
        // Fetch services using raw query (tables not in types yet)
        const client = supabase as unknown as {
          from: (table: string) => {
            select: (columns: string) => {
              eq: (col: string, val: string) => {
                eq: (col: string, val: boolean) => {
                  order: (col: string, opts: { ascending: boolean }) => Promise<{ data: BookingService[] | null; error: Error | null }>;
                };
              };
            };
          };
        };
        
        const servicesResult = await client
          .from('booking_services')
          .select('id, name, description, duration_minutes, price, price_type')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (servicesResult.data) {
          setServices(servicesResult.data);
        }
        
        // Fetch professionals
        const profsResult = await client
          .from('professionals')
          .select('id, name, photo_url, specialty')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true }) as unknown as { data: Professional[] | null };
        
        if (profsResult.data) {
          setProfessionals(profsResult.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [storeSlug]);

  // Pre-selecionar profissional se vier da URL
  useEffect(() => {
    if (preselectedProfessionalId && professionals.length > 0 && !selectedProfessional) {
      const professional = professionals.find(p => p.id === preselectedProfessionalId);
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

  // Fetch booking settings for the store
  const { data: bookingSettings } = useQuery({
    queryKey: ['booking-settings-public', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('store_id', store.id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching booking settings:', error);
        return null;
      }
      return data;
    },
    enabled: !!store?.id
  });

  // Fetch professional schedule for the selected day
  const { data: professionalSchedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['professional-schedule-public', selectedProfessional?.id, selectedDate?.getDay()],
    queryFn: async () => {
      if (!selectedProfessional || selectedDate === undefined) return null;
      const dayOfWeek = selectedDate.getDay();
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('*')
        .eq('professional_id', selectedProfessional.id)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();
      if (error) {
        console.error('Error fetching professional schedule:', error);
        return null;
      }
      return data;
    },
    enabled: !!selectedProfessional && !!selectedDate
  });

  // Fetch professional blocks for the selected date
  const { data: professionalBlocks = [] } = useQuery({
    queryKey: ['professional-blocks-public', selectedProfessional?.id, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate) return [];
      const { data, error } = await supabase
        .from('professional_blocks')
        .select('*')
        .eq('professional_id', selectedProfessional.id)
        .eq('block_date', format(selectedDate, 'yyyy-MM-dd'));
      if (error) {
        console.error('Error fetching professional blocks:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedProfessional && !!selectedDate
  });

  // Fetch existing bookings for the selected professional and date
  const { data: existingBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings-public', store?.id, selectedProfessional?.id, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!store?.id || !selectedProfessional || !selectedDate) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('store_id', store.id)
        .eq('professional_id', selectedProfessional.id)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled');
      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!store?.id && !!selectedProfessional && !!selectedDate
  });

  // Helper to convert time string (HH:MM:SS or HH:MM) to minutes
  const timeToMinutes = useCallback((time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }, []);

  // Calculate max date based on booking settings
  const maxDate = useMemo(() => {
    if (bookingSettings?.max_advance_days) {
      return addDays(new Date(), bookingSettings.max_advance_days);
    }
    return undefined;
  }, [bookingSettings?.max_advance_days]);

  // Determine no slots reason
  const noSlotsReason = useMemo(() => {
    if (!selectedProfessional || !selectedDate) return null;
    if (professionalSchedule === null) return 'schedule_not_configured';
    if (professionalSchedule && !professionalSchedule.is_available) return 'not_working';
    if (professionalBlocks.some((b: { is_all_day?: boolean }) => b.is_all_day)) return 'blocked';
    if (selectedDate.toDateString() === new Date().toDateString()) return 'today_passed';
    return 'fully_booked';
  }, [selectedProfessional, selectedDate, professionalSchedule, professionalBlocks]);

  // Get no slots message
  const getNoSlotsMessage = () => {
    switch (noSlotsReason) {
      case 'not_working': return 'Profissional não trabalha neste dia da semana';
      case 'schedule_not_configured': return 'Horários não configurados para este profissional';
      case 'blocked': return 'Profissional indisponível nesta data';
      case 'today_passed': return 'Nenhum horário disponível para hoje';
      default: return 'Nenhum horário disponível para esta data';
    }
  };

  // Generate time slots based on professional schedule (same logic as admin)
  const availableSlots = useMemo(() => {
    // If professional doesn't work this day or has all-day block
    if (!professionalSchedule || !professionalSchedule.is_available) {
      return [];
    }
    if (professionalBlocks.some((b: { is_all_day?: boolean }) => b.is_all_day)) {
      return [];
    }
    if (!selectedDate || !selectedService) return [];

    const slots: string[] = [];
    const now = new Date();
    
    // Use slot interval from settings or default to 30
    const slotInterval = bookingSettings?.slot_interval_minutes || 30;
    
    // Work hours from professional schedule
    const workStart = timeToMinutes(professionalSchedule.start_time);
    const workEnd = timeToMinutes(professionalSchedule.end_time);
    
    // Break time (if exists)
    const breakStart = professionalSchedule.break_start 
      ? timeToMinutes(professionalSchedule.break_start) : null;
    const breakEnd = professionalSchedule.break_end 
      ? timeToMinutes(professionalSchedule.break_end) : null;
    
    // Convert professional blocks to intervals
    const blockedIntervals = professionalBlocks
      .filter((b: { is_all_day?: boolean; start_time?: string; end_time?: string }) => 
        !b.is_all_day && b.start_time && b.end_time)
      .map((b: { start_time: string; end_time: string }) => ({
        start: timeToMinutes(b.start_time),
        end: timeToMinutes(b.end_time)
      }));
    
    // Convert existing bookings to occupied intervals
    const occupiedIntervals = existingBookings.map((booking: { start_time: string; end_time: string }) => ({
      start: timeToMinutes(booking.start_time),
      end: timeToMinutes(booking.end_time)
    }));

    // Service duration for conflict check
    const serviceDuration = selectedService.duration_minutes || 30;
    const serviceBuffer = selectedService.buffer_minutes || 0;
    const totalServiceTime = serviceDuration + serviceBuffer;
    
    // Generate slots within work hours
    for (let minutes = workStart; minutes <= workEnd - serviceDuration; minutes += slotInterval) {
      const slotEnd = minutes + totalServiceTime;
      
      // 1. Apply min_advance_hours filter
      const minAdvanceHours = bookingSettings?.min_advance_hours ?? 2;
      const minAdvanceMs = minAdvanceHours * 60 * 60 * 1000;
      
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      
      const minAllowedDateTime = new Date(now.getTime() + minAdvanceMs);
      if (slotDateTime <= minAllowedDateTime) continue;
      
      // 2. Check if falls within break time
      if (breakStart !== null && breakEnd !== null) {
        if (minutes < breakEnd && slotEnd > breakStart) continue;
      }
      
      // 3. Check professional blocks
      const hasBlockConflict = blockedIntervals.some(
        (block: { start: number; end: number }) => minutes < block.end && slotEnd > block.start
      );
      if (hasBlockConflict) continue;
      
      // 4. Check existing bookings
      const hasBookingConflict = occupiedIntervals.some(
        (interval: { start: number; end: number }) => minutes < interval.end && slotEnd > interval.start
      );
      if (hasBookingConflict) continue;
      
      // Valid slot!
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
    
    return slots;
  }, [selectedDate, selectedService, professionalSchedule, professionalBlocks, existingBookings, bookingSettings?.slot_interval_minutes, bookingSettings?.min_advance_hours, timeToMinutes]);

  // Loading state for slots
  const loadingSlots = loadingSchedule || loadingBookings;

  const formatPrice = (price: number, priceType: 'fixed' | 'from') => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
    return priceType === 'from' ? `A partir de ${formatted}` : formatted;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!store || !selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      return;
    }
    
    // Validate form
    const validation = bookingSchema.safeParse({
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      notes
    });
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    setSubmitting(true);
    
    try {
      const endTime = calculateEndTime(selectedTime, selectedService.duration_minutes);
      
      // 1. Cadastrar cliente de forma simples
      let customerId: string | null = null;
      
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || null,
          notes: notes.trim() || null
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        // Continuar mesmo com erro (fallback)
      } else {
        customerId = newCustomer?.id || null;
      }

      // 2. Aplicar etiqueta "Agendamento Online" automaticamente
      if (customerId) {
        try {
          const { data: originLabel } = await supabase
            .from('customer_labels')
            .select('id')
            .eq('store_id', store.id)
            .eq('name', 'Agendamento Online')
            .single();
          
          if (originLabel) {
            await supabase
              .from('customer_label_assignments')
              .insert({
                customer_id: customerId,
                label_id: originLabel.id,
                store_id: store.id
              });
          }
        } catch (labelError) {
          console.error('Error assigning label:', labelError);
          // Não bloquear o fluxo se falhar
        }
      }

      // 3. Criar booking COM customer_id
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert({
          store_id: store.id,
          professional_id: selectedProfessional.id,
          service_id: selectedService.id,
          customer_id: customerId,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTime + ':00',
          end_time: endTime + ':00',
          price: selectedService.price,
          notes: notes.trim() || null,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // 4. Enviar confirmação via WhatsApp
      if (bookingData?.id) {
        try {
          console.log('[BookingPage] Enviando confirmação para agendamento:', bookingData.id);
          const { error: confirmError } = await supabase.functions.invoke('booking-confirmation', {
            body: { booking_id: bookingData.id }
          });
          
          if (confirmError) {
            console.error('[BookingPage] Erro ao enviar confirmação:', confirmError);
          } else {
            console.log('[BookingPage] Confirmação enviada com sucesso');
          }
        } catch (confirmErr) {
          console.error('[BookingPage] Erro na chamada de confirmação:', confirmErr);
        }
      }
      
      setSuccess(true);
      toast.success('Agendamento realizado com sucesso!');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'service': return !!selectedService;
      case 'professional': return !!selectedProfessional;
      case 'datetime': return !!selectedDate && !!selectedTime;
      case 'confirm': return !!customerName && !!customerPhone && whatsappValid === true;
      default: return false;
    }
  };

  const nextStep = () => {
    const steps: Step[] = ['service', 'professional', 'datetime', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      let nextStepIndex = currentIndex + 1;
      
      // Se profissional foi pré-selecionado, pular o step de profissional
      if (steps[nextStepIndex] === 'professional' && isProfessionalPreselected) {
        nextStepIndex++;
      }
      
      setCurrentStep(steps[nextStepIndex]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['service', 'professional', 'datetime', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      let prevStepIndex = currentIndex - 1;
      
      // Se profissional foi pré-selecionado, pular o step de profissional ao voltar
      if (steps[prevStepIndex] === 'professional' && isProfessionalPreselected) {
        prevStepIndex--;
      }
      
      if (prevStepIndex >= 0) {
        setCurrentStep(steps[prevStepIndex]);
      }
    }
  };

  if (loading || isCheckingChannel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Booking channel is disabled - show paused message
  if (!isBookingEnabled && store) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              {store.logo_url && (
                <img 
                  src={store.logo_url} 
                  alt={store.name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-xl font-bold">{store.name}</h1>
                <p className="text-sm text-muted-foreground">Agendamento Online</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <SalesChannelPausedBanner message={channelMessage} />
          <Card className="mt-4">
            <CardContent className="py-8 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Agendamentos Temporariamente Pausados</h2>
              <p className="text-muted-foreground">
                Entre em contato diretamente com o estabelecimento para realizar seu agendamento.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Estabelecimento não encontrado</h2>
            <p className="text-muted-foreground">Verifique o endereço e tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground mb-4">
              Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
            </p>
            <div className="bg-muted rounded-lg p-4 text-left space-y-2">
              <p><strong>Serviço:</strong> {selectedService?.name}</p>
              <p><strong>Profissional:</strong> {selectedProfessional?.name}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {selectedTime}</p>
            </div>
            <Button 
              className="mt-6 w-full" 
              onClick={() => window.location.reload()}
            >
              Fazer novo agendamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {store.logo_url && (
              <img 
                src={store.logo_url} 
                alt={store.name} 
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-xl font-bold">{store.name}</h1>
              <p className="text-sm text-muted-foreground">Agendamento Online</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            {(['service', 'professional', 'datetime', 'confirm'] as Step[]).map((step, index) => {
              const isActive = currentStep === step;
              const isPast = ['service', 'professional', 'datetime', 'confirm'].indexOf(currentStep) > index;
              const labels = {
                service: 'Serviço',
                professional: 'Profissional',
                datetime: 'Data/Hora',
                confirm: 'Confirmar'
              };
              
              return (
                <div key={step} className="flex items-center">
                  {index > 0 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-1",
                      isPast ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                  <button
                    onClick={() => isPast && goToStep(step)}
                    disabled={!isPast}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
                      isActive && "bg-primary text-primary-foreground",
                      isPast && "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30",
                      !isActive && !isPast && "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className="hidden sm:inline">{labels[step]}</span>
                    <span className="sm:hidden">{index + 1}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Step 1: Service Selection */}
        {currentStep === 'service' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Selecione o serviço</h2>
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Nenhum serviço disponível</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {services.map(service => (
                  <Card 
                    key={service.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedService?.id === service.id && "border-primary ring-2 ring-primary/20"
                    )}
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(service.duration_minutes)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatPrice(service.price, service.price_type)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Professional Selection */}
        {currentStep === 'professional' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Selecione o profissional</h2>
            {professionals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Nenhum profissional disponível</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {professionals.map(prof => (
                  <Card 
                    key={prof.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedProfessional?.id === prof.id && "border-primary ring-2 ring-primary/20"
                    )}
                    onClick={() => setSelectedProfessional(prof)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {prof.photo_url ? (
                            <img 
                              src={prof.photo_url} 
                              alt={prof.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{prof.name}</h3>
                          {prof.specialty && (
                            <p className="text-sm text-muted-foreground">{prof.specialty}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date/Time Selection */}
        {currentStep === 'datetime' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Selecione data e horário</h2>
            
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  disabled={(date) => 
                    isBefore(date, startOfDay(new Date())) || 
                    (maxDate ? isAfter(date, maxDate) : false)
                  }
                  locale={ptBR}
                  className="rounded-md border pointer-events-auto"
                />
              </CardContent>
            </Card>
            
            {selectedDate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    Horários disponíveis em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  {/* Show current time indicator if today */}
                  {startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime() && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      Agora: {format(new Date(), 'HH:mm')}
                    </span>
                  )}
                </div>
                {loadingSlots ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex items-start gap-2 text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{getNoSlotsMessage()}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(time => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 'confirm' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Confirme seus dados</h2>
            
            {/* Booking Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumo do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-medium">{selectedProfessional?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold text-primary">
                    {selectedService && formatPrice(selectedService.price, selectedService.price_type)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Seus Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome"
                    className={errors.customerName ? 'border-destructive' : ''}
                  />
                  {errors.customerName && (
                    <p className="text-destructive text-xs mt-1">{errors.customerName}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    Telefone/WhatsApp *
                  </Label>
                  
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      value={countryCode}
                      onChange={(code) => {
                        setCountryCode(code);
                        setWhatsappValid(null);
                        setWhatsappProfile(null);
                      }}
                    />
                    
                    <div className="relative flex-1">
                      <Input
                        id="phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => {
                          const formatted = countryCode === '+55'
                            ? formatBrazilianPhone(e.target.value)
                            : formatInternationalPhone(e.target.value);
                          setCustomerPhone(formatted);
                          setWhatsappValid(null);
                          setWhatsappProfile(null);
                        }}
                        placeholder={countryCode === '+55' ? '(00) 00000-0000' : 'Número'}
                        maxLength={countryCode === '+55' ? 16 : 20}
                        className={cn(
                          'pr-10',
                          errors.customerPhone && 'border-destructive',
                          whatsappValid === true && 'border-emerald-500',
                          whatsappValid === false && 'border-amber-500'
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {whatsappValidating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {whatsappValid === true && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {whatsappValid === false && <AlertCircle className="h-4 w-4 text-amber-500" />}
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const cleanPhone = customerPhone.replace(/\D/g, '');
                        if (cleanPhone.length < 10) {
                          toast.error('Digite um número de telefone válido');
                          return;
                        }
                        
                        setWhatsappValidating(true);
                        setWhatsappValid(null);
                        setWhatsappProfile(null);
                        
                        const fullPhone = `${countryCode.replace('+', '')}${cleanPhone}`;
                        
                        try {
                          const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
                            body: { phone: fullPhone }
                          });
                          
                          if (error) throw error;
                          
                          if (data?.valid || data?.exists) {
                            setWhatsappValid(true);
                            setWhatsappProfile({
                              pictureUrl: data.profilePictureUrl || null,
                              pushName: data.pushName || null,
                              formattedNumber: data.formattedNumber || fullPhone
                            });
                          } else {
                            setWhatsappValid(false);
                          }
                        } catch (error) {
                          console.error('Erro ao validar WhatsApp:', error);
                          setWhatsappValid(false);
                        } finally {
                          setWhatsappValidating(false);
                        }
                      }}
                      disabled={whatsappValidating || customerPhone.replace(/\D/g, '').length < 10}
                      className="shrink-0"
                    >
                      {whatsappValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validar'}
                    </Button>
                  </div>
                  
                  {errors.customerPhone && (
                    <p className="text-destructive text-xs">{errors.customerPhone}</p>
                  )}
                  
                  {whatsappValid === true && whatsappProfile && (
                    <WhatsAppProfilePreview
                      profilePicture={whatsappProfile.pictureUrl}
                      pushName={whatsappProfile.pushName}
                      formattedNumber={whatsappProfile.formattedNumber}
                      formName={customerName}
                      isPrivatePhoto={!whatsappProfile.pictureUrl}
                      className="animate-fade-in"
                    />
                  )}
                  
                  {whatsappValid === false && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 animate-fade-in">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        Número não encontrado no WhatsApp, mas você pode continuar com o agendamento.
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className={errors.customerEmail ? 'border-destructive' : ''}
                  />
                  {errors.customerEmail && (
                    <p className="text-destructive text-xs mt-1">{errors.customerEmail}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Alguma observação especial?"
                    maxLength={500}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 'service'}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          {currentStep === 'confirm' ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Agendamento
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
