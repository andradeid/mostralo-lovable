import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { 
  Loader2, 
  Plus, 
  Play, 
  Pause, 
  XCircle,
  Eye,
  Users,
  Send,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";

export default function WhatsAppCampaignsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (storeId) {
      fetchCampaigns();
    }
  }, [storeId]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_campaigns' as any)
        .select(`
          *,
          template:whatsapp_templates(name)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: 'start' | 'pause' | 'resume' | 'cancel') => {
    setActionLoading(campaignId);
    try {
      const response = await supabase.functions.invoke('whatsapp-campaign', {
        body: { action, campaignId, storeId },
      });

      if (response.error) throw response.error;

      toast({
        title: "Sucesso",
        description: action === 'start' ? 'Campanha iniciada' : 
                     action === 'pause' ? 'Campanha pausada' :
                     action === 'resume' ? 'Campanha retomada' : 'Campanha cancelada',
      });

      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao executar ação",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Rascunho</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Agendada</Badge>;
      case 'running':
        return <Badge className="bg-green-500"><Play className="h-3 w-3 mr-1" /> Em Execução</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500"><Pause className="h-3 w-3 mr-1" /> Pausada</Badge>;
      case 'completed':
        return <Badge className="bg-primary"><CheckCircle className="h-3 w-3 mr-1" /> Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateProgress = (campaign: any) => {
    if (campaign.total_recipients === 0) return 0;
    return Math.round((campaign.messages_sent / campaign.total_recipients) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas WhatsApp</h1>
          <p className="text-muted-foreground">
            Gerencie suas campanhas de recuperação de clientes
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/whatsapp/campaigns/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Send className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Nenhuma campanha criada ainda.<br />
              Crie sua primeira campanha para recuperar clientes!
            </p>
            <Button onClick={() => navigate('/dashboard/whatsapp/campaigns/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <Card key={campaign.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>
                      Template: {campaign.template?.name || 'Não definido'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.description && (
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{campaign.total_recipients} destinatários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span>{campaign.messages_sent} enviadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{campaign.messages_delivered} entregues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>{campaign.messages_read} lidas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>{campaign.messages_failed} falhas</span>
                  </div>
                </div>

                {campaign.status === 'running' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{calculateProgress(campaign)}%</span>
                    </div>
                    <Progress value={calculateProgress(campaign)} />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {campaign.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleCampaignAction(campaign.id, 'start')}
                      disabled={actionLoading === campaign.id}
                    >
                      {actionLoading === campaign.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      Iniciar
                    </Button>
                  )}

                  {campaign.status === 'running' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCampaignAction(campaign.id, 'pause')}
                      disabled={actionLoading === campaign.id}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pausar
                    </Button>
                  )}

                  {campaign.status === 'paused' && (
                    <Button
                      size="sm"
                      onClick={() => handleCampaignAction(campaign.id, 'resume')}
                      disabled={actionLoading === campaign.id}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Retomar
                    </Button>
                  )}

                  {['running', 'paused'].includes(campaign.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCampaignAction(campaign.id, 'cancel')}
                      disabled={actionLoading === campaign.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/dashboard/whatsapp/campaigns/${campaign.id}`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </div>

                {campaign.started_at && (
                  <p className="text-xs text-muted-foreground">
                    Iniciada em: {new Date(campaign.started_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
