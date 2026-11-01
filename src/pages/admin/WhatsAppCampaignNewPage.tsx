import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCampaignNewPage } from "@/hooks/whatsappCampaign/useCampaignNewPage";
import { CampaignInfoCard } from "@/components/admin/whatsapp/campaign-new/CampaignInfoCard";
import { CampaignAudienceCard } from "@/components/admin/whatsapp/campaign-new/CampaignAudienceCard";
import { CampaignSendingCard } from "@/components/admin/whatsapp/campaign-new/CampaignSendingCard";
import { CampaignAntiBlockCard } from "@/components/admin/whatsapp/campaign-new/CampaignAntiBlockCard";
import { CampaignPreviewCard } from "@/components/admin/whatsapp/campaign-new/CampaignPreviewCard";
import { CampaignManualContactsCard } from "@/components/admin/whatsapp/campaign-new/CampaignManualContactsCard";
import { CampaignScheduleCard } from "@/components/admin/whatsapp/campaign-new/CampaignScheduleCard";
import { CampaignActionsCard } from "@/components/admin/whatsapp/campaign-new/CampaignActionsCard";
import { CampaignMessageCard } from "@/components/admin/whatsapp/campaign-new/CampaignMessageCard";
import { CampaignTestCard } from "@/components/admin/whatsapp/campaign-new/CampaignTestCard";

// Tela Nova Campanha: só orquestra. Lógica em hooks/whatsappCampaign, blocos em components/admin/whatsapp/campaign-new.

export default function WhatsAppCampaignNewPage() {
  const ctx = useCampaignNewPage();
  const { navigate } = ctx;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/whatsapp/campaigns')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Campanha</h1>
          <p className="text-muted-foreground">
            Configure e inicie uma campanha de recuperação
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <CampaignInfoCard ctx={ctx} />

          {/* Card Segmentação */}
          <CampaignAudienceCard ctx={ctx} />

          {/* Card Configuração de Envio */}
          <CampaignSendingCard ctx={ctx} />

          {/* Card Anti-Bloqueio */}
          <CampaignAntiBlockCard ctx={ctx} />
        </div>

        {/* COLUNA DIREITA - Preview e Ações em primeiro */}
        <div className="space-y-6">
          {/* Card Preview */}
          <CampaignPreviewCard ctx={ctx} />

          {/* Card Contatos Manuais */}
          <CampaignManualContactsCard ctx={ctx} />

          {/* Card Agendamento */}
          <CampaignScheduleCard ctx={ctx} />

          {/* Card Ações */}
          <CampaignActionsCard ctx={ctx} />

          {/* Card de Mensagem Unificado (com mídia integrada) */}
          <CampaignMessageCard ctx={ctx} />

          {/* Card de Teste */}
          <CampaignTestCard ctx={ctx} />
        </div>
      </div>
    </div>
  );
}
