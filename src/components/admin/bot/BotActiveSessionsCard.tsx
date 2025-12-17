import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBotSessions, BotSession } from "@/hooks/useBotSessions";
import { useState } from "react";
import {
  MessageSquare,
  RefreshCw,
  Search,
  Pause,
  Square,
  Trash2,
  Play,
  Loader2,
  User,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface BotActiveSessionsCardProps {
  storeId: string | null;
}

export function BotActiveSessionsCard({ storeId }: BotActiveSessionsCardProps) {
  const { toast } = useToast();
  const {
    sessions,
    loading,
    actionLoading,
    error,
    refetch,
    pauseSession,
    closeSession,
    openSession,
    deleteSession,
  } = useBotSessions(storeId);

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<BotSession | null>(null);

  const filteredSessions = sessions.filter(
    (session) =>
      session.remoteJid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.pushName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatPhone = (remoteJid: string): string => {
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
    if (phone.length >= 12) {
      const ddi = phone.slice(0, 2);
      const ddd = phone.slice(2, 4);
      const prefix = phone.slice(4, 9);
      const suffix = phone.slice(9);
      return `+${ddi} (${ddd}) ${prefix}-${suffix}`;
    }
    return phone;
  };

  const getWhatsAppLink = (remoteJid: string): string => {
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
    return `https://wa.me/${phone}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "opened":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">🟢 Aberta</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">🟡 Pausada</Badge>;
      case "closed":
        return <Badge className="bg-muted text-muted-foreground">⚪ Fechada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = async (
    session: BotSession,
    action: "pause" | "close" | "open" | "delete"
  ) => {
    if (action === "delete") {
      setDeleteConfirm(session);
      return;
    }

    let result;
    let successMessage = "";
    let actionName = "";

    switch (action) {
      case "pause":
        result = await pauseSession(session.remoteJid);
        successMessage = "Bot pausado para este contato";
        actionName = "pausar";
        break;
      case "close":
        result = await closeSession(session.remoteJid);
        successMessage = "Sessão encerrada com sucesso";
        actionName = "encerrar";
        break;
      case "open":
        result = await openSession(session.remoteJid);
        successMessage = "Bot reativado para este contato";
        actionName = "reativar";
        break;
    }

    if (result?.success) {
      toast({ title: "Sucesso", description: successMessage });
    } else {
      toast({
        title: "Erro",
        description: result?.error || `Falha ao ${actionName}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    const result = await deleteSession(deleteConfirm.remoteJid);
    setDeleteConfirm(null);

    if (result?.success) {
      toast({ title: "Sucesso", description: "Sessão excluída com sucesso" });
    } else {
      toast({
        title: "Erro",
        description: result?.error || "Falha ao excluir sessão",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Sessões Ativas</CardTitle>
              {sessions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {sessions.length}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Gerencie as conversas ativas com o assistente IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por número ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Estado de erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">
                {searchQuery
                  ? "Nenhuma sessão encontrada com esse filtro"
                  : "Nenhuma sessão ativa no momento"}
              </p>
              <p className="text-xs mt-1">
                {searchQuery
                  ? "Tente outro termo de busca"
                  : "As sessões aparecerão aqui quando clientes iniciarem conversas"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header da tabela - Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                <div className="col-span-4">Contato</div>
                <div className="col-span-3">Nome</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {/* Lista de sessões */}
              {filteredSessions.map((session) => (
                <div
                  key={session.remoteJid}
                  className="flex flex-col md:grid md:grid-cols-12 gap-2 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  {/* Contato */}
                  <div className="md:col-span-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-mono text-xs sm:text-sm truncate">
                      {formatPhone(session.remoteJid)}
                    </span>
                    <a
                      href={getWhatsAppLink(session.remoteJid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir conversa no WhatsApp"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>

                  {/* Nome */}
                  <div className="md:col-span-3 flex items-center gap-2">
                    <span className="text-sm truncate">
                      {session.isCustomer ? session.customerName : (session.pushName || "—")}
                    </span>
                    {session.isCustomer && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs shrink-0">
                        Cliente
                      </Badge>
                    )}
                  </div>

                  {/* Status */}
                  <div className="md:col-span-3 flex items-center">
                    {getStatusBadge(session.status)}
                  </div>

                  {/* Ações */}
                  <div className="md:col-span-2 flex items-center justify-end gap-1">
                    {actionLoading === session.remoteJid ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {/* Pausar - apenas para sessões abertas */}
                        {session.status === "opened" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(session, "pause")}
                            className="h-7 px-2 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-700"
                            title="Pausar Bot"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline ml-1 text-xs">Pausar</span>
                          </Button>
                        )}

                        {/* Reativar - apenas para sessões pausadas */}
                        {session.status === "paused" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(session, "open")}
                            className="h-7 px-2 text-green-600 border-green-500/30 hover:bg-green-500/10 hover:text-green-700"
                            title="Reativar Bot"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline ml-1 text-xs">Reativar</span>
                          </Button>
                        )}

                        {/* Encerrar - para sessões não fechadas */}
                        {session.status !== "closed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(session, "close")}
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            title="Encerrar Sessão"
                          >
                            <Square className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline ml-1 text-xs">Encerrar</span>
                          </Button>
                        )}

                        {/* Excluir - sempre visível */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(session, "delete")}
                          className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Excluir Sessão"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dica */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Dica sobre as ações:</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li><strong>Pausar:</strong> O bot para de responder, mas a sessão continua</li>
                <li><strong>Encerrar:</strong> Finaliza a conversa atual</li>
                <li><strong>Excluir:</strong> Remove a sessão do histórico</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá remover permanentemente a sessão de{" "}
              <strong>{deleteConfirm?.pushName || formatPhone(deleteConfirm?.remoteJid || "")}</strong>.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
