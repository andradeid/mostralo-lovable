import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Copy,
  RefreshCw,
  Zap,
  Users
} from "lucide-react";

interface AccountWebhookConfigCardProps {
  isConfigured: boolean;
  environment: "sandbox" | "production";
  webhookUrl?: string | null;
  webhookConfiguredAt?: string | null;
  onConfigured?: () => void;
}

export function AccountWebhookConfigCard({ 
  isConfigured, 
  environment, 
  webhookUrl,
  webhookConfiguredAt,
  onConfigured 
}: AccountWebhookConfigCardProps) {
  const { toast } = useToast();
  const [configuring, setConfiguring] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookEndpoint = `https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/efi-account-webhook`;

  const handleConfigureWebhook = async () => {
    setConfiguring(true);
    try {
      const { data, error } = await supabase.functions.invoke('efi-configure-account-webhook');

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Webhook de contas configurado!",
          description: `Webhook registrado com sucesso no ambiente de ${environment === 'production' ? 'produção' : 'sandbox'}.`,
        });
        onConfigured?.();
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao configurar webhook de contas:', error);
      toast({
        title: "Erro ao configurar webhook",
        description: error.message || 'Não foi possível configurar o webhook de contas.',
        variant: "destructive",
      });
    } finally {
      setConfiguring(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopied(true);
    toast({
      title: "URL copiada!",
      description: "URL do webhook copiada para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          Webhook de Contas Simplificadas
          {webhookUrl ? (
            <Badge variant="outline" className="ml-auto text-green-600 border-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Configurado
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto text-yellow-600 border-yellow-600">
              <XCircle className="h-3 w-3 mr-1" />
              Não configurado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Receba notificações quando lojistas autorizarem suas contas EFI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefícios */}
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Funcionalidades
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Notificação automática de autorização
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Ativação automática do PIX do lojista
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Armazenamento seguro de credenciais
            </li>
          </ul>
        </div>

        {/* URL do Webhook */}
        <div className="space-y-2">
          <label className="text-sm font-medium">URL do Webhook</label>
          <div className="flex gap-2">
            <code className="flex-1 p-2 text-xs bg-muted rounded border font-mono truncate">
              {webhookEndpoint}
            </code>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Status atual */}
        {webhookUrl && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">✅ Webhook ativo</p>
            <p className="text-xs text-muted-foreground truncate">
              URL: {webhookUrl}
            </p>
            {webhookConfiguredAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Configurado em: {new Date(webhookConfiguredAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}

        {/* Botão de configuração */}
        <Button
          onClick={handleConfigureWebhook}
          disabled={configuring || !isConfigured}
          className="w-full"
          variant={webhookUrl ? "outline" : "default"}
        >
          {configuring ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Configurando...
            </>
          ) : webhookUrl ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconfigurar Webhook
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Configurar Webhook de Contas
            </>
          )}
        </Button>

        {!isConfigured && (
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Configure as credenciais EFI primeiro antes de configurar o webhook
          </p>
        )}

        {/* Info adicional */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> Este webhook recebe notificações quando lojistas autorizam 
            a criação de suas contas simplificadas EFI via link enviado por SMS/WhatsApp.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
