import { Clock, Scissors, User, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingFloatingSummaryProps {
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

export const BookingFloatingSummary = ({ service, professional, date, time }: BookingFloatingSummaryProps) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!service) return null;

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

  const items = [
    service && { icon: Scissors, label: service.name },
    professional && { icon: User, label: professional.name },
    date && { icon: Calendar, label: format(date, "dd/MM", { locale: ptBR }) },
    time && { icon: Clock, label: time },
  ].filter(Boolean) as { icon: any; label: string }[];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      <div className="bg-card/95 backdrop-blur-lg border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Collapsed: compact bar */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full whitespace-nowrap text-foreground">
                  <item.icon className="w-3 h-3 text-primary" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            {service.price !== undefined && (
              <span className="text-sm font-bold text-primary">
                {formatPrice(service.price, service.price_type)}
              </span>
            )}
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Expanded: full details */}
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            {/* Service */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{service.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {service.duration_minutes && <span>{formatDuration(service.duration_minutes)}</span>}
                  {service.price !== undefined && (
                    <span className="text-primary font-semibold">{formatPrice(service.price, service.price_type)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Professional */}
            {professional && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {professional.photo_url ? (
                    <img src={professional.photo_url} alt={professional.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{professional.name}</p>
              </div>
            )}

            {/* Date/Time */}
            {(date || time) && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground">
                  {date && format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  {time && ` às ${time}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
