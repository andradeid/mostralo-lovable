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
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Eye,
  Search,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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

export default function WebhooksMonitorPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, error: 0, pending: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  
  // Filtros
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar estatísticas
      const { data: allLogs } = await supabase
        .from('webhook_logs')
        .select('status', { count: 'exact' });

      if (allLogs) {
        const statsData: Stats = {
          total: allLogs.length,
          success: allLogs.filter(l => l.status === 'success').length,
          error: allLogs.filter(l => l.status === 'error').length,
          pending: allLogs.filter(l => l.status === 'received' || l.status === 'processing').length,
        };
        setStats(statsData);
      }

      // Buscar dados para o gráfico (últimos 7 dias)
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: chartLogs } = await supabase
        .from('webhook_logs')
        .select('created_at, status')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true });

      if (chartLogs) {
        // Agrupar por dia
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

      // Buscar logs com filtros
      let query = supabase
        .from('webhook_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('webhook_type', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`source.ilike.%${searchQuery}%,related_entity_id.ilike.%${searchQuery}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: logsData, count, error } = await query;

      if (error) throw error;

      setLogs(logsData || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs de webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, typeFilter, statusFilter, searchQuery]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('webhook-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_logs',
        },
        (payload) => {
          console.log('Novo webhook recebido:', payload);
          fetchData(); // Recarregar dados
          toast({
            title: "Novo webhook",
            description: `Webhook ${(payload.new as WebhookLog).webhook_type} recebido`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Sucesso</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Erro</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Processando</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Recebido</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pix':
        return '💳';
      case 'boleto':
        return '📄';
      case 'whatsapp':
        return '💬';
      case 'ifood':
        return '🍔';
      case 'account':
        return '👤';
      default:
        return '📡';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitor de Webhooks</h1>
          <p className="text-muted-foreground">Acompanhe todos os webhooks recebidos pelo sistema</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sucesso</p>
                <p className="text-3xl font-bold text-green-500">{stats.success}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Erros</p>
                <p className="text-3xl font-bold text-red-500">{stats.error}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Webhooks nos últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID ou fonte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="ifood">iFood</SelectItem>
                <SelectItem value="account">Conta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum webhook encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="text-lg mr-2">{getTypeIcon(log.webhook_type)}</span>
                        <span className="font-medium">{log.webhook_type.toUpperCase()}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.source}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {log.related_entity_type && (
                          <span className="text-sm">
                            {log.related_entity_type}
                            {log.related_entity_id && (
                              <span className="text-muted-foreground ml-1">
                                ({log.related_entity_id.slice(0, 8)}...)
                              </span>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
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
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
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
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getTypeIcon(selectedLog.webhook_type)}
              Detalhes do Webhook
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-sm">{selectedLog.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedLog.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p>{selectedLog.webhook_type.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fonte</p>
                    <p>{selectedLog.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recebido em</p>
                    <p>{format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Processado em</p>
                    <p>{selectedLog.processed_at 
                      ? format(new Date(selectedLog.processed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                      : '-'
                    }</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">IP</p>
                    <p className="font-mono text-sm">{selectedLog.ip_address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entidade</p>
                    <p>
                      {selectedLog.related_entity_type 
                        ? `${selectedLog.related_entity_type} (${selectedLog.related_entity_id?.slice(0, 8)}...)`
                        : '-'
                      }
                    </p>
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Mensagem de Erro</p>
                    <p className="text-red-400">{selectedLog.error_message}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payload</p>
                  <pre className="p-4 rounded-lg bg-muted/50 overflow-x-auto text-xs font-mono">
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
