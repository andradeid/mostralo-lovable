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
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { ProfessionalWhatsAppValidator, WhatsAppValidationStatus } from './ProfessionalWhatsAppValidator';
import { WhatsAppProfilePreview } from '@/components/leads/WhatsAppProfilePreview';
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
  onSuccess
}: NewBookingDialogProps) {
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
      setSelectedTime('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setNotes('');
      setErrors({});
      setCountryCode('+55');
      setWhatsappStatus('idle');
      setWhatsappProfile(null);
    }
  }, [open, defaultDate, defaultProfessionalId]);

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

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 7; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

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

      await createBooking({
        store_id: storeId,
        professional_id: selectedProfessional,
        service_id: selectedService,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime + ':00',
        end_time: endTime + ':00',
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
                      setSelectedDate(date);
                      setDatePopoverOpen(false);
                    }}
                    locale={ptBR}
                    className="pointer-events-auto"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Horário *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
