import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Mail, Key } from "lucide-react";

interface UserPasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userName: string;
}

/**
 * Dialog para resetar senha de usuário
 * Permite ao super admin:
 * 1. Enviar email de recuperação de senha
 * 2. Definir nova senha diretamente (sem email)
 */
export function UserPasswordResetDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName,
}: UserPasswordResetDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"email" | "manual">("email");

  // Mutation para enviar email de recuperação
  const sendRecoveryEmailMutation = useMutation({
    mutationFn: async () => {
      // Usar Admin API do Supabase para enviar email de recuperação
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        userEmail,
        {
          redirectTo: `${window.location.origin}/auth`,
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Email de recuperação enviado!", {
        description: `Um email foi enviado para ${userEmail} com instruções para redefinir a senha.`,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Erro ao enviar email de recuperação:", error);
      toast.error("Erro ao enviar email", {
        description: error.message || "Não foi possível enviar o email de recuperação.",
      });
    },
  });

  // Mutation para resetar senha manualmente (Admin API)
  const resetPasswordManuallyMutation = useMutation({
    mutationFn: async (password: string) => {
      // Verificar se é master_admin
      if (profile?.user_type !== "master_admin") {
        throw new Error("Apenas master admins podem resetar senhas manualmente.");
      }

      // Verificar se há sessão ativa antes de chamar a função
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Você precisa estar logado para resetar senhas. Faça login novamente.");
      }

      console.log('🔐 Resetando senha via admin-reset-password:', { 
        userId: userId.substring(0, 8) + '***',
        hasSession: !!sessionData.session 
      });

      // Usar Admin API do Supabase via Edge Function
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: {
          userId,
          newPassword: password,
        },
      });

      console.log('🔐 Resposta da função:', { hasError: !!error, hasData: !!data, data, error });

      if (error) {
        // Extrair informações detalhadas do erro
        const errorDetails = {
          message: error.message,
          status: (error as any).status || (error as any).statusCode,
          context: (error as any).context,
          name: error.name,
          stack: error.stack
        };
        
        console.error('❌ Erro HTTP completo:', errorDetails);
        
        // Tentar extrair mensagem mais específica
        let errorMessage = error.message || 'Erro ao resetar senha';
        const statusCode = errorDetails.status;
        
        if (statusCode === 401) {
          errorMessage = 'Não autorizado. Verifique se você está logado como master admin e tente novamente.';
        } else if (statusCode === 403) {
          errorMessage = 'Acesso negado. Apenas master admins podem resetar senhas.';
        } else if (statusCode === 400) {
          errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
        } else if (statusCode === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        } else if (statusCode) {
          errorMessage = `Erro ${statusCode}: ${error.message}`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (data?.error) {
        console.error('❌ Erro retornado pela função:', data.error);
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Senha resetada com sucesso!", {
        description: `A nova senha foi definida para ${userName}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] });
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Erro ao resetar senha:", error);
      toast.error("Erro ao resetar senha", {
        description: error.message || "Não foi possível resetar a senha.",
      });
    },
  });

  // Handler para enviar email
  const handleSendRecoveryEmail = () => {
    sendRecoveryEmailMutation.mutate();
  };

  // Handler para resetar senha manualmente
  const handleResetPasswordManually = () => {
    // Validações
    if (!newPassword.trim()) {
      toast.error("Senha obrigatória", {
        description: "Por favor, insira uma nova senha.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Senha muito curta", {
        description: "A senha deve ter no mínimo 6 caracteres.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Senhas não conferem", {
        description: "A nova senha e a confirmação devem ser iguais.",
      });
      return;
    }

    resetPasswordManuallyMutation.mutate(newPassword);
  };

  // Verificar se é master admin
  const isMasterAdmin = profile?.user_type === "master_admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Resetar Senha do Usuário
          </DialogTitle>
          <DialogDescription>
            Resetar senha para <strong>{userName}</strong> ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "email" | "manual")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Enviar Email
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              className="flex items-center gap-2"
              disabled={!isMasterAdmin}
            >
              <Key className="h-4 w-4" />
              Definir Senha
            </TabsTrigger>
          </TabsList>

          {/* Tab: Enviar Email de Recuperação */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium">Email de Recuperação</p>
                  <p className="text-sm text-muted-foreground">
                    Um email será enviado para <strong>{userEmail}</strong> com um link seguro 
                    para o usuário redefinir sua própria senha.
                  </p>
                  <div className="mt-3 p-3 rounded-md bg-background border">
                    <p className="text-xs text-muted-foreground">
                      <strong>Como funciona:</strong>
                    </p>
                    <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                      <li>Email enviado automaticamente pelo Supabase</li>
                      <li>Link válido por 1 hora</li>
                      <li>Usuário define sua nova senha</li>
                      <li>Login automático após reset</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sendRecoveryEmailMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSendRecoveryEmail}
                disabled={sendRecoveryEmailMutation.isPending}
              >
                {sendRecoveryEmailMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Tab: Definir Senha Manualmente */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            {isMasterAdmin ? (
              <>
                <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>⚠️ Atenção:</strong> Você está definindo a senha diretamente. 
                    O usuário poderá fazer login imediatamente com a nova senha.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha *</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Digite a nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      disabled={resetPasswordManuallyMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Digite novamente a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      disabled={resetPasswordManuallyMutation.isPending}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={resetPasswordManuallyMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResetPasswordManually}
                    disabled={resetPasswordManuallyMutation.isPending}
                  >
                    {resetPasswordManuallyMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Key className="mr-2 h-4 w-4" />
                    Resetar Senha
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Acesso Restrito:</strong> Apenas Master Admins podem definir senhas manualmente. 
                  Use a opção "Enviar Email" para permitir que o usuário redefina sua própria senha.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

