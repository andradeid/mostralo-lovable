import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { 
  ArrowLeft, 
  Search, 
  Download,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  XCircle,
  RefreshCw,
  BarChart3,
  Users,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

interface Message {
  id: string;
  customer_name: string;
  phone_number: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_messages: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: Clock },
  sent: { label: "Enviada", color: "bg-blue-500/10 text-blue-500", icon: Send },
  delivered: { label: "Entregue", color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
  read: { label: "Lida", color: "bg-primary/10 text-primary", icon: Eye },
  failed: { label: "Falha", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#6b7280'];

export default function WhatsAppCampaignMessagesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (storeId && id) {
      fetchData();
    }
  }, [storeId, id]);

  const fetchData = async () => {
    try {
      // Buscar campanha
      const { data: campaignData, error: campaignError } = await supabase
        .from('whatsapp_campaigns' as any)
        .select('*')
        .eq('id', id)
        .eq('store_id', storeId)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData as unknown as Campaign);

      // Buscar mensagens
      const { data: messagesData, error: messagesError } = await supabase
        .from('whatsapp_messages' as any)
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setMessages((messagesData || []) as unknown as Message[]);

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = messages.length;
    const sent = messages.filter(m => m.status === 'sent' || m.status === 'delivered' || m.status === 'read').length;
    const delivered = messages.filter(m => m.status === 'delivered' || m.status === 'read').length;
    const read = messages.filter(m => m.status === 'read').length;
    const failed = messages.filter(m => m.status === 'failed').length;
    const pending = messages.filter(m => m.status === 'pending').length;

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      pending,
      sentRate: total > 0 ? ((sent / total) * 100).toFixed(1) : 0,
      deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : 0,
      readRate: delivered > 0 ? ((read / delivered) * 100).toFixed(1) : 0,
      failRate: total > 0 ? ((failed / total) * 100).toFixed(1) : 0,
    };
  }, [messages]);

  // Dados para gráficos
  const pieData = useMemo(() => [
    { name: 'Enviadas', value: stats.sent - stats.delivered, color: '#3b82f6' },
    { name: 'Entregues', value: stats.delivered - stats.read, color: '#10b981' },
    { name: 'Lidas', value: stats.read, color: '#8b5cf6' },
    { name: 'Falhas', value: stats.failed, color: '#ef4444' },
    { name: 'Pendentes', value: stats.pending, color: '#6b7280' },
  ].filter(d => d.value > 0), [stats]);

  const barData = useMemo(() => [
    { name: 'Enviadas', valor: stats.sent, fill: '#3b82f6' },
    { name: 'Entregues', valor: stats.delivered, fill: '#10b981' },
    { name: 'Lidas', valor: stats.read, fill: '#8b5cf6' },
    { name: 'Falhas', valor: stats.failed, fill: '#ef4444' },
  ], [stats]);

  // Filtrar mensagens
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const matchesSearch = searchQuery === "" || 
        m.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone_number?.includes(searchQuery);
      
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [messages, searchQuery, statusFilter]);

  // Exportar CSV
  const exportCSV = () => {
    const headers = ["Cliente", "Telefone", "Status", "Enviada em", "Entregue em", "Lida em", "Erro"];
    const rows = filteredMessages.map(m => [
      m.customer_name || '',
      m.phone_number || '',
      statusConfig[m.status]?.label || m.status,
      m.sent_at ? format(new Date(m.sent_at), 'dd/MM/yyyy HH:mm') : '',
      m.delivered_at ? format(new Date(m.delivered_at), 'dd/MM/yyyy HH:mm') : '',
      m.read_at ? format(new Date(m.read_at), 'dd/MM/yyyy HH:mm') : '',
      m.error_message || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `campanha_${campaign?.name || id}_mensagens.csv`;
    link.click();

    toast({
      title: "CSV exportado!",
      description: `${filteredMessages.length} mensagens exportadas`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campanha não encontrada</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/whatsapp/campaigns')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard/whatsapp/campaigns')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">
              Histórico de mensagens • {stats.total} mensagens
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-xs text-muted-foreground">{stats.sentRate}%</p>
              </div>
              <Send className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">{stats.deliveryRate}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lidas</p>
                <p className="text-2xl font-bold">{stats.read}</p>
                <p className="text-xs text-muted-foreground">{stats.readRate}%</p>
              </div>
              <Eye className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falhas</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">{stats.failRate}%</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funil de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Mensagens */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Mensagens</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="read">Lida</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead>Entregue</TableHead>
                  <TableHead>Lida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma mensagem encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((message) => {
                    const config = statusConfig[message.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    
                    return (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium">
                          {message.customer_name || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {message.phone_number}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          {message.error_message && (
                            <p className="text-xs text-destructive mt-1">{message.error_message}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {message.sent_at 
                            ? format(new Date(message.sent_at), 'dd/MM HH:mm', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {message.delivered_at 
                            ? format(new Date(message.delivered_at), 'dd/MM HH:mm', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {message.read_at 
                            ? format(new Date(message.read_at), 'dd/MM HH:mm', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Mostrando {filteredMessages.length} de {messages.length} mensagens
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
