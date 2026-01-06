import { Calendar, Clock, User, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingSummaryProps {
  service?: {
    name: string;
    price?: number;
    price_type?: 'fixed' | 'from';
    duration_minutes?: number;
  } | null;
  professional?: {
    name: string;
    photo_url?: string | null;
  } | null;
  date?: Date;
  time?: string | null;
}

export const BookingSummary = ({ service, professional, date, time }: BookingSummaryProps) => {
  const hasAnySelection = service || professional || date || time;

  if (!hasAnySelection) return null;

  const formatPrice = (price: number, priceType?: 'fixed' | 'from') => {
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

  return (
    <div className="bg-card border rounded-xl p-5 sticky top-4">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        Seu Agendamento
      </h3>

      <div className="space-y-4">
        {/* Serviço */}
        {service && (
          <div className="pb-3 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{service.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {service.price !== undefined && (
                    <span className="text-sm text-primary font-semibold">
                      {formatPrice(service.price, service.price_type)}
                    </span>
                  )}
                  {service.duration_minutes && (
                    <span className="text-xs text-muted-foreground">
                      • {formatDuration(service.duration_minutes)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profissional */}
        {professional && (
          <div className="pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {professional.photo_url ? (
                  <img 
                    src={professional.photo_url} 
                    alt={professional.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Profissional</p>
                <p className="text-sm font-medium text-foreground">{professional.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data e Hora */}
        {(date || time) && (
          <div className="space-y-2">
            {date && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {time && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horário</p>
                  <p className="text-sm font-medium text-foreground">{time}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
