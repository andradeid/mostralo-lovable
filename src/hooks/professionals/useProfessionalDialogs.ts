// Janelas da tela de Profissionais (criar, editar, excluir, horários, bloqueios,
// serviços, agenda, Google Calendar e convite) e o profissional selecionado.
// Código movido da ProfessionalsPage sem mudança.
import { useState } from 'react';
import type { Professional } from '@/hooks/useBooking';
import type { InviteTarget } from '@/components/admin/booking/ProfessionalInviteDialog';

export function useProfessionalDialogs() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isBlocksDialogOpen, setIsBlocksDialogOpen] = useState(false);
  const [inviteDialog, setInviteDialog] = useState<{ professional: InviteTarget; url?: string | null } | null>(null);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);
  const [isGoogleCalendarDialogOpen, setIsGoogleCalendarDialogOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const openDialogFromMenu = (setOpen: (open: boolean) => void, professional: Professional) => {
    setSelectedProfessional(professional);
    window.setTimeout(() => {
      document.body.style.removeProperty('pointer-events');
      setOpen(true);
    }, 0);
  };

  const handleDialogOpenChange = (setOpen: (open: boolean) => void) => (open: boolean) => {
    setOpen(open);
    if (!open) {
      window.setTimeout(() => {
        document.body.style.removeProperty('pointer-events');
      }, 0);
    }
  };

  return {
    isCreateDialogOpen, setIsCreateDialogOpen,
    isEditDialogOpen, setIsEditDialogOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    isScheduleDialogOpen, setIsScheduleDialogOpen,
    isBlocksDialogOpen, setIsBlocksDialogOpen,
    inviteDialog, setInviteDialog,
    isServicesDialogOpen, setIsServicesDialogOpen,
    isAgendaDialogOpen, setIsAgendaDialogOpen,
    isGoogleCalendarDialogOpen, setIsGoogleCalendarDialogOpen,
    selectedProfessional, setSelectedProfessional,
    openDialogFromMenu,
    handleDialogOpenChange,
  };
}

export type ProfessionalDialogs = ReturnType<typeof useProfessionalDialogs>;
