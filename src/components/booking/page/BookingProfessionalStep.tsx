// Passo 2: escolha do profissional (ou "Qualquer profissional", quando a loja permite).
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronRight, RefreshCw, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Professional } from '@/lib/bookingPage/types';

interface Props {
  professionals: Professional[];
  eligibleProfessionals: Professional[];
  anyProfessional: boolean;
  setAnyProfessional: (value: boolean) => void;
  selectedProfessional: Professional | null;
  setSelectedProfessional: (professional: Professional | null) => void;
  setAssignedProfessional: (professional: Professional | null) => void;
  setSelectedTime: (time: string | null) => void;
  allowAnyProfessional: boolean;
  nextStep: () => void;
}

export function BookingProfessionalStep({
  professionals,
  eligibleProfessionals,
  anyProfessional,
  setAnyProfessional,
  selectedProfessional,
  setSelectedProfessional,
  setAssignedProfessional,
  setSelectedTime,
  allowAnyProfessional,
  nextStep,
}: Props) {
  return (
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
  );
}
