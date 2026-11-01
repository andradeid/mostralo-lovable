// Sem conexão: botão Conectar.
// JSX movido da WhatsAppInstancePage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone, Power } from "lucide-react";
import type { WhatsAppInstancePageCtx } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";

export function NoInstanceCard({ ctx }: { ctx: WhatsAppInstancePageCtx & { isConnected?: boolean } }) {
  const { uazapiCreating, createUazapiInstance } = ctx;

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            Conecte o WhatsApp da sua loja
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Leva menos de 1 minuto: toque em Conectar e leia o QR Code com o WhatsApp do celular.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 flex flex-col sm:flex-row gap-3">
          {/* Só a conexão que funciona (sem o botão desativado "Evolution" e sem o selo "Beta") */}
          <div className="flex flex-col gap-1">
            <Button onClick={createUazapiInstance} disabled={uazapiCreating} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
              {uazapiCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
