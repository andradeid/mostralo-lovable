import { useState, useEffect, useMemo, useCallback } from 'react';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BookingStoreHeader } from '@/components/booking/BookingStoreHeader';

import { BookingSummary } from '@/components/booking/BookingSummary';
import { BookingFloatingSummary } from '@/components/booking/BookingFloatingSummary';
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
  CheckCircle2,
  MapPin,
  CalendarPlus,
  RefreshCw,
  Scissors,
  Star,
  Shield,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatBrazilianPhone, formatInternationalPhone } from '@/lib/utils';
import { z } from 'zod';
import { useCheckSalesChannel } from '@/hooks/useCheckSalesChannel';
import { SalesChannelPausedBanner } from '@/components/shared/SalesChannelPausedBanner';
import { BookingSubscriptionBanner } from '@/components/booking/BookingSubscriptionBanner';
import { useQuery } from '@tanstack/react-query';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { buildBookingThemeStyle } from '@/lib/colorUtils';


// Types
interface Professional {
  id: string;
  name: string;
  slug: string | null;
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
  category_id?: string | null;
  image_url?: string | null;
}

interface StoreInfo {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  cover_url: string | null;
  instagram: string | null;
  google_maps_link: string | null;
  segment: string | null;
  latitude: number | null;
  longitude: number | null;
  business_hours: any;
}

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
  const preselectedServiceId = searchParams.get('servico');
  const rescheduleToken = searchParams.get('reagendar');

  
  // Store data
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [manageToken, setManageToken] = useState<string | null>(null);
  
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
  
  const [countryCode, setCountryCode] = useState('+55');
  const [showConfirmationAnimation, setShowConfirmationAnimation] = useState(false);
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
          .from('public_stores')
          .select('id, name, logo_url, slug, address, city, state, phone, whatsapp, description, cover_url, instagram, google_maps_link, segment, latitude, longitude, business_hours')
          .eq('slug', storeSlug)
          .maybeSingle();
        
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
          .select('id, name, description, duration_minutes, price, price_type, category_id, image_url')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (servicesResult.data) {
          setServices(servicesResult.data);
        }
        
        // Fetch professionals
        const profsResult = await client
          .from('professionals')
          .select('id, name, slug, photo_url, specialty')
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
    enabled: !!store?.id,
    staleTime: 5 * 60_000, // 5min — configs raramente mudam
    gcTime: 10 * 60_000,
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
    enabled: !!selectedProfessional && !!selectedDate,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
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
        .eq('block_date', format(selectedDate, 'yyyy-MM-dd'))
        .limit(50);
      if (error) {
        console.error('Error fetching professional blocks:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedProfessional && !!selectedDate,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  // Fetch existing bookings for the selected professional and date
  const { data: existingBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings-public', store?.id, selectedProfessional?.id, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!store?.id || !selectedProfessional || !selectedDate) return [];
      const { data, error } = await (supabase as any)
        .from('booking_availability')
        .select('start_time, end_time, status')
        .eq('store_id', store.id)
        .eq('professional_id', selectedProfessional.id)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .limit(200);
      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!store?.id && !!selectedProfessional && !!selectedDate,
    staleTime: 30_000, // 30s — slots não mudam tão rápido
    gcTime: 120_000,
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
      // 1. Mostrar animação de confirmação por 3 segundos
      setShowConfirmationAnimation(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setShowConfirmationAnimation(false);
      
      const endTime = calculateEndTime(selectedTime, selectedService.duration_minutes);
      
      // 3. Criar agendamento via Edge Function segura
      const { data: bookingResponse, error } = await supabase.functions.invoke('create-public-booking', {
        body: {
          store_id: store.id,
          professional_id: selectedProfessional.id,
          service_id: selectedService.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTime + ':00',
          end_time: endTime + ':00',
          price: selectedService.price,
          notes: notes.trim() || null,
          status: 'confirmed'
        }
      });

      if (error) throw error;

      const bookingData = bookingResponse?.booking;
      if (!bookingData?.id) {
        throw new Error('Agendamento não retornado pela função');
      }
      
      // 6. Enviar confirmação via WhatsApp
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

        // 7. Gerar token e enviar link mágico (captura token para exibir botão de gestão)
        (async () => {
          try {
            console.log('[BookingPage] Gerando magic link para agendamento:', bookingData.id);
            const { data: magicData, error: magicError } = await supabase.functions.invoke('booking-magic-link', {
              body: { action: 'create', booking_id: bookingData.id, skip_whatsapp: true }
            });
            if (magicError) {
              console.error('[BookingPage] Erro ao gerar magic link:', magicError);
              return;
            }
            if (magicData?.token) {
              setManageToken(magicData.token);
              console.log('[BookingPage] Magic link gerado com sucesso');
            }
          } catch (magicErr) {
            console.error('[BookingPage] Erro no magic link:', magicErr);
          }
        })();
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
      case 'confirm': return !!customerName && customerPhone.replace(/\D/g, '').length >= 10;
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

  if (loading || isCheckingChannel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Booking channel is disabled - show paused message
  if (!isBookingEnabled && store) {
    return (
      <div className="min-h-screen bg-background">
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

  if (success && selectedDate && selectedTime && selectedService && selectedProfessional) {
    return (
      <div
        className={cn('min-h-screen bg-background', isDarkTheme && 'dark')}
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
            name: selectedProfessional.name,
            photo_url: selectedProfessional.photo_url
          }}
          date={selectedDate}
          time={selectedTime}
          onNewBooking={() => window.location.reload()}
          manageToken={manageToken}
        />
      </div>
    );
  }

  const stepLabels: Record<Step, string> = {
    service: 'Serviço',
    professional: 'Profissional',
    datetime: 'Data/Hora',
    confirm: 'Confirmar'
  };

  const stepIcons: Record<Step, React.ReactNode> = {
    service: <Scissors className="w-3.5 h-3.5" />,
    professional: <User className="w-3.5 h-3.5" />,
    datetime: <CalendarIcon className="w-3.5 h-3.5" />,
    confirm: <Check className="w-3.5 h-3.5" />,
  };

  return (
    <div
      className={cn('min-h-screen bg-background pb-24 lg:pb-6', isDarkTheme && 'dark')}
      style={themeStyle}
    >
      {/* Header */}
      {!hideHeader && (
        <div>
          <BookingStoreHeader store={store} minimal={currentStep !== 'service'} />
        </div>
      )}
      <div className="container mx-auto px-4">
        
        
        {/* Subscription Plans Banner */}
        {bookingSettings?.show_subscription_plans && store && (
          <div className="container mx-auto px-4 mt-4">
            <BookingSubscriptionBanner storeId={store.id} storeSlug={store.slug} />
          </div>
        )}
      </div>

      {/* Progress Steps - Premium */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {(['service', 'professional', 'datetime', 'confirm'] as Step[]).map((step, index) => {
              const isActive = currentStep === step;
              const isPast = ['service', 'professional', 'datetime', 'confirm'].indexOf(currentStep) > index;
              
              return (
                <div key={step} className="flex items-center">
                  {index > 0 && (
                    <div className={cn(
                      "w-6 sm:w-10 h-0.5 mx-0.5 sm:mx-1 rounded-full transition-colors duration-300",
                      isPast ? "bg-primary" : "bg-border"
                    )} />
                  )}
                  <button
                    onClick={() => isPast && goToStep(step)}
                    disabled={!isPast}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300",
                      isActive && "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                      isPast && "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                      !isActive && !isPast && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isPast ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      stepIcons[step]
                    )}
                    <span className="hidden sm:inline">{stepLabels[step]}</span>
                    <span className="sm:hidden">{index + 1}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Column */}
          <div className="flex-1 max-w-2xl mx-auto lg:mx-0">
            
            {/* ==================== STEP 1: SERVICE ==================== */}
            {currentStep === 'service' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Escolha o serviço</h2>
                  <p className="text-sm text-muted-foreground mt-1">Selecione o que você precisa</p>
                </div>
                
                {services.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Scissors className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum serviço disponível no momento</p>
                    </CardContent>
                  </Card>
                ) : selectedService ? (
                  /* Selected service card - rich */
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
                      {selectedService.image_url && (
                        <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
                          <img
                            src={selectedService.image_url}
                            alt={selectedService.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 z-10">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {!selectedService.image_url && (
                            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <Scissors className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pr-10">
                            <h3 className="font-bold text-foreground text-lg">{selectedService.name}</h3>
                            {selectedService.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedService.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3">
                              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDuration(selectedService.duration_minutes)}
                              </span>
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(selectedService.price, selectedService.price_type)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedService(null)}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl w-full justify-center"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Alterar serviço
                    </button>
                  </div>
                ) : (
                  /* Service list */
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <button
                        key={service.id}
                        className="w-full text-left group"
                        onClick={() => {
                          setSelectedService(service);
                          setTimeout(() => nextStep(), 200);
                        }}
                      >
                        <div className={cn(
                          "relative overflow-hidden rounded-2xl border bg-card transition-all duration-200",
                          "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
                          "active:scale-[0.98]",
                          "sm:block flex items-center gap-3 p-2 sm:p-0"
                        )}>
                          {/* "Popular" badge for first service - compact on mobile, full on desktop */}
                          {index === 0 && services.length > 2 && (
                            <>
                              {/* Mobile: small star icon over thumb */}
                              <div className="absolute top-1 left-1 z-10 sm:hidden">
                                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center shadow-sm ring-2 ring-background">
                                  <Sparkles className="w-3 h-3" />
                                </div>
                              </div>
                              {/* Desktop: full badge */}
                              <div className="absolute top-2 left-2 z-10 hidden sm:block">
                                <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-semibold shadow-sm">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Mais escolhido
                                </Badge>
                              </div>
                            </>
                          )}
                          {service.image_url && (
                            <div className="relative bg-muted overflow-hidden flex-shrink-0 w-[72px] h-[72px] rounded-xl sm:w-full sm:h-auto sm:aspect-[16/9] sm:rounded-none">
                              <img
                                src={service.image_url}
                                alt={service.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 sm:p-4">
                            <div className="flex items-center gap-2">
                              {!service.image_url && (
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                                  <Scissors className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{service.name}</h3>
                                {service.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                                )}
                                <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDuration(service.duration_minutes)}
                                  </span>
                                  <span>•</span>
                                  <span className="font-semibold text-primary text-sm">
                                    {formatPrice(service.price, service.price_type)}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== STEP 2: PROFESSIONAL ==================== */}
            {currentStep === 'professional' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Escolha o profissional</h2>
                  <p className="text-sm text-muted-foreground mt-1">Quem você prefere?</p>
                </div>
                
                {professionals.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum profissional disponível</p>
                    </CardContent>
                  </Card>
                ) : selectedProfessional ? (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
                      <div className="absolute top-3 right-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {selectedProfessional.photo_url ? (
                              <img 
                                src={selectedProfessional.photo_url} 
                                alt={selectedProfessional.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-7 w-7 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground text-lg">{selectedProfessional.name}</h3>
                            {selectedProfessional.specialty && (
                              <p className="text-sm text-muted-foreground mt-0.5">{selectedProfessional.specialty}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium text-foreground">Profissional verificado</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProfessional(null)}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl w-full justify-center"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Alterar profissional
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {professionals.map(prof => (
                      <button
                        key={prof.id}
                        className="w-full text-left group"
                        onClick={() => {
                          setSelectedProfessional(prof);
                          setTimeout(() => nextStep(), 200);
                        }}
                      >
                        <div className={cn(
                          "rounded-2xl border bg-card p-4 transition-all duration-200",
                          "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
                          "active:scale-[0.98]"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
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
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{prof.name}</h3>
                              {prof.specialty && (
                                <p className="text-sm text-muted-foreground mt-0.5">{prof.specialty}</p>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs text-muted-foreground">Disponível</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== STEP 3: DATE/TIME ==================== */}
            {currentStep === 'datetime' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Escolha a data e horário</h2>
                  <p className="text-sm text-muted-foreground mt-1">Quando fica melhor para você?</p>
                </div>
                
                <Card className="overflow-hidden rounded-2xl">
                  <CardContent className="p-3 sm:p-4">
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
                      className="rounded-xl border-0 pointer-events-auto mx-auto"
                    />
                  </CardContent>
                </Card>
                
                {selectedDate && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </h3>
                      {startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime() && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          Agora: {format(new Date(), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    {loadingSlots ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="flex items-start gap-3 text-muted-foreground text-sm bg-muted/50 p-4 rounded-xl">
                        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{getNoSlotsMessage()}</p>
                          <p className="text-xs mt-1">Tente selecionar outra data</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Highlight first available slot */}
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-primary" />
                          {availableSlots.length} horário{availableSlots.length > 1 ? 's' : ''} disponíve{availableSlots.length > 1 ? 'is' : 'l'}
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {availableSlots.map((time, index) => (
                            <button
                              key={time}
                              onClick={() => {
                                setSelectedTime(time);
                                setTimeout(() => {
                                  setCurrentStep('confirm');
                                }, 250);
                              }}
                              className={cn(
                                "relative py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 text-center",
                                selectedTime === time
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105"
                                  : "bg-card border hover:border-primary/40 hover:bg-primary/5 text-foreground",
                                index === 0 && !selectedTime && "ring-2 ring-primary/20"
                              )}
                            >
                              {time}
                              {index === 0 && !selectedTime && (
                                <span className="absolute -top-1.5 -right-1 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">
                                  Próx.
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ==================== STEP 4: CONFIRM ==================== */}
            {currentStep === 'confirm' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Quase lá! ✨</h2>
                  <p className="text-sm text-muted-foreground mt-1">Confirme os dados e finalize seu agendamento</p>
                </div>
                
                {/* Booking Summary - Rich */}
                <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground text-sm">Resumo do agendamento</h3>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Scissors className="w-3.5 h-3.5" /> Serviço
                        </span>
                        <span className="font-medium text-foreground">{selectedService?.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-3.5 h-3.5" /> Profissional
                        </span>
                        <span className="font-medium text-foreground">{selectedProfessional?.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="w-3.5 h-3.5" /> Data
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" /> Horário
                        </span>
                        <span className="font-medium text-foreground">{selectedTime}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2.5 border-t border-border">
                        <span className="text-sm font-medium text-foreground">Total</span>
                        <span className="text-lg font-bold text-primary">
                          {selectedService && formatPrice(selectedService.price, selectedService.price_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Customer Form */}
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Seus dados
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Nome completo *</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Como devemos te chamar?"
                        className={cn("mt-1.5 rounded-xl h-11", errors.customerName && 'border-destructive')}
                      />
                      {errors.customerName && (
                        <p className="text-destructive text-xs mt-1">{errors.customerName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4 text-emerald-500" />
                        Telefone/WhatsApp *
                      </Label>
                      
                      <div className="flex gap-2">
                        <CountryCodeSelect
                          value={countryCode}
                          onChange={setCountryCode}
                        />
                        
                        <Input
                          id="phone"
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => {
                            const formatted = countryCode === '+55'
                              ? formatBrazilianPhone(e.target.value)
                              : formatInternationalPhone(e.target.value);
                            setCustomerPhone(formatted);
                          }}
                          placeholder={countryCode === '+55' ? '(00) 00000-0000' : 'Número'}
                          maxLength={countryCode === '+55' ? 16 : 20}
                          className={cn(
                            "rounded-xl h-11",
                            errors.customerPhone && 'border-destructive'
                          )}
                        />
                      </div>
                      
                      {errors.customerPhone && (
                        <p className="text-destructive text-xs">{errors.customerPhone}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className={cn("mt-1.5 rounded-xl h-11", errors.customerEmail && 'border-destructive')}
                      />
                      {errors.customerEmail && (
                        <p className="text-destructive text-xs mt-1">{errors.customerEmail}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium">Observações (opcional)</Label>
                      <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Alguma observação especial?"
                        className="mt-1.5 rounded-xl h-11"
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    Dados protegidos
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Confirmação imediata
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 'service'}
                className="rounded-xl h-12 px-5"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              
              {currentStep === 'confirm' && (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting || showConfirmationAnimation}
                  className="rounded-xl h-12 px-5 flex-1 max-w-xs font-semibold shadow-lg shadow-primary/20"
                >
                  {showConfirmationAnimation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Confirmar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar Summary - Desktop Only */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <BookingSummary 
              service={selectedService}
              professional={selectedProfessional}
              date={selectedDate}
              time={selectedTime}
            />
          </div>
        </div>
      </main>

      {/* Floating Summary - Mobile Only */}
      <BookingFloatingSummary
        service={selectedService}
        professional={selectedProfessional}
        date={selectedDate}
        time={selectedTime}
      />
    </div>
  );
};

export default BookingPage;
