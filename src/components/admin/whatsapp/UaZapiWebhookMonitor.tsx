import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Eye,
  Search,
  TrendingUp,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface WebhookLog {
  id: string;
  webhook_type: string;
  source: string;
  event_type: string | null;
  payload: any;
  status: string;
  processed_at: string | null;
  error_message: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  ip_address: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  success: number;
  error: number;
  pending: number;
}

export default function UaZapiWebhookMonitor() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, error: 0, pending: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  const [cleaning, setCleaning] = useState(false);

  // Filtros fixos para UaZapi/WhatsApp
  const whatsappTypes = ['whatsapp', 'uazapi', 'evolution'];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar estatísticas filtradas por whatsapp/uazapi
      const { data: allLogs } = await supabase
        .from('webhook_logs')
        .select('status')
        .in('webhook_type', whatsappTypes);

      if (allLogs) {
        setStats({
          total: allLogs.length,
          success: allLogs.filter(l => l.status === 'success').length,
          error: allLogs.filter(l => l.status === 'error').length,
          pending: allLogs.filter(l => l.status === 'received' || l.status === 'processing').length,
        });
      }

      // Gráfico últimos 7 dias
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: chartLogs } = await supabase
        .from('webhook_logs')
        .select('created_at, status')
        .in('webhook_type', whatsappTypes)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true });

      if (chartLogs) {
        const groupedByDay: Record<string, { date: string; success: number; error: number; total: number }> = {};
        chartLogs.forEach(log => {
          const day = format(new Date(log.created_at), 'dd/MM');
          if (!groupedByDay[day]) {
            groupedByDay[day] = { date: day, success: 0, error: 0, total: 0 };
          }
          groupedByDay[day].total++;
          if (log.status === 'success') groupedByDay[day].success++;
          if (log.status === 'error') groupedByDay[day].error++;
        });
        setChartData(Object.values(groupedByDay));
      }

      // Logs com filtros
      let query = supabase
        .from('webhook_logs')
        .select('*', { count: 'exact' })
        .in('webhook_type', whatsappTypes)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (searchQuery) {
        query = query.or(`source.ilike.%${searchQuery}%,event_type.ilike.%${searchQuery}%`);
      }

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data: logsData, count, error } = await query;
      if (error) throw error;

      setLogs(logsData || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error("Não foi possível carregar os logs de webhooks");
    } finally {
      setLoading(false);
    }
  };

  // Limpeza de logs via Edge Function
  const handleCleanup = async (action: 'cleanup' | 'cleanup_all') => {
    setCleaning(true);
    try {
      const { data, error } = await supabase.functions.invoke('webhook-cleanup', {
        body: { 
          action, 
          webhook_types: whatsappTypes,
          days_to_keep: 7
        }
      });
      if (error) throw error;
      toast.success(data?.message || 'Logs limpos com sucesso');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao limpar logs:', error);
      toast.error('Erro ao limpar logs: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter, searchQuery]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('uazapi-webhook-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webhook_logs' },
        (payload) => {
          const newLog = payload.new as WebhookLog;
          if (whatsappTypes.includes(newLog.webhook_type)) {
            fetchData();
            toast.info(`Webhook ${newLog.webhook_type} recebido`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">Sucesso</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">Erro</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">Processando</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30">Recebido</Badge>;
    }
  };

  const getEventLabel = (log: WebhookLog) => {
    if (log.event_type) return log.event_type;
    if (log.source) return log.source;
    return log.webhook_type;
  };

  const getProviderBadge = (type: string) => {
    switch (type) {
      case 'uazapi':
        return <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30 text-xs">UaZapi</Badge>;
      case 'evolution':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs">Evolution</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30 text-xs">WhatsApp</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <TooltipProvider delayDuration={300}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">Total de Eventos</p>
              <p className="text-xs text-muted-foreground">Quantidade total de webhooks recebidos dos provedores WhatsApp (UaZapi + Evolution). Inclui mensagens, atualizações de status e eventos de conexão.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Sucesso</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">Processados com Sucesso</p>
              <p className="text-xs text-muted-foreground">Eventos recebidos e processados corretamente pelo sistema. Mensagens foram logadas, status de entrega atualizados, ou conexões registradas sem erros.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Erros</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error}</p>
                    </div>
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">Erros de Processamento</p>
              <p className="text-xs text-muted-foreground">Eventos que falharam ao ser processados. Podem indicar payload inválido, erro de banco ou problemas na Edge Function. Verifique o payload clicando no ícone de olho.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                    </div>
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">Eventos Pendentes</p>
              <p className="text-xs text-muted-foreground">Eventos recebidos mas ainda não processados completamente, ou eventos de tipos desconhecidos aguardando implementação futura. Inclui status "received" e "processing".</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="success" fill="hsl(142, 76%, 36%)" name="Sucesso" />
                  <Bar dataKey="error" fill="hsl(0, 84%, 60%)" name="Erro" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar evento..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="received">Recebido</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchData} variant="outline" size="icon" className="shrink-0">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        {/* Botões de limpeza */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 text-destructive hover:text-destructive" disabled={cleaning}>
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Limpar +7d</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar logs antigos?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso removerá todos os logs de webhook do WhatsApp com mais de 7 dias. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleCleanup('cleanup')}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="shrink-0" disabled={cleaning}>
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Limpar tudo</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar TODOS os logs?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso removerá TODOS os logs de webhook do WhatsApp. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleCleanup('cleanup_all')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Limpar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum evento de webhook encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-sm">
                        {getEventLabel(log)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.webhook_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { 
                          addSuffix: true, locale: ptBR 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">ID</p>
                    <p className="font-mono text-xs break-all">{selectedLog.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    {getStatusBadge(selectedLog.status)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="text-sm">{selectedLog.webhook_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Evento</p>
                    <p className="text-sm">{selectedLog.event_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fonte</p>
                    <p className="text-sm">{selectedLog.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recebido em</p>
                    <p className="text-sm">{format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                  </div>
                  {selectedLog.ip_address && (
                    <div>
                      <p className="text-xs text-muted-foreground">IP</p>
                      <p className="font-mono text-xs">{selectedLog.ip_address}</p>
                    </div>
                  )}
                </div>

                {selectedLog.error_message && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-muted-foreground mb-1">Erro</p>
                    <p className="text-sm text-destructive">{selectedLog.error_message}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Payload</p>
                  <pre className="p-3 rounded-lg bg-muted/50 overflow-x-auto text-xs font-mono max-h-64">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
