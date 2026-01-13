import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, CheckCircle2, XCircle, ExternalLink, Unlink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfessionalGoogleCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  // Handle OAuth callback results
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      toast.success("Google Calendar conectado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["google-calendar-token"] });
      setSearchParams({});
    } else if (error) {
      const errorMessages: Record<string, string> = {
        google_denied: "Você negou o acesso ao Google Calendar",
        missing_params: "Parâmetros de autorização faltando",
        invalid_state: "Estado de autorização inválido",
        config_missing: "Configuração OAuth não encontrada",
        token_exchange: "Falha na troca de tokens com o Google",
        missing_tokens: "Tokens não retornados pelo Google",
        save_failed: "Falha ao salvar tokens",
        internal: "Erro interno do servidor"
      };
      toast.error(errorMessages[error] || "Erro desconhecido na conexão");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, queryClient]);

  // Get current professional info
  const { data: professional } = useQuery({
    queryKey: ["current-professional"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("professionals")
        .select("id, name, store_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Get Google Calendar token status
  const { data: tokenStatus, isLoading: isLoadingToken } = useQuery({
    queryKey: ["google-calendar-token", professional?.id],
    queryFn: async () => {
      if (!professional?.id) return null;

      const { data, error } = await supabase
        .from("google_calendar_tokens")
        .select("*")
        .eq("professional_id", professional.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!professional?.id
  });

  // Check if OAuth is configured
  const { data: oauthConfigured } = useQuery({
    queryKey: ["google-oauth-configured"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("google_oauth_config")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return (count || 0) > 0;
    }
  });

  // Connect to Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      setIsConnecting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("google-calendar-auth", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) {
        throw new Error(response.error.message || "Falha ao iniciar conexão");
      }

      if (!response.data?.authUrl) {
        throw new Error("URL de autorização não recebida");
      }

      // Redirect to Google OAuth
      window.location.href = response.data.authUrl;
    },
    onError: (error: Error) => {
      setIsConnecting(false);
      toast.error(error.message);
    }
  });

  // Disconnect from Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!professional?.id) throw new Error("Profissional não encontrado");

      const { error } = await supabase
        .from("google_calendar_tokens")
        .delete()
        .eq("professional_id", professional.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Google Calendar desconectado");
      queryClient.invalidateQueries({ queryKey: ["google-calendar-token"] });
    },
    onError: (error: Error) => {
      toast.error("Falha ao desconectar: " + error.message);
    }
  });

  // Toggle sync enabled
  const toggleSyncMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!tokenStatus?.id) throw new Error("Token não encontrado");

      const { error } = await supabase
        .from("google_calendar_tokens")
        .update({ sync_enabled: enabled })
        .eq("id", tokenStatus.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-calendar-token"] });
      toast.success("Configuração atualizada");
    },
    onError: (error: Error) => {
      toast.error("Falha ao atualizar: " + error.message);
    }
  });

  if (isLoadingToken) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConnected = tokenStatus?.is_active;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Calendar</h1>
        <p className="text-muted-foreground">
          Sincronize seus agendamentos automaticamente com o Google Agenda
        </p>
      </div>

      {!oauthConfigured && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            A integração com Google Calendar ainda não foi configurada pelo administrador.
            Entre em contato com o suporte para ativar esta funcionalidade.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>
                  Sincronize agendamentos com sua agenda Google
                </CardDescription>
              </div>
            </div>
            {isConnected ? (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Desconectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isConnected ? (
            <>
              {/* Connected state */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Conta Google</p>
                    <p className="text-sm text-muted-foreground">
                      {tokenStatus.google_email || "Email não disponível"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://calendar.google.com", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Agenda
                  </Button>
                </div>

                {tokenStatus.last_sync_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Última sincronização:{" "}
                      {format(new Date(tokenStatus.last_sync_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}

                {tokenStatus.last_error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">
                      Último erro: {tokenStatus.last_error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Sync toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="sync-enabled" className="font-medium">
                    Sincronização Automática
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Novos agendamentos serão adicionados automaticamente ao Google Agenda
                  </p>
                </div>
                <Switch
                  id="sync-enabled"
                  checked={tokenStatus.sync_enabled}
                  onCheckedChange={(checked) => toggleSyncMutation.mutate(checked)}
                  disabled={toggleSyncMutation.isPending}
                />
              </div>

              {/* Disconnect button */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-2" />
                  )}
                  Desconectar Google Calendar
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Disconnected state */}
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Ao conectar sua conta Google, você poderá:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Ver seus agendamentos no Google Agenda</li>
                    <li>Receber notificações automáticas do Google</li>
                    <li>Sincronizar com outros dispositivos</li>
                  </ul>
                </div>

                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={isConnecting || !oauthConfigured}
                  className="w-full sm:w-auto"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Conectar Google Calendar
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary mx-auto mb-3 flex items-center justify-center font-bold">
                1
              </div>
              <p className="font-medium">Conecte sua conta</p>
              <p className="text-sm text-muted-foreground">
                Autorize o acesso ao seu Google Calendar
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary mx-auto mb-3 flex items-center justify-center font-bold">
                2
              </div>
              <p className="font-medium">Agendamentos sincronizam</p>
              <p className="text-sm text-muted-foreground">
                Novos bookings aparecem automaticamente
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary mx-auto mb-3 flex items-center justify-center font-bold">
                3
              </div>
              <p className="font-medium">Receba notificações</p>
              <p className="text-sm text-muted-foreground">
                O Google te lembra dos compromissos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
