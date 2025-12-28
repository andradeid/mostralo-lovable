import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
  Store
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { z } from 'zod';

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
  price: number;
  price_type: 'fixed' | 'from';
}

interface StoreInfo {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
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
  
  // Store data
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Selection state
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Customer data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Generate time slots for selected date
  useEffect(() => {
    const generateSlots = async () => {
      if (!selectedDate || !selectedProfessional || !selectedService) return;
      
      setLoadingSlots(true);
      try {
        // For now, generate default slots (9am - 6pm)
        // TODO: Fetch professional schedule and existing bookings
        const slots: TimeSlot[] = [];
        const duration = selectedService.duration_minutes;
        
        // Check if selected date is today
        const now = new Date();
        const isToday = startOfDay(selectedDate).getTime() === startOfDay(now).getTime();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Safety margin: 30 minutes from now
        const marginMinutes = 30;
        const minAvailableTime = currentHour * 60 + currentMinute + marginMinutes;
        
        for (let hour = 9; hour < 18; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const slotMinutes = hour * 60 + minute;
            
            // If today, check if slot has passed
            const isPastSlot = isToday && slotMinutes < minAvailableTime;
            
            slots.push({ time, available: !isPastSlot });
          }
        }
        
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error generating slots:', error);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    generateSlots();
  }, [selectedDate, selectedProfessional, selectedService]);

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

      // 2. Criar booking COM customer_id
      const { error } = await supabase
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
      case 'confirm': return !!customerName && !!customerPhone;
      default: return false;
    }
  };

  const nextStep = () => {
    const steps: Step[] = ['service', 'professional', 'datetime', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['service', 'professional', 'datetime', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  disabled={(date) => isBefore(date, startOfDay(new Date())) || isBefore(date, addDays(new Date(), -1))}
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
                  <p className="text-muted-foreground text-sm">Nenhum horário disponível</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.filter(s => s.available).map(slot => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot.time)}
                      >
                        {slot.time}
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
                <div>
                  <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={errors.customerPhone ? 'border-destructive' : ''}
                  />
                  {errors.customerPhone && (
                    <p className="text-destructive text-xs mt-1">{errors.customerPhone}</p>
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
