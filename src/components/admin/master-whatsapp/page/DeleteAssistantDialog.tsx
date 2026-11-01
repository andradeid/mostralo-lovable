// Confirmação para deletar o Assistente IA Master.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function DeleteAssistantDialog({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { showDeleteDialog, setShowDeleteDialog } = tests;
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
            disabled={syncing}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                const { error } = await supabase.functions.invoke('master-bot-delete');
                if (error) throw error;
                toast.success('Assistente deletado com sucesso');
                setShowDeleteDialog(false);
                window.location.reload();
              } catch (err: any) {
                toast.error('Erro ao deletar: ' + (err.message || 'Erro desconhecido'));
              }
            }}
            disabled={syncing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
