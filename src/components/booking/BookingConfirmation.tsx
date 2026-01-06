import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  CheckCircle, 
  User, 
  Store, 
  MapPin, 
  Phone, 
  CalendarPlus 
} from 'lucide-react';

interface BookingConfirmationStore {
  name: string;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

interface BookingConfirmationService {
  name: string;
  price?: number;
  price_type?: 'fixed' | 'from';
  duration_minutes?: number;
}

interface BookingConfirmationProfessional {
  name: string;
  photo_url?: string | null;
}

interface BookingConfirmationPet {
  name: string;
  avatar?: string;
}

export interface BookingConfirmationProps {
  /** Dados da loja */
  store?: BookingConfirmationStore;
  
  /** Dados do serviço */
  service: BookingConfirmationService;
  
  /** Dados do profissional (opcional) */
  professional?: BookingConfirmationProfessional;
  
  /** Dados do pet (opcional, para pet shops) */
  pet?: BookingConfirmationPet;
  
  /** Data do agendamento */
  date: Date;
  
  /** Hora do agendamento */
  time: string;
  
  /** Variante visual: 'full' para BookingPage, 'overlay' para demos */
  variant?: 'full' | 'overlay';
  
  /** Tema: 'default' (light/dark do sistema) ou 'dark' (landing pages zinc-950) */
  theme?: 'default' | 'dark';
  
  /** Callback ao clicar em "Fazer novo agendamento" */
  onNewBooking?: () => void;
  
