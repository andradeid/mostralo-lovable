// Confirmação de exclusão do profissional.
// JSX movido da ProfessionalsPage sem mudança.
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { ProfessionalDialogs } from '@/hooks/professionals/useProfessionalDialogs';

interface ProfessionalDeleteDialogProps {
  dialogs: ProfessionalDialogs;
  handleDelete: () => void;
  deletingProfessional: boolean;
}

export function ProfessionalDeleteDialog({ dialogs, handleDelete, deletingProfessional }: ProfessionalDeleteDialogProps) {
  const { isDeleteDialogOpen, setIsDeleteDialogOpen, selectedProfessional } = dialogs;

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{selectedProfessional?.name}</strong>?
            Esta ação não pode ser desfeita e todos os agendamentos vinculados serão afetados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletingProfessional && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
