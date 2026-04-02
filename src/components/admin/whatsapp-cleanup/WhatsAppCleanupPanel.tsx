import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  AlertTriangle,
  Database,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  History,
  Settings,
  Shield,
  Clock,
  TrendingDown,
  CalendarClock,
} from "lucide-react";
import {
  AlertDialog,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface CleanupLog {
  id: string;
  store_id: string;
  store_name: string;
  deleted_messages: number;
  deleted_conversations: number;
  deleted_cycles: number;
  total_deleted: number;
  execution_type: string;
  executed_at: string;
}

interface CleanupSettings {
  id: string;
  is_enabled: boolean;
  retention_days: number;
  last_run_at: string | null;
  next_run_at: string | null;
}

export default function WhatsAppCleanupPanel() {
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState<DiagnoseResult | null>(null);
  const [cleanupTarget, setCleanupTarget] = useState<{ type: "single" | "all"; storeId?: string; storeName?: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const [activeTab, setActiveTab] = useState("diagnose");

  // History state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<CleanupLog[]>([]);
  const [historySummary, setHistorySummary] = useState<any>(null);

  // Settings state
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settings, setSettings] = useState<CleanupSettings | null>(null);
  const [retainedStores, setRetainedStores] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  const invokeFunction = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("whatsapp-cleanup-orphan-messages", { body });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Erro desconhecido");
    return data;
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const data = await invokeFunction({ action: "diagnose" });
      setDiagnoseResult(data);
      toast.success(`Diagnóstico: ${data.summary.total_stores} lojas com dados órfãos`);
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Desconhecido"));
    } finally {
      setDiagnosing(false);
    }
  };

  const handleCleanup = async () => {
    if (!cleanupTarget) return;
    setCleaning(true);
    try {
      const body = cleanupTarget.type === "all"
        ? { action: "cleanup-all" }
        : { action: "cleanup", store_id: cleanupTarget.storeId };
      const data = await invokeFunction(body);
      const total = cleanupTarget.type === "all" ? data.total_records_deleted : data.deleted?.total;
      toast.success(`✅ ${total?.toLocaleString("pt-BR")} registros removidos`);
      setCleanupTarget(null);
      setConfirmText("");
      handleDiagnose();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Desconhecido"));
    } finally {
      setCleaning(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await invokeFunction({ action: "history" });
      setHistoryLogs(data.logs || []);
      setHistorySummary(data.summary);
    } catch (err: any) {
      toast.error("Erro ao carregar histórico");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await invokeFunction({ action: "get-settings" });
      setSettings(data.settings);
      setRetainedStores(data.retained_stores || []);
    } catch (err: any) {
      toast.error("Erro ao carregar configurações");
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<CleanupSettings>) => {
    setSavingSettings(true);
    try {
      await invokeFunction({ action: "update-settings", ...updates });
      toast.success("Configurações salvas");
      loadSettings();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Desconhecido"));
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleRetention = async (storeId: string, retain: boolean) => {
    try {
      await invokeFunction({ action: "toggle-retention", store_id: storeId, retain });
      toast.success(retain ? "Retenção ativada para esta loja" : "Retenção removida");
      loadSettings();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Desconhecido"));
    }
  };

  useEffect(() => {
    if (activeTab === "history") loadHistory();
    if (activeTab === "settings") loadSettings();
  }, [activeTab]);

  const expectedConfirm = cleanupTarget?.type === "all" ? "LIMPAR TUDO" : "CONFIRMAR";

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Limpeza de Dados WhatsApp Órfãos</CardTitle>
              <CardDescription>
                Gerencie mensagens, conversas e ciclos de lojas sem módulo whatsapp_chat ativo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="diagnose" className="gap-1.5">
            <Search className="h-3.5 w-3.5" /> Diagnóstico
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Automação
          </TabsTrigger>
        </TabsList>

        {/* ====== DIAGNOSE TAB ====== */}
        <TabsContent value="diagnose" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleDiagnose} disabled={diagnosing} variant="outline">
              {diagnosing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {diagnosing ? "Analisando..." : "Diagnosticar"}
            </Button>
          </div>

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
                    <p className="text-2xl font-bold text-primary">{diagnoseResult.summary.total_messages.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">Mensagens</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-accent-foreground">{diagnoseResult.summary.total_conversations.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">Conversas</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">{diagnoseResult.summary.total_cycles.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">Ciclos</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-destructive">{diagnoseResult.summary.total_records.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
              </div>

              {diagnoseResult.report.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Detalhamento por Loja</CardTitle>
                      <Button variant="destructive" size="sm" onClick={() => setCleanupTarget({ type: "all" })}>
                        <Trash2 className="h-4 w-4 mr-2" /> Limpar Todas
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loja</TableHead>
                          <TableHead className="text-center">Msgs</TableHead>
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
                              <TableCell className="text-center"><Badge variant="secondary">{store.messages_count.toLocaleString("pt-BR")}</Badge></TableCell>
                              <TableCell className="text-center"><Badge variant="secondary">{store.conversations_count.toLocaleString("pt-BR")}</Badge></TableCell>
                              <TableCell className="text-center"><Badge variant="secondary">{store.cycles_count.toLocaleString("pt-BR")}</Badge></TableCell>
                              <TableCell className="text-center">
                                <Badge variant="destructive">
                                  {(store.messages_count + store.conversations_count + store.cycles_count).toLocaleString("pt-BR")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                                  onClick={() => setCleanupTarget({ type: "single", storeId: store.store_id, storeName: store.store_name })}>
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
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
                    <p className="text-lg font-medium">Nenhum dado órfão encontrado!</p>
                    <p className="text-sm text-muted-foreground">Todas as lojas com dados possuem o módulo whatsapp_chat ativo.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ====== HISTORY TAB ====== */}
        <TabsContent value="history" className="space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {historySummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{historySummary.executions}</p>
                      <p className="text-xs text-muted-foreground">Execuções</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{historySummary.total_deleted.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">Total Removido</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{historySummary.manual_count}</p>
                      <p className="text-xs text-muted-foreground">Manuais</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{historySummary.auto_count}</p>
                      <p className="text-xs text-muted-foreground">Automáticas</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {historyLogs.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Últimas Execuções</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Loja</TableHead>
                          <TableHead className="text-center">Tipo</TableHead>
                          <TableHead className="text-center">Msgs</TableHead>
                          <TableHead className="text-center">Conv.</TableHead>
                          <TableHead className="text-center">Ciclos</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {new Date(log.executed_at).toLocaleDateString("pt-BR")}{" "}
                              <span className="text-muted-foreground">{new Date(log.executed_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </TableCell>
                            <TableCell className="font-medium">{log.store_name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={log.execution_type === "auto" ? "default" : "secondary"}>
                                {log.execution_type === "auto" ? "Auto" : "Manual"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{Number(log.deleted_messages).toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-center">{Number(log.deleted_conversations).toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-center">{Number(log.deleted_cycles).toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="destructive">{Number(log.total_deleted).toLocaleString("pt-BR")}</Badge>
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
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-lg font-medium">Nenhuma limpeza executada ainda</p>
                    <p className="text-sm text-muted-foreground">Execute um diagnóstico e limpe dados na aba Diagnóstico.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ====== SETTINGS TAB ====== */}
        <TabsContent value="settings" className="space-y-4">
          {settingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : settings ? (
            <>
              {/* Auto-cleanup toggle */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Limpeza Automática
                  </CardTitle>
                  <CardDescription>
                    Quando ativada, o sistema limpa automaticamente dados órfãos a cada período configurado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={settings.is_enabled}
                        onCheckedChange={(checked) => updateSettings({ is_enabled: checked } as any)}
                        disabled={savingSettings}
                      />
                      <Label className="font-medium">
                        {settings.is_enabled ? "Automação Ativada" : "Automação Desativada"}
                      </Label>
                    </div>
                    <Badge variant={settings.is_enabled ? "default" : "secondary"}>
                      {settings.is_enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Período de Retenção</Label>
                      <Select
                        value={String(settings.retention_days)}
                        onValueChange={(val) => updateSettings({ retention_days: Number(val) } as any)}
                        disabled={savingSettings}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="15">15 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="60">60 dias</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Frequência entre execuções automáticas de limpeza
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Última execução: {settings.last_run_at ? new Date(settings.last_run_at).toLocaleDateString("pt-BR") : "Nunca"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Próxima execução: {settings.next_run_at ? new Date(settings.next_run_at).toLocaleDateString("pt-BR") : "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Retention exceptions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Exceções de Retenção
                  </CardTitle>
                  <CardDescription>
                    Lojas marcadas para manter histórico mesmo sem módulo whatsapp_chat ativo. 
                    Gerencie via diagnóstico ou diretamente na edição da loja.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {retainedStores.length > 0 ? (
                    <div className="space-y-2">
                      {retainedStores.map((store: any) => (
                        <div key={store.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <span className="text-sm font-medium">{store.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => toggleRetention(store.id, false)}
                          >
                            Remover exceção
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma loja com exceção de retenção configurada.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>
      </Tabs>

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
                    ? `Remover TODOS os dados órfãos de ${diagnoseResult?.summary.total_stores} lojas (${diagnoseResult?.summary.total_records.toLocaleString("pt-BR")} registros).`
                    : `Remover todos os dados de WhatsApp da loja "${cleanupTarget?.storeName}".`}
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
            <AlertDialogCancel onClick={() => { setCleanupTarget(null); setConfirmText(""); }}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={confirmText !== expectedConfirm || cleaning} onClick={handleCleanup}>
              {cleaning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {cleaning ? "Limpando..." : "Executar Limpeza"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
