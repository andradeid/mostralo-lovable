// Confirmação para deletar o Assistente IA Master.
// Usa handleDeleteAssistant (manda o configId que a função master-bot-delete exige).
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function DeleteAssistantDialog({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { showDeleteDialog, setShowDeleteDialog, handleDeleteAssistant, deletingAssistant } = tests;
  const { syncing } = cfg;

  return (
    <>
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Deletar Assistente
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja deletar o Assistente IA Master?
            <br /><br />
            Esta ação irá:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remover o Assistant da OpenAI</li>
              <li>O bot deixará de responder mensagens</li>
              <li>Você poderá recriá-lo sincronizando novamente</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(false)}
            disabled={syncing || deletingAssistant}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (await handleDeleteAssistant()) window.location.reload();
            }}
            disabled={syncing || deletingAssistant}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deletingAssistant ? 'Deletando...' : 'Confirmar Exclusão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
