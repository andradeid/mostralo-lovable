import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  AlertTriangle,
  Database,
  MessageSquare,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StoreReport {
  store_id: string;
  store_name: string;
  messages_count: number;
  conversations_count: number;
  cycles_count: number;
}

interface DiagnoseResult {
  report: StoreReport[];
  summary: {
    total_stores: number;
    total_messages: number;
    total_conversations: number;
    total_cycles: number;
    total_records: number;
  };
}

export default function WhatsAppCleanupPanel() {
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState<DiagnoseResult | null>(null);
  const [cleanupTarget, setCleanupTarget] = useState<{ type: "single" | "all"; storeId?: string; storeName?: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [cleaning, setCleaning] = useState(false);

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-cleanup-orphan-messages", {
        body: { action: "diagnose" },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      setDiagnoseResult(data);
      toast.success(`Diagnóstico concluído: ${data.summary.total_stores} lojas com dados órfãos`);
    } catch (err: any) {
      toast.error("Erro ao diagnosticar: " + (err.message || "Erro desconhecido"));
    } finally {
      setDiagnosing(false);
    }
  };

  const handleCleanup = async () => {
    if (!cleanupTarget) return;
    setCleaning(true);

    try {
      const body =
        cleanupTarget.type === "all"
          ? { action: "cleanup-all" }
          : { action: "cleanup", store_id: cleanupTarget.storeId };

      const { data, error } = await supabase.functions.invoke("whatsapp-cleanup-orphan-messages", {
        body,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      const total = cleanupTarget.type === "all" ? data.total_records_deleted : data.deleted?.total;
      toast.success(`✅ Limpeza concluída! ${total?.toLocaleString("pt-BR")} registros removidos`);

      // Refresh diagnosis
      setDiagnoseResult(null);
      setCleanupTarget(null);
      setConfirmText("");
      handleDiagnose();
    } catch (err: any) {
      toast.error("Erro na limpeza: " + (err.message || "Erro desconhecido"));
    } finally {
      setCleaning(false);
    }
  };

  const expectedConfirm = cleanupTarget?.type === "all" ? "LIMPAR TUDO" : "CONFIRMAR";

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Database className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Limpeza de Dados WhatsApp Órfãos</CardTitle>
                <CardDescription>
                  Remove mensagens, conversas e ciclos de lojas sem o módulo whatsapp_chat ativo
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleDiagnose} disabled={diagnosing} variant="outline">
              {diagnosing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {diagnosing ? "Analisando..." : "Diagnosticar"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary */}
      {diagnoseResult && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{diagnoseResult.summary.total_stores}</p>
                <p className="text-xs text-muted-foreground">Lojas Afetadas</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{diagnoseResult.summary.total_messages.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">Mensagens</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{diagnoseResult.summary.total_conversations.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">Conversas</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{diagnoseResult.summary.total_cycles.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">Ciclos</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/10">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{diagnoseResult.summary.total_records.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">Total de Registros</p>
              </CardContent>
            </Card>
          </div>

          {/* Store Table */}
          {diagnoseResult.report.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Detalhamento por Loja</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setCleanupTarget({ type: "all" })}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loja</TableHead>
                      <TableHead className="text-center">Mensagens</TableHead>
                      <TableHead className="text-center">Conversas</TableHead>
                      <TableHead className="text-center">Ciclos</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnoseResult.report
                      .sort((a, b) => (b.messages_count + b.conversations_count + b.cycles_count) - (a.messages_count + a.conversations_count + a.cycles_count))
                      .map((store) => (
                        <TableRow key={store.store_id}>
                          <TableCell className="font-medium">{store.store_name || store.store_id.slice(0, 8)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{store.messages_count.toLocaleString("pt-BR")}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{store.conversations_count.toLocaleString("pt-BR")}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{store.cycles_count.toLocaleString("pt-BR")}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">
                              {(store.messages_count + store.conversations_count + store.cycles_count).toLocaleString("pt-BR")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setCleanupTarget({
                                  type: "single",
                                  storeId: store.store_id,
                                  storeName: store.store_name,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-medium">Nenhum dado órfão encontrado!</p>
                <p className="text-sm text-muted-foreground">Todas as lojas com dados possuem o módulo whatsapp_chat ativo.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!cleanupTarget} onOpenChange={(open) => !open && setCleanupTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Confirmar Limpeza
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {cleanupTarget?.type === "all"
                    ? `Você está prestes a remover TODOS os dados órfãos de ${diagnoseResult?.summary.total_stores} lojas (${diagnoseResult?.summary.total_records.toLocaleString("pt-BR")} registros).`
                    : `Você está prestes a remover todos os dados de WhatsApp da loja "${cleanupTarget?.storeName}".`}
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Esta ação é irreversível!
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Digite <span className="font-bold text-destructive">{expectedConfirm}</span> para confirmar:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background"
                    placeholder={expectedConfirm}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCleanupTarget(null); setConfirmText(""); }}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={confirmText !== expectedConfirm || cleaning}
              onClick={handleCleanup}
            >
              {cleaning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {cleaning ? "Limpando..." : "Executar Limpeza"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
