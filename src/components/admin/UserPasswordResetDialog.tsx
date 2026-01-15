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
import { Loader2, Mail, Key, MessageCircle, AlertCircle, Phone } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserPasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string | null;
}

/**
 * Dialog para resetar senha de usuário
 * Permite ao super admin:
 * 1. Enviar email de recuperação de senha
 * 2. Definir nova senha diretamente (sem email)
 * 3. Enviar link de recuperação via WhatsApp
 */
export function UserPasswordResetDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName,
  userPhone,
}: UserPasswordResetDialogProps) {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"email" | "manual" | "whatsapp">("email");

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

  // Mutation para enviar link via WhatsApp
  const sendRecoveryWhatsAppMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-user-recovery-link", {
        body: { email: userEmail }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Link enviado via WhatsApp!", {
        description: `Um link de recuperação foi enviado para ${formatPhone(userPhone || '')}.`,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Erro ao enviar WhatsApp:", error);
      toast.error("Erro ao enviar WhatsApp", {
        description: error.message || "Não foi possível enviar o link via WhatsApp.",
      });
    },
  });

  // Mutation para resetar senha manualmente (Admin API)
  const resetPasswordManuallyMutation = useMutation({
    mutationFn: async (password: string) => {
      // Verificar se é master_admin (⚠️ NUNCA confiar em role no profile)
      if (userRole !== "master_admin") {
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

  // Handler para enviar via WhatsApp
  const handleSendRecoveryWhatsApp = () => {
    sendRecoveryWhatsAppMutation.mutate();
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
  const isMasterAdmin = userRole === "master_admin";
  const hasPhone = !!userPhone && userPhone.replace(/\D/g, '').length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Key className="h-4 w-4 md:h-5 md:w-5" />
            Resetar Senha
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Resetar senha para <strong className="truncate">{userName}</strong>
            <span className="hidden sm:inline"> ({userEmail})</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "email" | "manual" | "whatsapp")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 md:h-10">
            <TabsTrigger value="email" className="text-xs md:text-sm flex items-center gap-1 md:gap-1.5">
              <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs md:text-sm flex items-center gap-1 md:gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              className="text-xs md:text-sm flex items-center gap-1 md:gap-1.5"
              disabled={!isMasterAdmin}
            >
              <Key className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Senha</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Enviar Email de Recuperação */}
          <TabsContent value="email" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <div className="rounded-lg border bg-muted/50 p-3 md:p-4 space-y-2">
              <div className="flex items-start gap-2 md:gap-3">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium">Email de Recuperação</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Um email será enviado para <strong className="break-all">{userEmail}</strong> com um link seguro 
                    para o usuário redefinir sua própria senha.
                  </p>
                  <div className="mt-2 md:mt-3 p-2 md:p-3 rounded-md bg-background border">
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      <strong>Como funciona:</strong>
                    </p>
                    <ol className="text-[10px] md:text-xs text-muted-foreground mt-1.5 md:mt-2 space-y-0.5 md:space-y-1 list-decimal list-inside">
                      <li>Email enviado automaticamente</li>
                      <li>Link válido por 1 hora</li>
                      <li>Usuário define sua nova senha</li>
                      <li>Login automático após reset</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sendRecoveryEmailMutation.isPending}
                size="sm"
                className="h-9"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSendRecoveryEmail}
                disabled={sendRecoveryEmailMutation.isPending}
                size="sm"
                className="h-9"
              >
                {sendRecoveryEmailMutation.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                )}
                <Mail className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Enviar </span>Email
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Tab: Enviar via WhatsApp */}
          <TabsContent value="whatsapp" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            {hasPhone ? (
              <>
                <div className="rounded-lg border bg-muted/50 p-3 md:p-4 space-y-2">
                  <div className="flex items-start gap-2 md:gap-3">
                    <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600 mt-0.5 shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium">Recuperação via WhatsApp</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Um link de recuperação será enviado para:
                      </p>
                      <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-background border">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{formatPhone(userPhone || '')}</span>
                      </div>
                      <div className="mt-2 md:mt-3 p-2 md:p-3 rounded-md bg-background border">
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          <strong>Como funciona:</strong>
                        </p>
                        <ol className="text-[10px] md:text-xs text-muted-foreground mt-1.5 md:mt-2 space-y-0.5 md:space-y-1 list-decimal list-inside">
                          <li>Mensagem enviada via WhatsApp</li>
                          <li>Link válido por 1 hora</li>
                          <li>Usuário define sua nova senha</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={sendRecoveryWhatsAppMutation.isPending}
                    size="sm"
                    className="h-9"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSendRecoveryWhatsApp}
                    disabled={sendRecoveryWhatsAppMutation.isPending}
                    size="sm"
                    className="h-9 bg-green-600 hover:bg-green-700"
                  >
                    {sendRecoveryWhatsAppMutation.isPending && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                    )}
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Enviar </span>WhatsApp
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Telefone não cadastrado</strong>
                  <p className="mt-1">
                    Este usuário não possui um número de telefone cadastrado. 
                    Edite o perfil do usuário para adicionar um telefone antes de usar esta opção.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab: Definir Senha Manualmente */}
          <TabsContent value="manual" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            {isMasterAdmin ? (
              <>
                <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-3 md:p-4">
                  <p className="text-xs md:text-sm text-orange-800 dark:text-orange-200">
                    <strong>⚠️ Atenção:</strong> Você está definindo a senha diretamente. 
                    O usuário poderá fazer login imediatamente.
                  </p>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="new-password" className="text-xs md:text-sm">Nova Senha *</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Digite a nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      disabled={resetPasswordManuallyMutation.isPending}
                      className="h-9 md:h-10 text-sm"
                    />
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs md:text-sm">Confirmar Senha *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Digite novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      disabled={resetPasswordManuallyMutation.isPending}
                      className="h-9 md:h-10 text-sm"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={resetPasswordManuallyMutation.isPending}
                    size="sm"
                    className="h-9"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResetPasswordManually}
                    disabled={resetPasswordManuallyMutation.isPending}
                    size="sm"
                    className="h-9"
                  >
                    {resetPasswordManuallyMutation.isPending && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                    )}
                    <Key className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                    Resetar
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-3 md:p-4">
                <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Acesso Restrito:</strong> Apenas Master Admins podem definir senhas manualmente. 
                  Use "Enviar Email" para recuperação.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
