// Cards de informação dos bots.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Users, HelpCircle } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function BotsInfoCards({ wa, tests, cfg }: MasterWhatsAppPageApi) {

  return (
    <>
    <div className="grid gap-4 md:grid-cols-3 mt-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-500/10">
              <MessageSquare className="w-4 h-4 text-green-500" />
            </div>
            Bot de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Atende leads interessados em conhecer a plataforma. 
            3 níveis: Consultivo, Persuasivo, Urgência.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-500/10">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            Bot de Recrutamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Recruta novos vendedores/afiliados. 
            4 níveis: Lead Frio, Moderado, Agressivo, Super Agressivo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-500/10">
              <HelpCircle className="w-4 h-4 text-purple-500" />
            </div>
            Bot de Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Responde dúvidas gerais sobre a plataforma.
            Prompt customizável.
          </p>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
