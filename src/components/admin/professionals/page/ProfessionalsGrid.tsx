// Lista de profissionais: carregando, vazio ou grade de cartões.
// JSX movido da ProfessionalsPage sem mudança.
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import { ProfessionalCard } from './ProfessionalCard';
import type { Professional } from '@/hooks/useBooking';
import type { ProfessionalDialogs } from '@/hooks/professionals/useProfessionalDialogs';
import type { ProfessionalTodayStats } from '@/lib/professionals/professionalsList';

interface ProfessionalsGridProps {
  loadingProfessionals: boolean;
  filteredProfessionals: Professional[];
  searchTerm: string;
  resetForm: () => void;
  setIsCreateDialogOpen: (open: boolean) => void;
  todayStats: ProfessionalTodayStats | undefined;
  professionalServices: Record<string, { id: string; name: string }[]>;
  storeSlug: string | null;
  dialogs: ProfessionalDialogs;
  openEditDialog: (professional: Professional) => void;
  handleToggleActive: (professional: Professional) => void;
  copyBookingLink: (professional: Professional) => void;
}

export function ProfessionalsGrid({ loadingProfessionals, filteredProfessionals, searchTerm, resetForm, setIsCreateDialogOpen, todayStats, professionalServices, storeSlug, dialogs, openEditDialog, handleToggleActive, copyBookingLink }: ProfessionalsGridProps) {
  return (
    <>
      {loadingProfessionals ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProfessionals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchTerm ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
            </p>
            {!searchTerm && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar primeiro profissional
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfessionals.map((professional) => {
            const stats = todayStats?.[professional.id];
            const services = professionalServices[professional.id] || [];

            return (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                stats={stats}
                services={services}
                storeSlug={storeSlug}
                dialogs={dialogs}
                openEditDialog={openEditDialog}
                handleToggleActive={handleToggleActive}
                copyBookingLink={copyBookingLink}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
