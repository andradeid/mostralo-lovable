// Janelas abertas pelo menu ⋮ (horários, convite, bloqueios, serviços, agenda, Google Calendar) e a tela de validação do WhatsApp.
// JSX movido da ProfessionalsPage sem mudança.
import { ProfessionalScheduleDialog } from '@/components/admin/booking/ProfessionalScheduleDialog';
import { ProfessionalBlocksDialog } from '@/components/admin/booking/ProfessionalBlocksDialog';
import { ProfessionalInviteDialog } from '@/components/admin/booking/ProfessionalInviteDialog';
import { ProfessionalServicesDialog } from '@/components/admin/booking/ProfessionalServicesDialog';
import { ProfessionalAgendaDialog } from '@/components/admin/booking/ProfessionalAgendaDialog';
import { ProfessionalGoogleCalendarDialog } from '@/components/admin/booking/ProfessionalGoogleCalendarDialog';
import { WhatsAppValidationOverlay } from '@/components/admin/booking/ProfessionalWhatsAppValidator';
import type { ProfessionalDialogs } from '@/hooks/professionals/useProfessionalDialogs';
import type { ProfessionalEditor } from '@/hooks/professionals/useProfessionalEditor';

interface ProfessionalToolDialogsProps {
  dialogs: ProfessionalDialogs;
  editor: ProfessionalEditor;
  storeId: string | null;
  storeName: string;
}

export function ProfessionalToolDialogs({ dialogs, editor, storeId, storeName }: ProfessionalToolDialogsProps) {
  const {
    selectedProfessional,
    isScheduleDialogOpen, setIsScheduleDialogOpen,
    inviteDialog, setInviteDialog,
    isBlocksDialogOpen, setIsBlocksDialogOpen,
    isServicesDialogOpen, setIsServicesDialogOpen,
    isAgendaDialogOpen, setIsAgendaDialogOpen,
    isGoogleCalendarDialogOpen, setIsGoogleCalendarDialogOpen,
    handleDialogOpenChange,
  } = dialogs;
  const { showValidationOverlay, setShowValidationOverlay, whatsappStatus, formData } = editor;

  return (
    <>
      {selectedProfessional && (
        <ProfessionalScheduleDialog
          open={isScheduleDialogOpen}
          onOpenChange={handleDialogOpenChange(setIsScheduleDialogOpen)}
          professionalId={selectedProfessional.id}
          professionalName={selectedProfessional.name}
        />
      )}

      <ProfessionalInviteDialog
        open={!!inviteDialog}
        onOpenChange={(open) => { if (!open) setInviteDialog(null); }}
        professional={inviteDialog?.professional ?? null}
        inviteUrl={inviteDialog?.url ?? null}
        storeName={storeName}
      />

      {/* Blocks Dialog */}
      {selectedProfessional && (
        <ProfessionalBlocksDialog
          open={isBlocksDialogOpen}
          onOpenChange={handleDialogOpenChange(setIsBlocksDialogOpen)}
          professionalId={selectedProfessional.id}
          professionalName={selectedProfessional.name}
        />
      )}

      {/* Services Dialog */}
      {selectedProfessional && storeId && (
        <ProfessionalServicesDialog
          open={isServicesDialogOpen}
          onOpenChange={handleDialogOpenChange(setIsServicesDialogOpen)}
          professionalId={selectedProfessional.id}
          professionalName={selectedProfessional.name}
          storeId={storeId}
        />
      )}

      {/* Agenda Dialog */}
      {selectedProfessional && (
        <ProfessionalAgendaDialog
          open={isAgendaDialogOpen}
          onOpenChange={handleDialogOpenChange(setIsAgendaDialogOpen)}
          professionalId={selectedProfessional.id}
          professionalName={selectedProfessional.name}
        />
      )}

      {/* Google Calendar Dialog */}
      {selectedProfessional && storeId && (
        <ProfessionalGoogleCalendarDialog
          open={isGoogleCalendarDialogOpen}
          onOpenChange={handleDialogOpenChange(setIsGoogleCalendarDialogOpen)}
          professionalId={selectedProfessional.id}
          professionalName={selectedProfessional.name}
          storeId={storeId}
        />
      )}

      {/* WhatsApp Validation Overlay */}
      {showValidationOverlay && (
        <WhatsAppValidationOverlay
          status={whatsappStatus}
          phone={formData.phone}
          professionalName={formData.name}
          storeName={storeName}
          onComplete={() => setShowValidationOverlay(false)}
        />
      )}
    </>
  );
}
