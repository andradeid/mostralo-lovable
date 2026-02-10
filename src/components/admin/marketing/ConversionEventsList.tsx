import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

const conversionEvents = [
  {
    name: "PageView",
    description: "Visualização de página",
    trigger: "Toda página pública da loja e landing pages",
    googleAds: true,
    facebookPixel: true,
    googleAnalytics: true,
  },
  {
    name: "CompleteRegistration",
    description: "Cadastro de novo usuário",
    trigger: "Página de signup após cadastro bem-sucedido",
    googleAds: true,
    facebookPixel: true,
    googleAnalytics: true,
  },
  {
    name: "StartTrial",
    description: "Início de período de teste",
    trigger: "Quando o usuário inicia o trial gratuito",
    googleAds: true,
    facebookPixel: true,
    googleAnalytics: true,
  },
  {
    name: "Purchase",
    description: "Compra/assinatura concluída",
    trigger: "Confirmação de pagamento de assinatura",
    googleAds: true,
    facebookPixel: true,
    googleAnalytics: true,
  },
  {
    name: "Lead",
    description: "Geração de lead",
    trigger: "Formulário de contato ou interesse enviado",
    googleAds: true,
    facebookPixel: true,
    googleAnalytics: true,
  },
  {
    name: "AddToCart",
    description: "Adição ao carrinho",
    trigger: "Quando o cliente adiciona item ao carrinho na loja",
    googleAds: false,
    facebookPixel: true,
    googleAnalytics: true,
  },
  {
    name: "ViewContent",
    description: "Visualização de conteúdo",
    trigger: "Visualização de produto ou plano específico",
    googleAds: false,
    facebookPixel: true,
    googleAnalytics: true,
  },
  {
    name: "Contact",
    description: "Contato via WhatsApp",
    trigger: "Clique no botão de WhatsApp da loja",
    googleAds: true,
    facebookPixel: true,
    googleAnalytics: true,
  },
];

export function ConversionEventsList() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Eventos de Conversão Rastreados
          </CardTitle>
          <CardDescription>
            Lista de todos os eventos que são disparados automaticamente quando os IDs de tracking estão configurados.
            Os eventos só são enviados se o respectivo pixel/tag estiver ativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead className="hidden sm:table-cell">Onde dispara</TableHead>
                <TableHead className="text-center">Google Ads</TableHead>
                <TableHead className="text-center">Facebook</TableHead>
                <TableHead className="text-center">Analytics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversionEvents.map((event) => (
                <TableRow key={event.name}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground sm:hidden mt-1">{event.trigger}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {event.trigger}
                  </TableCell>
                  <TableCell className="text-center">
                    {event.googleAds ? (
                      <Badge variant="default" className="bg-green-600 text-xs">Sim</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {event.facebookPixel ? (
                      <Badge variant="default" className="bg-blue-600 text-xs">Sim</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {event.googleAnalytics ? (
                      <Badge variant="default" className="bg-orange-600 text-xs">Sim</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">—</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
