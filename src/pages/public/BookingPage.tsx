import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBookingThemeOnRoot } from '@/hooks/useBookingThemeOnRoot';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BookingStoreHeader } from '@/components/booking/BookingStoreHeader';

import { BookingSummary } from '@/components/booking/BookingSummary';
import { BookingFloatingSummary } from '@/components/booking/BookingFloatingSummary';
import { useSearchParams } from 'react-router-dom';
import { useStoreSlug } from '@/contexts/StoreSlugContext';
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
  Sparkles,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { shopHomePath } from '@/lib/storePath';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatBrazilianPhone, formatInternationalPhone } from '@/lib/utils';
import { getSpecialDayFor } from '@/lib/specialDays';
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
  const storeSlug = useStoreSlug();
  const [searchParams] = useSearchParams();
  const preselectedProfessionalId = searchParams.get('profissional');
  const preselectedServiceId = searchParams.get('servico');
  const rescheduleToken = searchParams.get('reagendar');

  
  // Store data
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [hasShop, setHasShop] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [manageToken, setManageToken] = useState<string | null>(null);
  
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
  // Quais profissionais fazem cada serviço (professional_services)
  const [professionalServices, setProfessionalServices] = useState<{ professional_id: string; service_id: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Customer data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [confirmationWhatsappSent, setConfirmationWhatsappSent] = useState(false);
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

        // Loja que também vende produtos: mostra o botão "Loja" no cabeçalho
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('is_available', true)
          .then(({ count }) => setHasShop((count ?? 0) > 0));
        
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
          const profIds = profsResult.data.map(p => p.id);
          if (profIds.length > 0) {
            const { data: links } = await (supabase as any)
              .from('professional_services')
              .select('professional_id, service_id')
              .in('professional_id', profIds)
              .eq('is_active', true);
            setProfessionalServices(links || []);
          }
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

  // Pré-selecionar serviço via URL (usado no fluxo de reagendamento)
  useEffect(() => {
    if (!preselectedServiceId || selectedService || services.length === 0) return;
    const service = services.find(s => s.id === preselectedServiceId);
    if (service) {
      setSelectedService(service);
    }
  }, [preselectedServiceId, services, selectedService]);

  // No reagendamento, já preenche nome e WhatsApp do agendamento original (o cliente não precisa digitar de novo)
  useEffect(() => {
    if (!rescheduleToken) return;
    let cancelled = false;
    supabase.functions
      .invoke('booking-magic-link', { body: { action: 'resolve', token: rescheduleToken } })
      .then(({ data }) => {
        const original = data?.booking;
        if (cancelled || !original) return;
        if (original.customer_name) setCustomerName(prev => prev || original.customer_name);
        if (original.customer_phone) {
          let digits = String(original.customer_phone).replace(/\D/g, '');
          if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
          setCustomerPhone(prev => prev || formatBrazilianPhone(digits));
        }
      })
      .catch(() => { /* sem pré-preenchimento: o cliente digita normalmente */ });
    return () => { cancelled = true; };
  }, [rescheduleToken]);

  // No reagendamento, avançar direto para data/hora quando serviço e profissional estiverem prontos
  useEffect(() => {
    if (!rescheduleToken) return;
    if (selectedService && selectedProfessional && currentStep === 'service') {
      setCurrentStep('datetime');
    }
  }, [rescheduleToken, selectedService, selectedProfessional, currentStep]);



  // Serviço realmente mais agendado (90 dias, mín. 5). Sem dados suficientes, não mostra selo.
  const { data: mostBookedServiceId } = useQuery({
    queryKey: ['most-booked-service', store?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).rpc('get_most_booked_service', { p_store_id: store!.id });
      return (data as string | null) ?? null;
    },
    enabled: !!store?.id,
    staleTime: 10 * 60_000,
  });

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

  // Profissionais que fazem o serviço escolhido. Loja sem vínculo cadastrado para o serviço: todos.
  // Profissional sem nenhum serviço marcado também aparece em todos (nunca foi configurado).
  const eligibleProfessionals = useMemo(() => {
    if (!selectedService) return professionals;
    const linked = new Set(
      professionalServices.filter(l => l.service_id === selectedService.id).map(l => l.professional_id)
    );
    if (linked.size === 0) return professionals;
    const configured = new Set(professionalServices.map(l => l.professional_id));
    return professionals.filter(p => linked.has(p.id) || !configured.has(p.id));
  }, [professionals, professionalServices, selectedService]);

  // Mesma regra do eligibleProfessionals, para um serviço qualquer (usado no clique, antes do estado atualizar)
  const eligibleFor = useCallback((service: BookingService | null) => {
    if (!service) return professionals;
    const linked = new Set(
      professionalServices.filter(l => l.service_id === service.id).map(l => l.professional_id)
    );
    if (linked.size === 0) return professionals;
    const configured = new Set(professionalServices.map(l => l.professional_id));
    return professionals.filter(p => linked.has(p.id) || !configured.has(p.id));
  }, [professionals, professionalServices]);

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

  const skipProfessionalStep = isProfessionalPreselected || isProfessionalAuto;
  const visibleSteps: Step[] = skipProfessionalStep
    ? ['service', 'datetime', 'confirm']
    : ['service', 'professional', 'datetime', 'confirm'];

  const showDesktopSummary = !!selectedService && currentStep !== 'service';
  const allowAnyProfessional = (bookingSettings?.allow_any_professional ?? true) && eligibleProfessionals.length > 1;

  // Profissionais cujos horários entram no cálculo (um só, ou todos no "qualquer profissional")
  const targetProfIds = useMemo(
    () => (anyProfessional ? eligibleProfessionals.map(p => p.id) : selectedProfessional ? [selectedProfessional.id] : []),
    [anyProfessional, eligibleProfessionals, selectedProfessional]
  );
  const targetKey = targetProfIds.join(',');
  const hasTarget = targetProfIds.length > 0;

  // Horário de trabalho do(s) profissional(is) no dia da semana escolhido
  const { data: schedulesForDay = [], isLoading: loadingSchedule } = useQuery({
    queryKey: ['professional-schedule-public', targetKey, selectedDate?.getDay()],
    queryFn: async () => {
      if (!hasTarget || selectedDate === undefined) return [];
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('*')
        .in('professional_id', targetProfIds)
        .eq('day_of_week', selectedDate.getDay());
      if (error) {
        console.error('Error fetching professional schedule:', error);
        return [];
      }
      return data || [];
    },
    enabled: hasTarget && !!selectedDate,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  // Dias da semana em que o(s) profissional(is) atendem (para desabilitar no calendário)
  const { data: workingWeekdays } = useQuery({
    queryKey: ['professional-weekdays-public', targetKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('day_of_week, is_available')
        .in('professional_id', targetProfIds);
      if (error) return null;
      return new Set((data || []).filter((r: any) => r.is_available).map((r: any) => r.day_of_week as number));
    },
    enabled: hasTarget,
    staleTime: 5 * 60_000,
  });

  // Bloqueios do(s) profissional(is) na data
  const { data: blocksForDay = [] } = useQuery({
    queryKey: ['professional-blocks-public', targetKey, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!hasTarget || !selectedDate) return [];
      const { data, error } = await supabase
        .from('professional_blocks')
        .select('*')
        .in('professional_id', targetProfIds)
        .eq('block_date', format(selectedDate, 'yyyy-MM-dd'))
        .limit(200);
      if (error) {
        console.error('Error fetching professional blocks:', error);
        return [];
      }
      return data || [];
    },
    enabled: hasTarget && !!selectedDate,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  // Agendamentos existentes do(s) profissional(is) na data
  const { data: bookingsForDay = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings-public', store?.id, targetKey, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!store?.id || !hasTarget || !selectedDate) return [];
      const { data, error } = await (supabase as any)
        .from('booking_availability')
        .select('professional_id, start_time, end_time, status')
        .eq('store_id', store.id)
        .in('professional_id', targetProfIds)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .limit(500);
      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!store?.id && hasTarget && !!selectedDate,
    staleTime: 30_000,
    gcTime: 120_000,
  });

  // Visão de um profissional só (mensagens de "não atende" etc.)
  const professionalSchedule = anyProfessional ? null : (schedulesForDay[0] ?? null);
  const professionalBlocks = anyProfessional ? [] : blocksForDay;

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
    if (selectedDate && getSpecialDayFor(store?.business_hours, selectedDate)?.closed) return 'special_closed';
    if (anyProfessional && selectedDate) {
      return schedulesForDay.some((sc: any) => sc.is_available) ? 'fully_booked' : 'nobody_working';
    }
    if (!selectedProfessional || !selectedDate) return null;
    if (professionalSchedule === null) return 'schedule_not_configured';
    if (professionalSchedule && !professionalSchedule.is_available) return 'not_working';
    if (professionalBlocks.some((b: { is_all_day?: boolean }) => b.is_all_day)) return 'blocked';
    if (selectedDate.toDateString() === new Date().toDateString()) return 'today_passed';
    return 'fully_booked';
  }, [store?.business_hours, anyProfessional, schedulesForDay, selectedProfessional, selectedDate, professionalSchedule, professionalBlocks]);

  // Get no slots message
  const getNoSlotsMessage = () => {
    switch (noSlotsReason) {
      // Sem horário cadastrado para o dia = não atende nesse dia da semana
      case 'not_working':
      case 'schedule_not_configured':
        return `${selectedProfessional?.name?.split(' ')[0] || 'O profissional'} não atende neste dia da semana`;
      case 'nobody_working': return 'Nenhum profissional atende neste dia da semana';
      case 'special_closed': {
        const sp = selectedDate ? getSpecialDayFor(store?.business_hours, selectedDate) : null;
        return `Fechado nesta data${sp?.name ? ` (${sp.name})` : ''}`;
      }
      case 'blocked': return 'Profissional indisponível nesta data';
      case 'today_passed': return 'Nenhum horário disponível para hoje';
      default: return 'Nenhum horário disponível para esta data';
    }
  };

  // Horários livres por profissional (mesma lógica do painel). Retorna horário → profissionais livres.
  const slotsByTime = useMemo(() => {
    const result = new Map<string, string[]>();
    if (!selectedDate || !selectedService) return result;

    const now = new Date();
    const slotInterval = bookingSettings?.slot_interval_minutes || 30;
    const minAdvanceHours = bookingSettings?.min_advance_hours ?? 2;
    const minAllowedDateTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
    const serviceDuration = selectedService.duration_minutes || 30;
    const totalServiceTime = serviceDuration + (selectedService.buffer_minutes || 0);

    // Dia especial da loja (feriado/véspera): fechado = sem horários; aberto = limita ao horário do dia
    const special = getSpecialDayFor(store?.business_hours, selectedDate);
    if (special?.closed) return result;
    const specialOpen = special ? timeToMinutes(special.open) : null;
    const specialClose = special ? timeToMinutes(special.close) : null;

    for (const profId of targetProfIds) {
      const schedule = schedulesForDay.find((sc: any) => sc.professional_id === profId);
      if (!schedule || !schedule.is_available) continue;
      const profBlocks = blocksForDay.filter((b: any) => b.professional_id === profId);
      if (profBlocks.some((b: any) => b.is_all_day)) continue;

      const workStart = timeToMinutes(schedule.start_time);
      const workEnd = timeToMinutes(schedule.end_time);
      const breakStart = schedule.break_start ? timeToMinutes(schedule.break_start) : null;
      const breakEnd = schedule.break_end ? timeToMinutes(schedule.break_end) : null;
      const blockedIntervals = profBlocks
        .filter((b: any) => !b.is_all_day && b.start_time && b.end_time)
        .map((b: any) => ({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) }));
      const occupiedIntervals = bookingsForDay
        .filter((bk: any) => bk.professional_id === profId || (!bk.professional_id && targetProfIds.length === 1))
        .map((bk: any) => ({ start: timeToMinutes(bk.start_time), end: timeToMinutes(bk.end_time) }));

      for (let minutes = workStart; minutes <= workEnd - serviceDuration; minutes += slotInterval) {
        const slotEnd = minutes + totalServiceTime;
        if (specialOpen !== null && minutes < specialOpen) continue;
        if (specialClose !== null && minutes + serviceDuration > specialClose) continue;
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
        if (slotDateTime <= minAllowedDateTime) continue;
        if (breakStart !== null && breakEnd !== null && minutes < breakEnd && slotEnd > breakStart) continue;
        if (blockedIntervals.some(bl => minutes < bl.end && slotEnd > bl.start)) continue;
        if (occupiedIntervals.some(iv => minutes < iv.end && slotEnd > iv.start)) continue;

        const label = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
        result.set(label, [...(result.get(label) || []), profId]);
      }
    }
    return result;
  }, [store?.business_hours, selectedDate, selectedService, targetProfIds, schedulesForDay, blocksForDay, bookingsForDay, bookingSettings?.slot_interval_minutes, bookingSettings?.min_advance_hours, timeToMinutes]);

  const availableSlots = useMemo(() => Array.from(slotsByTime.keys()).sort(), [slotsByTime]);

  // No "qualquer profissional", atribui quem estiver livre no horário e com menos atendimentos no dia
  const pickProfessionalForTime = useCallback((time: string): Professional | null => {
    const free = slotsByTime.get(time) || [];
    if (free.length === 0) return null;
    const load = (id: string) => bookingsForDay.filter((bk: any) => bk.professional_id === id).length;
    const bestId = [...free].sort((a, b) => load(a) - load(b))[0];
    return eligibleProfessionals.find(p => p.id === bestId) || null;
  }, [slotsByTime, bookingsForDay, eligibleProfessionals]);

  // Profissional que de fato vai atender (o escolhido, ou o atribuído no "qualquer profissional")
  const effectiveProfessional = anyProfessional ? assignedProfessional : selectedProfessional;
  const ANY_PROFESSIONAL_DISPLAY: Professional = { id: 'any', name: 'Qualquer profissional', slug: null, photo_url: null, specialty: null };
  const displayProfessional = effectiveProfessional ?? (anyProfessional ? ANY_PROFESSIONAL_DISPLAY : null);

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
    if (!store || !selectedService || !effectiveProfessional || !selectedDate || !selectedTime) {
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
      // 1. Animação enquanto o agendamento é criado (antes eram 3 s parados ANTES de criar)
      setShowConfirmationAnimation(true);
      const minAnimation = new Promise(resolve => setTimeout(resolve, 700));
      
      const endTime = calculateEndTime(selectedTime, selectedService.duration_minutes);
      
      // 3. Criar agendamento via Edge Function segura
      const { data: bookingResponse, error } = await supabase.functions.invoke('create-public-booking', {
        body: {
          store_id: store.id,
          professional_id: effectiveProfessional.id,
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

      await minAnimation;
      setShowConfirmationAnimation(false);

      if (error) {
        // Mostra o motivo que o servidor deu (ex.: "Fechado nesta data (Natal).")
        let serverMessage: string | undefined;
        try { serverMessage = (await (error as any).context?.json?.())?.error; } catch { /* sem corpo */ }
        throw new Error(serverMessage || 'Erro ao criar agendamento. Tente novamente.');
      }

      const bookingData = bookingResponse?.booking;
      if (!bookingData?.id) {
        throw new Error('Agendamento não retornado pela função');
      }
      
      // 6 e 7. Confirmação no WhatsApp e link de gestão em segundo plano: a tela de sucesso
      // aparece na hora e o texto "enviamos no seu WhatsApp" atualiza quando a mensagem sair.
      (async () => {
        try {
          const { data: confirmData, error: confirmError } = await supabase.functions.invoke('booking-confirmation', {
            body: { booking_id: bookingData.id, is_reschedule: !!rescheduleToken }
          });
          setConfirmationWhatsappSent(
            !confirmError && (confirmData?.whatsapp_sent === true || confirmData?.message === 'Confirmação enviada com sucesso')
          );
          if (confirmError) console.error('[BookingPage] Erro ao enviar confirmação:', confirmError);
        } catch (confirmErr) {
          console.error('[BookingPage] Erro na chamada de confirmação:', confirmErr);
        }
      })();
      (async () => {
        try {
          const { data: magicData, error: magicError } = await supabase.functions.invoke('booking-magic-link', {
            body: { action: 'create', booking_id: bookingData.id, skip_whatsapp: true }
          });
          if (magicError) {
            console.error('[BookingPage] Erro ao gerar magic link:', magicError);
            return;
          }
          if (magicData?.token) setManageToken(magicData.token);
        } catch (magicErr) {
          console.error('[BookingPage] Erro no magic link:', magicErr);
        }
      })();

      // 8. Fluxo de reagendamento: liberar o horário antigo só após o novo estar confirmado
      if (rescheduleToken) {
        try {
          const { error: cancelOldError } = await supabase.functions.invoke('booking-magic-link', {
            body: { action: 'cancel_for_reschedule', token: rescheduleToken, new_booking_id: bookingData.id }
          });
          if (cancelOldError) {
            console.error('[BookingPage] Falha ao cancelar agendamento anterior (reagendamento):', cancelOldError);
          }
        } catch (rescheduleErr) {
          console.error('[BookingPage] Erro no cancelamento do reagendamento:', rescheduleErr);
        }
      }

      setSuccess(true);

      toast.success('Agendamento realizado com sucesso!');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error instanceof Error && error.message ? error.message : 'Erro ao criar agendamento. Tente novamente.');
    } finally {
      setShowConfirmationAnimation(false);
      setSubmitting(false);
    }
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'service': return !!selectedService;
      case 'professional': return !!selectedProfessional || anyProfessional;
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
      if (steps[nextStepIndex] === 'professional' && skipProfessionalStep) {
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
      if (steps[prevStepIndex] === 'professional' && skipProfessionalStep) {
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

  if (success && selectedDate && selectedTime && selectedService && effectiveProfessional) {
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
          manageToken={manageToken}
          isReschedule={!!rescheduleToken}
          whatsappSent={confirmationWhatsappSent}
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
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {visibleSteps.map((step, index) => {
              const isActive = currentStep === step;
              const isPast = visibleSteps.indexOf(currentStep) > index;
              
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
        {/* Coluna principal + resumo centralizados (antes ficava tudo à esquerda e metade da tela vazia) */}
        <div className="flex gap-6 max-w-5xl mx-auto">
          {/* Main Column */}
          <div className={cn(
            "flex-1 min-w-0 max-w-2xl mx-auto",
            showDesktopSummary ? "lg:mx-0 lg:max-w-none" : "lg:max-w-3xl"
          )}>
            
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
                  /* Service list: 2 colunas no computador */
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.map((service, index) => (
                      <button
                        key={service.id}
                        className="w-full text-left group"
                        onClick={() => {
                          setSelectedService(service);
                          const onlyOne = !isProfessionalPreselected && eligibleFor(service).length === 1;
                          setTimeout(() => (onlyOne || isProfessionalPreselected ? setCurrentStep('datetime') : setCurrentStep('professional')), 200);
                        }}
                      >
                        <div className={cn(
                          "relative overflow-hidden rounded-2xl border bg-card transition-all duration-200",
                          "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
                          "active:scale-[0.98]",
                          "sm:block flex items-center gap-3 p-2 sm:p-0"
                        )}>
                          {/* "Popular" badge for first service - compact on mobile, full on desktop */}
                          {mostBookedServiceId === service.id && services.length > 2 && service.image_url && (
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
                                {mostBookedServiceId === service.id && services.length > 2 && !service.image_url && (
                                  <Badge className="mb-1 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-semibold">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Mais escolhido
                                  </Badge>
                                )}
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
                ) : anyProfessional ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground text-lg">Qualquer profissional</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">Você escolhe o horário e mostramos quem vai te atender</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setAnyProfessional(false); setAssignedProfessional(null); setSelectedTime(null); }}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl w-full justify-center"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Escolher um profissional
                    </button>
                  </div>
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
                              <Check className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-medium text-foreground">Profissional escolhido</span>
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
                    {allowAnyProfessional && (
                      <button
                        className="w-full text-left group"
                        onClick={() => {
                          setSelectedProfessional(null);
                          setAnyProfessional(true);
                          setAssignedProfessional(null);
                          setSelectedTime(null);
                          setTimeout(() => nextStep(), 200);
                        }}
                      >
                        <div className="rounded-2xl border border-dashed bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 active:scale-[0.98]">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Qualquer profissional</h3>
                              <p className="text-sm text-muted-foreground mt-0.5">Mais horários livres: escolha o horário e a gente encaixa</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </div>
                      </button>
                    )}
                    {eligibleProfessionals.map(prof => (
                      <button
                        key={prof.id}
                        className="w-full text-left group"
                        onClick={() => {
                          setAnyProfessional(false);
                          setAssignedProfessional(null);
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
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
                        (maxDate ? isAfter(date, maxDate) : false) ||
                        (!!workingWeekdays && workingWeekdays.size > 0 && !workingWeekdays.has(date.getDay())) ||
                        !!getSpecialDayFor(store?.business_hours, date)?.closed
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
                        {(() => {
                          const sp = selectedDate ? getSpecialDayFor(store?.business_hours, selectedDate) : null;
                          return sp && !sp.closed ? (
                            <p className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 px-3 py-2">
                              Horário especial{sp.name ? ` — ${sp.name}` : ''}: {sp.open} às {sp.close}
                            </p>
                          ) : null;
                        })()}
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
                                if (anyProfessional) setAssignedProfessional(pickProfessionalForTime(time));
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
                        <span className="font-medium text-foreground">{effectiveProfessional?.name}</span>
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
                className={cn(
                  "rounded-xl h-12 px-5 border-foreground/25 text-foreground bg-transparent hover:bg-foreground/10",
                  currentStep === 'service' && "invisible"
                )}
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

          {/* Sidebar Summary - Desktop Only (só depois de escolher o serviço; antes deixava a lista encostada à esquerda) */}
          {showDesktopSummary && (
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
