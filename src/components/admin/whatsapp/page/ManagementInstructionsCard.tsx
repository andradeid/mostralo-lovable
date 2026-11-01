// Instruções de gerenciamento.
// JSX movido da WhatsAppInstancePage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PowerOff, Trash2, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { WhatsAppInstancePageCtx } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";

export function ManagementInstructionsCard({ ctx }: { ctx: WhatsAppInstancePageCtx & { isConnected?: boolean } }) {

  return (
    <>
      <Card className="bg-muted/30 border-dashed hidden sm:block">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-5 w-5 text-primary" />
            Instruções de Gerenciamento
          </CardTitle>
          <CardDescription>
            Saiba como trocar de número e a diferença entre as ações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="trocar-numero">
              <AccordionTrigger className="text-sm font-medium">
                📱 Como trocar de número?
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <ol className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <span>Clique em <strong>"Desconectar"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <span>Leia o <strong>novo QR Code</strong> que aparece na tela</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <span>Escaneie com o <strong>novo número</strong></span>
                    </li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="diferenca-acoes">
              <AccordionTrigger className="text-sm font-medium">
                ⚡ Desconectar vs Remover
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm">
                  <div className="grid gap-3">
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <PowerOff className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold">Desconectar</span>
                        <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                      </div>
                      <ul className="space-y-1 text-xs">
                        <li className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Configurações preservadas
                        </li>
                        <li className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Reconexão rápida
                        </li>
                      </ul>
                    </div>

                    <div className="border border-destructive/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="font-semibold">Remover</span>
                        <Badge variant="destructive" className="text-xs">Permanente</Badge>
                      </div>
                      <ul className="space-y-1 text-xs">
                        <li className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-destructive" />
                          Configurações perdidas
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reiniciar" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium">
                🔄 Quando reiniciar?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Use quando mensagens não estão sendo enviadas ou recebidas corretamente.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
