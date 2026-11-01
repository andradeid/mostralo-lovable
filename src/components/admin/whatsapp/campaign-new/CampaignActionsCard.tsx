// Ações: iniciar, rascunho.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, CalendarClock } from "lucide-react";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignActionsCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { navigate, loading, previewData, form, startCampaign, saveDraft } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={startCampaign} 
            disabled={loading || !previewData || previewData.totalRecipients === 0 || (form.schedule_type === 'scheduled' && !form.scheduled_date)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {form.schedule_type === 'scheduled' ? 'Agendando...' : 'Iniciando...'}
              </>
            ) : form.schedule_type === 'scheduled' ? (
              <>
                <CalendarClock className="h-4 w-4 mr-2" />
                Agendar Campanha
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Iniciar Campanha
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={saveDraft} 
            disabled={loading}
            className="w-full"
          >
            Salvar como Rascunho
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/whatsapp/campaigns')}
            className="w-full"
          >
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
