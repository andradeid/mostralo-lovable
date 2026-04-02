import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionExpiredNoticeProps {
  /** Tipo de usuário que está vendo o aviso */
  variant: "attendant" | "professional";
}

/**
 * Tela informativa para atendentes e profissionais quando a loja está com assinatura expirada.
 * Diferente do admin, esses usuários não podem gerenciar a assinatura.
 */
export function SubscriptionExpiredNotice({ variant }: SubscriptionExpiredNoticeProps) {
  const messages = {
    attendant: {
      title: "Assinatura Expirada",
      description: "A assinatura desta loja está expirada.",
      detail: "Aguarde o administrador da loja renovar a assinatura para voltar a ter acesso ao sistema.",
    },
    professional: {
      title: "Acesso Temporariamente Indisponível",
      description: "A assinatura da loja está expirada.",
      detail: "Entre em contato com o administrador da loja para que a assinatura seja renovada. Enquanto isso, o acesso ao portal está temporariamente suspenso.",
    },
  };

  const msg = messages[variant];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle>{msg.title}</CardTitle>
          <CardDescription>{msg.description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">{msg.detail}</p>
        </CardContent>
      </Card>
    </div>
  );
}
