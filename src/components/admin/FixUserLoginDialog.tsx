import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Wrench, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FixUserLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

export function FixUserLoginDialog({
  open,
  onOpenChange,
  userEmail: initialEmail,
}: FixUserLoginDialogProps) {
  const { userRole } = useAuth();
  const [email, setEmail] = useState(initialEmail || "");
  const [newPassword, setNewPassword] = useState("");
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  // Mutation para diagnosticar e corrigir
  const fixLoginMutation = useMutation({
    mutationFn: async ({ email, newPassword }: { email: string; newPassword?: string }) => {
      // Verificar se é master_admin (⚠️ NUNCA confiar em role no profile)
      if (userRole !== "master_admin") {
        throw new Error("Apenas master admins podem corrigir problemas de login.");
      }

      // Verificar se há sessão ativa
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Você precisa estar logado. Faça login novamente.");
      }

      console.log("🔧 Diagnosticando e corrigindo login:", {
        email: email.substring(0, 5) + "***",
        hasSession: !!sessionData.session,
      });

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("fix-user-login", {
        body: {
          email,
          newPassword: newPassword || undefined,
        },
      });

      console.log("🔧 Resposta da função:", { hasError: !!error, hasData: !!data, data, error });

      // IMPORTANTE: Verificar data?.error primeiro (mesmo com error, o data pode conter a mensagem real)
      if (data?.error) {
        console.error("❌ Erro retornado pela função:", data.error);
        throw new Error(data.error + (data.details ? `: ${data.details}` : ""));
      }

      if (error) {
        // Tentar extrair status code de várias formas
        const errorAny = error as any;
        const statusCode = 
          errorAny.status || 
          errorAny.statusCode || 
          errorAny.response?.status ||
          errorAny.context?.response?.status;

        console.error("❌ Erro HTTP completo:", {
          message: error.message,
          status: statusCode,
          name: error.name,
          context: errorAny.context,
        });

        let errorMessage = error.message || "Erro ao diagnosticar/corrigir login";

        // Mensagens específicas por status code
        if (statusCode === 401) {
          errorMessage = "Não autorizado. Verifique se você está logado como master admin.";
        } else if (statusCode === 403) {
          errorMessage = "Acesso negado. Apenas master admins podem usar esta função.";
        } else if (statusCode === 404) {
          errorMessage = "Usuário não encontrado. Verifique o email digitado.";
        } else if (statusCode === 400) {
          errorMessage = "Dados inválidos. Verifique os campos preenchidos.";
        } else if (statusCode === 500) {
          errorMessage = "Erro interno do servidor. Tente novamente mais tarde.";
        } else if (statusCode) {
          errorMessage = `Erro ${statusCode}: ${error.message}`;
        }

        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: (data) => {
      setDiagnosticResult(data);
      if (data.success) {
        toast.success("Login corrigido com sucesso!", {
          description: data.message,
        });
      } else {
        toast.info("Diagnóstico concluído", {
          description: data.message,
        });
      }
    },
    onError: (error: Error) => {
      console.error("Erro ao corrigir login:", error);
      toast.error("Erro ao corrigir login", {
        description: error.message || "Não foi possível corrigir o login.",
      });
      setDiagnosticResult(null);
    },
  });

  const handleFix = () => {
    if (!email.trim()) {
      toast.error("Email obrigatório", {
        description: "Por favor, insira o email do usuário.",
      });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error("Senha muito curta", {
        description: "A senha deve ter no mínimo 6 caracteres.",
      });
      return;
    }

    fixLoginMutation.mutate({ email: email.trim(), newPassword: newPassword || undefined });
  };

  const handleClose = () => {
    setEmail(initialEmail || "");
    setNewPassword("");
    setDiagnosticResult(null);
    onOpenChange(false);
  };

  // Verificar se é master admin
  const isMasterAdmin = userRole === "master_admin";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Diagnosticar e Corrigir Login
          </DialogTitle>
          <DialogDescription>
            Diagnostica problemas de login e aplica correções automáticas (confirmar email, resetar senha, etc.)
          </DialogDescription>
        </DialogHeader>

        {!isMasterAdmin && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Acesso Restrito:</strong> Apenas Master Admins podem usar esta função.
            </p>
          </div>
        )}

        {isMasterAdmin && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Usuário *</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={fixLoginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">
                Nova Senha (Opcional)
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Deixe em branco para apenas diagnosticar"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                disabled={fixLoginMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Se preenchida, a senha será resetada. Mínimo de 6 caracteres.
              </p>
            </div>

            {diagnosticResult && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {diagnosticResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <h4 className="font-semibold">Resultado do Diagnóstico</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{diagnosticResult.user?.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email Confirmado:</span>
                    <Badge variant={diagnosticResult.user?.emailConfirmed ? "default" : "destructive"}>
                      {diagnosticResult.user?.emailConfirmed ? "Sim" : "Não"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Senha Resetada:</span>
                    <Badge variant={diagnosticResult.user?.passwordReset ? "default" : "secondary"}>
                      {diagnosticResult.user?.passwordReset ? "Sim" : "Não"}
                    </Badge>
                  </div>

                  {diagnosticResult.user?.profile && (
                    <div className="space-y-1 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span className="font-medium">{diagnosticResult.user.profile.fullName || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <Badge>{diagnosticResult.user.profile.userType || "N/A"}</Badge>
                      </div>
                    </div>
                  )}

                  {diagnosticResult.user?.roles && diagnosticResult.user.roles.length > 0 && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground">Roles: </span>
                      <div className="flex gap-1 mt-1">
                        {diagnosticResult.user.roles.map((role: string, idx: number) => (
                          <Badge key={idx} variant="outline">{role}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {diagnosticResult.fixes && diagnosticResult.fixes.length > 0 && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground">Correções Aplicadas:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {diagnosticResult.fixes.map((fix: string, idx: number) => (
                          <li key={idx} className="text-green-600 dark:text-green-400">{fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={fixLoginMutation.isPending}
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={handleFix}
                disabled={fixLoginMutation.isPending || !email.trim()}
              >
                {fixLoginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Wrench className="mr-2 h-4 w-4" />
                {newPassword ? "Corrigir e Resetar Senha" : "Diagnosticar"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

