// URL e instruções do webhook da instância.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, Globe } from "lucide-react";
import { copyToClipboard } from "@/lib/masterWhatsapp/format";
import type { MasterWhatsAppPageApi } from "./types";

export function InstanceWebhookInfo({ wa, tests, cfg }: MasterWhatsAppPageApi) {

  return (
    <>
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <Globe className="w-3.5 h-3.5" />
        Webhook da Instância
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">URL do Webhook</Label>
          <div className="flex items-center gap-1">
            <p className="font-mono text-[10px] break-all bg-background p-1.5 rounded border flex-1">
              {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/master-whatsapp-webhook`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={() => copyToClipboard(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/master-whatsapp-webhook`)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-primary font-medium hover:underline">
            📋 Instruções de configuração
          </summary>
          <div className="mt-2 space-y-2 text-muted-foreground bg-background p-2 rounded border">
            <p className="font-medium text-foreground">Configure no painel UaZapi:</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Acesse o painel da sua instância UaZapi</li>
              <li>Vá em <strong>Configurações → Webhook</strong></li>
              <li>Cole a URL acima no campo de webhook</li>
              <li>Ative os seguintes eventos:
                <div className="flex flex-wrap gap-1 mt-1 ml-4">
                  {['messages', 'messages_update', 'connection', 'qrcode', 'presence'].map(evt => (
                    <Badge key={evt} variant="secondary" className="text-[10px]">{evt}</Badge>
                  ))}
                </div>
              </li>
              <li>Salve e teste a conexão</li>
            </ol>
            <p className="text-[10px] italic mt-1">
              💡 Após configurar, clique em "Configurar Webhook" abaixo para validar automaticamente.
            </p>
          </div>
        </details>
      </div>
    </div>
    </>
  );
}
