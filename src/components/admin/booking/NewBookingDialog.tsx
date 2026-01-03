import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, 
  Clock, 
  Loader2,
  AlertCircle,
  User,
  Scissors,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, startOfDay, isBefore, addDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { ProfessionalWhatsAppValidator, WhatsAppValidationStatus } from './ProfessionalWhatsAppValidator';
import { WhatsAppProfilePreview } from '@/components/leads/WhatsAppProfilePreview';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useBooking, 
  Professional, 
  BookingService, 
  CreateBookingInput 
} from '@/hooks/useBooking';

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  defaultDate?: Date;
  defaultProfessionalId?: string;
  defaultTime?: string;
  onSuccess?: () => void;
}

// Validation schema
const bookingSchema = z.object({
  customerName: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  customerPhone: z.string().trim().min(10, 'Telefone inválido').max(20),
  customerEmail: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().max(500).optional()
});

export function NewBookingDialog({
  open,
  onOpenChange,
  storeId,
  defaultDate,
  defaultProfessionalId,
  defaultTime,
  onSuccess
}: NewBookingDialogProps) {
  const queryClient = useQueryClient();
  const { 
    professionals, 
    bookingServices, 
    createBooking,
    creatingBooking
  } = useBooking(storeId);

  // Form state
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedProfessional, setSelectedProfessional] = useState<string>(defaultProfessionalId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [countryCode, setCountryCode] = useState('+55');
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppValidationStatus>('idle');
  const [whatsappProfile, setWhatsappProfile] = useState<{
    pictureUrl: string | null;
    pushName: string | null;
    formattedNumber: string | null;
  } | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDate(defaultDate);
      setSelectedProfessional(defaultProfessionalId || '');
      setSelectedService('');
      setSelectedTime(defaultTime || '');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setNotes('');
      setErrors({});
      setCountryCode('+55');
      setWhatsappStatus('idle');
      setWhatsappProfile(null);
    }
  }, [open, defaultDate, defaultProfessionalId, defaultTime]);

  // Validate WhatsApp when phone is complete
  const validateWhatsApp = useCallback(async () => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) return;
    
    setWhatsappStatus('validating');
    setWhatsappProfile(null);
    
    const fullPhone = `${countryCode.replace('+', '')}${cleanPhone}`;
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone }
      });
      
      if (error) throw error;
      
      if (data?.valid || data?.exists) {
        setWhatsappStatus('valid');
        setWhatsappProfile({
          pictureUrl: data.profilePictureUrl || null,
          pushName: data.pushName || null,
          formattedNumber: data.formattedNumber || fullPhone
        });
      } else {
        setWhatsappStatus('invalid');
        setWhatsappProfile(null);
      }
    } catch (error) {
      console.error('Erro ao validar WhatsApp:', error);
      setWhatsappStatus('invalid');
      setWhatsappProfile(null);
    }
  }, [customerPhone, countryCode]);

  // Debounce validation
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10 && whatsappStatus === 'idle') {
      const timer = setTimeout(validateWhatsApp, 800);
      return () => clearTimeout(timer);
    }
  }, [customerPhone, validateWhatsApp, whatsappStatus]);

  // Get selected service details
  const service = useMemo(() => 
    bookingServices.find(s => s.id === selectedService),
    [bookingServices, selectedService]
  );

  // Check if all fields are filled to show summary
  const canShowSummary = useMemo(() => {
    return (
      selectedService &&
      selectedProfessional &&
      selectedDate &&
      selectedTime &&
      customerName.trim().length >= 2 &&
      customerPhone.replace(/\D/g, '').length >= 10
    );
  }, [selectedService, selectedProfessional, selectedDate, selectedTime, customerName, customerPhone]);

  // Get selected professional name
  const selectedProfessionalName = useMemo(() => {
    return professionals.find(p => p.id === selectedProfessional)?.name || '';
  }, [professionals, selectedProfessional]);

  // Fetch booking settings for the store
  const { data: bookingSettings } = useQuery({
    queryKey: ['booking-settings', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      
      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching booking settings:', error);
        return null;
      }
      return data;
    },
    enabled: !!storeId
  });

  // Fetch professional schedule for the selected day
  const { data: professionalSchedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['professional-schedule', selectedProfessional, selectedDate?.getDay()],
    queryFn: async () => {
      if (!selectedProfessional || selectedDate === undefined) return null;
      const dayOfWeek = selectedDate.getDay();
      
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('*')
        .eq('professional_id', selectedProfessional)
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
    queryKey: ['professional-blocks', selectedProfessional, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate) return [];
      
      const { data, error } = await supabase
        .from('professional_blocks')
        .select('*')
        .eq('professional_id', selectedProfessional)
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
    queryKey: ['bookings-for-slot', storeId, selectedProfessional, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!storeId || !selectedProfessional || !selectedDate) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('store_id', storeId)
        .eq('professional_id', selectedProfessional)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled');
      
      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!storeId && !!selectedProfessional && !!selectedDate
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
    
    // Check if professional doesn't work this day
    if (professionalSchedule === null) {
      return 'schedule_not_configured';
    }
    if (professionalSchedule && !professionalSchedule.is_available) {
      return 'not_working';
    }
    
    // Check if there's an all-day block
    if (professionalBlocks.some(b => b.is_all_day)) {
      return 'blocked';
    }
    
    // Check if it's today and all times passed
    if (selectedDate.toDateString() === new Date().toDateString()) {
      return 'today_passed';
    }
    
    return 'fully_booked';
  }, [selectedProfessional, selectedDate, professionalSchedule, professionalBlocks]);

  // Get no slots message
  const getNoSlotsMessage = () => {
    switch (noSlotsReason) {
      case 'not_working':
        return 'Profissional não trabalha neste dia da semana';
      case 'schedule_not_configured':
        return 'Horários não configurados para este profissional';
      case 'blocked':
        return 'Profissional indisponível nesta data';
      case 'today_passed':
        return 'Nenhum horário disponível para hoje';
      default:
        return 'Nenhum horário disponível para esta data';
    }
  };

  // Generate time slots based on professional schedule
  const timeSlots = useMemo(() => {
    // If professional doesn't work this day or has all-day block
    if (!professionalSchedule || !professionalSchedule.is_available) {
      return [];
    }
    
    if (professionalBlocks.some(b => b.is_all_day)) {
      return [];
    }

    const slots: string[] = [];
    const now = new Date();
    const isToday = selectedDate && selectedDate.toDateString() === now.toDateString();
    
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
      .filter(b => !b.is_all_day && b.start_time && b.end_time)
      .map(b => ({
        start: timeToMinutes(b.start_time!),
        end: timeToMinutes(b.end_time!)
      }));
    
    // Convert existing bookings to occupied intervals
    const occupiedIntervals = existingBookings.map(booking => ({
      start: timeToMinutes(booking.start_time),
      end: timeToMinutes(booking.end_time)
    }));

    // Service duration for conflict check
    const serviceDuration = service?.duration_minutes || 30;
    const serviceBuffer = service?.buffer_minutes || 0;
    const totalServiceTime = serviceDuration + serviceBuffer;
    
    // Generate slots within work hours
    for (let minutes = workStart; minutes <= workEnd - serviceDuration; minutes += slotInterval) {
      const slotEnd = minutes + totalServiceTime;
      
      // 1. Apply min_advance_hours filter (works for today and near future)
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
        block => minutes < block.end && slotEnd > block.start
      );
      if (hasBlockConflict) continue;
      
      // 4. Check existing bookings
      const hasBookingConflict = occupiedIntervals.some(
        interval => minutes < interval.end && slotEnd > interval.start
      );
      if (hasBookingConflict) continue;
      
      // Valid slot!
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
    
    return slots;
  }, [selectedDate, professionalSchedule, professionalBlocks, existingBookings, service, bookingSettings?.slot_interval_minutes, bookingSettings?.min_advance_hours, timeToMinutes]);

  // Clear selected time if it becomes invalid
  useEffect(() => {
    if (selectedTime && !timeSlots.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [timeSlots, selectedTime]);

  // Check if no slots are available
  const isLoadingAvailability = loadingBookings || loadingSchedule;
  const noSlotsAvailable = selectedDate && selectedProfessional && !isLoadingAvailability && timeSlots.length === 0;

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleSubmit = async () => {
    if (!storeId || !selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validate customer data
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

    try {
      const endTime = calculateEndTime(selectedTime, service?.duration_minutes || 30);
      const bookingDate = format(selectedDate, 'yyyy-MM-dd');
      const startTimeFormatted = selectedTime + ':00';
      const endTimeFormatted = endTime + ':00';

      // Basic conflict verification before saving
      const { data: conflictCheck, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('store_id', storeId)
        .eq('professional_id', selectedProfessional)
        .eq('booking_date', bookingDate)
        .neq('status', 'cancelled')
        .or(`and(start_time.lt.${endTimeFormatted},end_time.gt.${startTimeFormatted})`)
        .limit(1);

      if (conflictError) {
        console.error('Error checking conflict:', conflictError);
      } else if (conflictCheck && conflictCheck.length > 0) {
        toast.error('Este horário acabou de ser reservado. Por favor, escolha outro.');
        // Reload available slots
        queryClient.invalidateQueries({ queryKey: ['bookings-for-slot'] });
        setSelectedTime('');
        return;
      }

      await createBooking({
        store_id: storeId,
        professional_id: selectedProfessional,
        service_id: selectedService,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        booking_date: bookingDate,
        start_time: startTimeFormatted,
        end_time: endTimeFormatted,
        price: service?.price || 0,
        notes: notes.trim() || undefined
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Crie um novo agendamento para um cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Service Selection */}
          <div>
            <Label>Serviço *</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {bookingServices.filter(s => s.is_active).map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} - {formatPrice(s.price)} ({s.duration_minutes}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Professional Selection */}
          <div>
            <Label>Profissional *</Label>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.filter(p => p.is_active).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.specialty && `- ${p.specialty}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data *</Label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      // Ignore past dates
                      if (date && isBefore(date, startOfDay(new Date()))) {
                        return;
                      }
                      // Ignore dates beyond max advance days
                      if (date && maxDate && isAfter(date, maxDate)) {
                        return;
                      }
                      setSelectedDate(date);
                      setDatePopoverOpen(false);
                    }}
                    locale={ptBR}
                    className="pointer-events-auto"
                    disabled={(date) => {
                      // Disable past dates
                      if (isBefore(date, startOfDay(new Date()))) return true;
                      // Disable dates beyond max advance days
                      if (maxDate && isAfter(date, maxDate)) return true;
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Horário *</Label>
              <Select 
                value={selectedTime} 
                onValueChange={setSelectedTime}
                disabled={!selectedDate || !selectedProfessional || isLoadingAvailability || noSlotsAvailable}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAvailability ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* No slots available indicator */}
              {noSlotsAvailable && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>{getNoSlotsMessage()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Dados do Cliente</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  className={errors.customerName ? 'border-destructive' : ''}
                />
                {errors.customerName && (
                  <p className="text-destructive text-xs mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <ProfessionalWhatsAppValidator
                  phone={customerPhone}
                  countryCode={countryCode}
                  onPhoneChange={setCustomerPhone}
                  onCountryCodeChange={setCountryCode}
                  onStatusChange={setWhatsappStatus}
                  status={whatsappStatus}
                />
                {errors.customerPhone && (
                  <p className="text-destructive text-xs mt-1">{errors.customerPhone}</p>
                )}
                
                {whatsappStatus === 'valid' && whatsappProfile && (
                  <WhatsAppProfilePreview
                    profilePicture={whatsappProfile.pictureUrl}
                    pushName={whatsappProfile.pushName}
                    formattedNumber={whatsappProfile.formattedNumber}
                    formName={customerName}
                    isPrivatePhoto={!whatsappProfile.pictureUrl}
                    className="mt-3"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
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
                  placeholder="Observações adicionais"
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Visual Summary Card */}
          {canShowSummary && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Resumo do Agendamento</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Service */}
                  <div className="flex items-start gap-2">
                    <Scissors className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Serviço</p>
                      <p className="font-medium">{service?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(service?.price || 0)} • {service?.duration_minutes}min
                      </p>
                    </div>
                  </div>
                  
                  {/* Professional */}
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Profissional</p>
                      <p className="font-medium">{selectedProfessionalName}</p>
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Data</p>
                      <p className="font-medium">
                        {format(selectedDate!, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Time */}
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Horário</p>
                      <p className="font-medium">{selectedTime}</p>
                    </div>
                  </div>
                  
                  {/* Client */}
                  <div className="col-span-2 flex items-start gap-2 pt-2 border-t">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Cliente</p>
                      <p className="font-medium">{customerName}</p>
                      <p className="text-xs text-muted-foreground">{countryCode} {customerPhone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={creatingBooking || !selectedService || !selectedProfessional || !selectedDate || !selectedTime}
          >
            {creatingBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
