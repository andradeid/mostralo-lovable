// Passo 1: escolha do serviço (lista com selo "Mais escolhido", ou o cartão do serviço já escolhido).
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Clock, RefreshCw, Scissors, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingService, Professional, Step } from '@/lib/bookingPage/types';
import { formatDuration, formatPrice } from '@/lib/bookingPage/rules';

interface Props {
  services: BookingService[];
  selectedService: BookingService | null;
  setSelectedService: (service: BookingService | null) => void;
  mostBookedServiceId: string | null | undefined;
  isProfessionalPreselected: boolean;
  eligibleFor: (service: BookingService | null) => Professional[];
  setCurrentStep: (step: Step) => void;
}

export function BookingServiceStep({
  services,
  selectedService,
  setSelectedService,
  mostBookedServiceId,
  isProfessionalPreselected,
  eligibleFor,
  setCurrentStep,
}: Props) {
  return (
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
  );
}
