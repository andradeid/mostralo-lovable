import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Plus, Search, Eye, Copy, Trash2, Send,
  Clock, CheckCircle, XCircle, AlertCircle, Filter, HelpCircle, BarChart3, List, MessageSquare
} from 'lucide-react';
import { useCommercialProposals, useDeleteProposal } from '@/hooks/useCommercialProposals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
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
import { ProposalsTutorial, useProposalsTutorial } from '@/components/proposals/ProposalsTutorial';
import { ProposalsDashboard } from '@/components/proposals/ProposalsDashboard';
import { ProposalWhatsAppTemplateModal } from '@/components/proposals/ProposalWhatsAppTemplateModal';
import { ProposalTemplatesManager } from '@/components/proposals/ProposalTemplatesManager';

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: Clock },
  sent: { label: 'Enviada', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Send },
  viewed: { label: 'Visualizada', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Eye },
  accepted: { label: 'Aceita', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  rejected: { label: 'Rejeitada', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
  expired: { label: 'Expirada', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: AlertCircle },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ProposalsListPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedProposalForWhatsApp, setSelectedProposalForWhatsApp] = useState<{
    client_name: string;
    client_phone: string;
    slug: string;
    final_monthly_price: number;
    billing_cycle: string;
    valid_until?: string;
  } | null>(null);

  const { showTutorial, completeTutorial, openTutorial } = useProposalsTutorial();

  const { data: proposals = [], isLoading } = useCommercialProposals({ 
    status: statusFilter !== 'all' ? statusFilter : undefined 
  });
  const deleteProposal = useDeleteProposal();

  const filteredProposals = proposals.filter(p => 
    p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.proposal_number.includes(searchTerm)
  );

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/proposta/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const openWhatsAppModal = (proposal: any) => {
    setSelectedProposalForWhatsApp({
      client_name: proposal.client_name,
      client_phone: proposal.client_phone,
      slug: proposal.slug,
      final_monthly_price: proposal.final_monthly_price,
      billing_cycle: proposal.billing_cycle,
      valid_until: proposal.valid_until,
    });
    setWhatsappModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProposal.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tutorial */}
      <ProposalsTutorial open={showTutorial} onComplete={completeTutorial} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-7 h-7 text-primary" />
              Propostas Comerciais
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas propostas personalizadas
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={openTutorial}
            className="text-muted-foreground hover:text-primary"
            title="Ver instruções"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/propostas/nova">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Proposta
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Propostas</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <ProposalsDashboard showSalespersonRanking={true} />
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="mt-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, empresa ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="sent">Enviada</SelectItem>
                    <SelectItem value="viewed">Visualizada</SelectItem>
                    <SelectItem value="accepted">Aceita</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Proposals List */}
          <div className="space-y-3">
            {filteredProposals.map((proposal) => {
              const status = statusConfig[proposal.status] || statusConfig.draft;
              const StatusIcon = status.icon;

              return (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-lg">{proposal.client_name}</span>
                          {proposal.client_company && (
                            <span className="text-muted-foreground">- {proposal.client_company}</span>
                          )}
                          <Badge variant="outline" className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>#{proposal.proposal_number}</span>
                          <span>{proposal.niche?.name || 'Sem nicho'}</span>
                          <span>{formatCurrency(proposal.final_monthly_price)}/mês</span>
                          <span>
                            {format(new Date(proposal.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(proposal.slug)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWhatsAppModal(proposal)}
                          className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Link to={`/proposta/${proposal.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(proposal.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredProposals.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhuma proposta encontrada.
                  </p>
                  <Link to="/dashboard/propostas/nova" className="mt-4 inline-block">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Proposta
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <ProposalTemplatesManager />
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A proposta será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WhatsApp Template Modal */}
      <ProposalWhatsAppTemplateModal
        open={whatsappModalOpen}
        onClose={() => {
          setWhatsappModalOpen(false);
          setSelectedProposalForWhatsApp(null);
        }}
        proposal={selectedProposalForWhatsApp}
      />
    </div>
  );
}