  /** Mensagem customizada (ex: lembrete de ração para pet shops) */
  customMessage?: string;
}

/**
 * Componente reutilizável de confirmação de agendamento.
 * 
 * @example
 * // Para BookingPage (agendamento real)
 * <BookingConfirmation
 *   variant="full"
 *   store={store}
 *   service={selectedService}
 *   professional={selectedProfessional}
 *   date={selectedDate}
 *   time={selectedTime}
 *   onNewBooking={() => window.location.reload()}
 * />
 * 
 * @example
 * // Para demos de landing pages
 * <BookingConfirmation
 *   variant="overlay"
 *   theme="dark"
 *   store={{ name: 'Barbearia do João' }}
 *   service={service}
 *   professional={professional}
 *   date={selectedDate}
 *   time={selectedTime}
 *   customMessage="A ração do Thor acaba em 5 dias. Lembrar?"
 * />
 */
export const BookingConfirmation = ({
  store,
  service,
  professional,
  pet,
  date,
  time,
  variant = 'full',
  theme = 'default',
  onNewBooking,
  customMessage
}: BookingConfirmationProps) => {
  
  // Gera URL para adicionar ao Google Calendar
  const generateCalendarUrl = () => {
    if (!date || !time || !service) return '';
    
    const startDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + (service.duration_minutes || 60));
    
    const formatDateForCalendar = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const title = encodeURIComponent(`${service.name}${store?.name ? ` - ${store.name}` : ''}`);
    const location = store?.address ? encodeURIComponent(`${store.address}${store.city ? `, ${store.city}` : ''}`) : '';
    const details = encodeURIComponent(
      `${professional?.name ? `Profissional: ${professional.name}\n` : ''}${pet?.name ? `Pet: ${pet.name}\n` : ''}${service.price ? `Valor: R$ ${service.price.toFixed(2).replace('.', ',')}` : ''}`
    );
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&location=${location}&details=${details}`;
  };

  // ==================== VARIANTE OVERLAY (para demos) ====================
  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 flex flex-col items-center justify-center z-20 animate-fade-in p-6">
        {/* Ícone de Sucesso */}
        <CheckCircle className="w-20 h-20 text-white mb-4 drop-shadow-lg" />
        
        {/* Título */}
        <p className="text-white text-2xl font-bold mb-2 text-center">
          Agendamento Confirmado!
        </p>
        
        {/* Detalhes do Agendamento */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4 text-center max-w-xs w-full">
          {(professional || pet) && (
            <p className="text-white font-medium mb-1">
              {professional?.name || pet?.name}
              {pet?.avatar && <span className="ml-1">{pet.avatar}</span>}
            </p>
          )}
          <p className="text-white/90 text-sm">{service.name}</p>
          <p className="text-white/80 text-sm mt-1">
            {format(date, "EEEE, dd/MM", { locale: ptBR })} às {time}
          </p>
          {service.price !== undefined && service.price > 0 && (
            <p className="text-white font-bold mt-2">
              {service.price_type === 'from' && 'A partir de '}
              R$ {service.price.toFixed(2).replace('.', ',')}
            </p>
          )}
        </div>
        
        {/* Mensagem WhatsApp */}
        <p className="text-white/80 text-sm text-center">
          Você receberá um lembrete no WhatsApp
        </p>
        
        {/* Mensagem Customizada (ex: lembrete de ração) */}
        {customMessage && (
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-3 max-w-xs">
            <p className="text-white text-sm text-center">⚠️ {customMessage}</p>
          </div>
        )}
      </div>
    );
  }

  // ==================== VARIANTE FULL (para BookingPage) ====================
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          {/* Header com Logo e Nome da Empresa */}
          {store && (
            <div className="flex flex-col items-center mb-6">
              {store.logo_url ? (
                <img 
                  src={store.logo_url} 
                  alt={store.name} 
                  className="h-16 w-16 rounded-full object-cover mb-2 border-2 border-muted"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Store className="h-8 w-8 text-primary" />
                </div>
              )}
              <h1 className="text-lg font-semibold text-foreground">
                {store.name}
              </h1>
            </div>
          )}

          {/* Ícone de Sucesso */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground text-sm">
              Você receberá uma confirmação em breve.
            </p>
          </div>

          {/* Detalhes do Agendamento */}
          <div className="bg-muted rounded-lg p-4 space-y-3 mb-4">
            {/* Profissional ou Pet */}
            {(professional || pet) && (
              <div className="flex items-center gap-3">
                {professional?.photo_url ? (
                  <img 
                    src={professional.photo_url} 
                    alt={professional.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : pet?.avatar ? (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {pet.avatar}
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{professional?.name || pet?.name}</p>
                  <p className="text-sm text-muted-foreground">{service.name}</p>
                </div>
              </div>
            )}

            {/* Se não tem profissional nem pet, mostra só o serviço */}
            {!professional && !pet && (
              <div>
                <p className="font-medium">{service.name}</p>
              </div>
            )}

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border">
              <div>
                <span className="text-muted-foreground">Data:</span>
                <p className="font-medium">
                  {format(date, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Horário:</span>
                <p className="font-medium">{time}</p>
              </div>
            </div>

            {/* Valor */}
            {service.price !== undefined && service.price > 0 && (
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground text-sm">Valor:</span>
                <p className="font-semibold text-lg">
                  {service.price_type === 'from' && 'A partir de '}
                  R$ {service.price.toFixed(2).replace('.', ',')}
                </p>
              </div>
            )}
          </div>

          {/* Mensagem Customizada */}
          {customMessage && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg p-3 mb-4">
              <p className="text-amber-800 dark:text-amber-200 text-sm text-center">
                ⚠️ {customMessage}
              </p>
            </div>
          )}

          {/* Contato da Loja */}
          {store && (store.address || store.phone || store.whatsapp) && (
            <div className="text-sm text-muted-foreground mb-4 space-y-2 px-1">
              {store.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{store.address}{store.city && `, ${store.city}`}</span>
                </p>
              )}
              {(store.phone || store.whatsapp) && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{store.phone || store.whatsapp}</span>
                </p>
              )}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-2">
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.open(generateCalendarUrl(), '_blank')}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Adicionar ao Calendário
            </Button>
            {onNewBooking && (
              <Button 
                className="w-full" 
                onClick={onNewBooking}
              >
                Fazer novo agendamento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
