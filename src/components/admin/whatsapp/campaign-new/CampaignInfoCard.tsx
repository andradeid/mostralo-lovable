// Dados da campanha.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignInfoCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { form, setForm } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Campanha *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Recuperação Dezembro 2024"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição opcional..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
