import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Ban, LogOut, MessageCircle, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalespersonBlockedPageProps {
  blockedReason?: string | null;
  blockedAt?: string | null;
}

export function SalespersonBlockedPage({ blockedReason, blockedAt }: SalespersonBlockedPageProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Número de suporte - pode ser configurado via subscription_payment_config
  const supportWhatsApp = "5561994009368";
  const supportEmail = "suporte@mostralo.com";

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      "Olá! Minha conta de vendedor foi bloqueada e gostaria de entender melhor o motivo e como posso resolver."
    );
    window.open(`https://wa.me/${supportWhatsApp}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Ban className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Conta Temporariamente Bloqueada</CardTitle>
          <CardDescription>
            Seu acesso ao painel de vendedor foi temporariamente suspenso.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {blockedReason && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">Motivo do bloqueio:</p>
              <p className="text-sm">{blockedReason}</p>
            </div>
          )}

          {blockedAt && (
            <p className="text-sm text-muted-foreground text-center">
              Bloqueado em: {format(new Date(blockedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}

          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Entre em contato com o suporte para mais informações:
            </p>

            <Button
              onClick={openWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar pelo WhatsApp
            </Button>

            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${supportEmail}`} className="hover:underline">
                {supportEmail}
              </a>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
