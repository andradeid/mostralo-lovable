import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LeadQualificationGuide } from '@/components/leads/LeadQualificationGuide';
import { LeadRemindersAlert } from '@/components/leads/LeadRemindersAlert';
import { StaleLeadBadge, getRowClassName } from '@/components/leads/StaleLeadBadge';
import { LeadCard } from '@/components/leads/LeadCard';
import { QualificationBadge, QUALIFICATION_OPTIONS, getQualificationLabel } from '@/components/leads/QualificationBadge';
import type { QualificationLevel } from '@/components/leads/QualificationBadge';
import { ANSWER_LABELS } from '@/lib/diagnosticScoring';
import { 
  Users, 
  TrendingUp, 
  UserPlus, 
  Phone, 
  Mail, 
  Building2, 
  MapPin,
  Calendar,
  MessageSquare,
  Save,
  Loader2,
  Eye,
  RefreshCw,
  Download,
  Settings,
  ChevronDown,
  Star,
  ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiagnosticAnswers {
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  city: string;
  state: string | null;
  uses_ifood: boolean | null;
  referral_code: string | null;
  salesperson_id: string | null;
  status: string;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  converted_at: string | null;
  salespeople?: { full_name: string } | null;
  // Campos do diagnóstico
  qualification_level: QualificationLevel;
  qualification_score: number | null;
  diagnostic_answers: DiagnosticAnswers | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Novo', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contactado', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualificado', color: 'bg-purple-500' },
  { value: 'converted', label: 'Convertido', color: 'bg-green-500' },
  { value: 'lost', label: 'Perdido', color: 'bg-red-500' }
];

// Labels das perguntas do diagnóstico
const QUESTION_LABELS: Record<string, string> = {
  q1: 'Visibilidade no Google',
  q2: 'Conversão WhatsApp/IA',
  q3: 'Upsell no Balcão',
  q4: 'Maior Desafio'
};

export default function LeadsManagementPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('Olá! Sou {nome} e gostaria de saber mais sobre o Mostralo!');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState('');
  const [updatingLead, setUpdatingLead] = useState(false);
  const [whatsappConfigOpen, setWhatsappConfigOpen] = useState(false);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    converted: 0,
    conversionRate: 0,
    elite: 0,
    diagnostic: 0
  });

  useEffect(() => {
    fetchLeads();
    fetchWhatsappConfig();
  }, [statusFilter, qualificationFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          salespeople:salesperson_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (qualificationFilter !== 'all') {
        query = query.eq('qualification_level', qualificationFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Cast necessário pois Supabase retorna string genérico para enums
      setLeads((data || []) as Lead[]);

      // Calcular estatísticas
      const allLeads = data || [];
      const newLeads = allLeads.filter(l => l.status === 'new').length;
      const convertedLeads = allLeads.filter(l => l.status === 'converted').length;
      const eliteLeads = allLeads.filter(l => l.qualification_level === 'elite').length;
      const diagnosticLeads = allLeads.filter(l => l.source === 'diagnostico').length;
      
      setStats({
        total: allLeads.length,
        new: newLeads,
        converted: convertedLeads,
        conversionRate: allLeads.length > 0 ? Math.round((convertedLeads / allLeads.length) * 100) : 0,
        elite: eliteLeads,
        diagnostic: diagnosticLeads
      });
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os leads.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappConfig = async () => {
    try {
      const { data } = await supabase
        .from('subscription_payment_config')
        .select('support_whatsapp, support_whatsapp_message')
        .limit(1)
        .single();
      
      if (data?.support_whatsapp) {
        setSupportWhatsapp(data.support_whatsapp);
      }
      if (data?.support_whatsapp_message) {
        setWhatsappMessage(data.support_whatsapp_message);
      }
    } catch (error) {
      console.error('Erro ao buscar config:', error);
    }
  };

  const handleSaveWhatsapp = async () => {
    setSavingWhatsapp(true);
    try {
      const { error } = await supabase
        .from('subscription_payment_config')
        .update({ 
          support_whatsapp: supportWhatsapp.replace(/\D/g, ''),
          support_whatsapp_message: whatsappMessage
        })
        .eq('id', (await supabase.from('subscription_payment_config').select('id').limit(1).single()).data?.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Configurações de WhatsApp atualizadas!'
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const MESSAGE_TEMPLATES = [
    'Olá! Sou {nome} da {empresa} em {cidade}. Tenho interesse em conhecer o Mostralo!',
    'Oi! Aqui é {nome}, da empresa {empresa}. Vim pelo site e quero tirar dúvidas sobre o sistema.',
    'Olá, sou {nome}! Minha empresa é a {empresa} e {ifood} usamos iFood. Quero saber mais!',
    'E aí! {nome} aqui, de {cidade}. Minha empresa: {empresa}. Quero conhecer o Mostralo!'
  ];

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'contacted' && !leads.find(l => l.id === leadId)?.contacted_at) {
        updates.contacted_at = new Date().toISOString();
      }
      if (newStatus === 'converted') {
        updates.converted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);

      if (error) throw error;

      fetchLeads();
      toast({
        title: 'Status atualizado',
        description: 'O status do lead foi alterado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    
    setUpdatingLead(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: leadNotes })
        .eq('id', selectedLead.id);

      if (error) throw error;

      fetchLeads();
      setSelectedLead(null);
      toast({
        title: 'Notas salvas',
        description: 'As anotações foram salvas com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as notas.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingLead(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      lead.company_name.toLowerCase().includes(term) ||
      lead.city.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={`${config?.color || 'bg-gray-500'} text-white`}>
        {config?.label || status}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cidade', 'Status', 'Vendedor', 'Data', 'Qualificação', 'Pontuação', 'Origem'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company_name,
      lead.city,
      STATUS_OPTIONS.find(s => s.value === lead.status)?.label || lead.status,
      lead.salespeople?.full_name || '-',
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm'),
      getQualificationLabel(lead.qualification_level),
      lead.qualification_score ?? '-',
      lead.source || 'landing-page'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleLeadClick = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setLeadNotes(lead.notes || '');
    }
  };

  // Renderizar respostas do diagnóstico
  const renderDiagnosticAnswers = (answers: DiagnosticAnswers | null, score: number | null) => {
    if (!answers) return null;

    return (
      <div className="space-y-3 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Diagnóstico de Maturidade</span>
          {score !== null && (
            <Badge variant="outline" className="ml-auto">
              {score}/12 pontos
            </Badge>
          )}
        </div>
        <div className="space-y-2 text-sm">
          {Object.entries(answers).map(([key, value]) => {
            if (!value) return null;
            const questionKey = key as keyof typeof ANSWER_LABELS;
            const answerLabel = ANSWER_LABELS[questionKey]?.[value] || value;
            return (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {QUESTION_LABELS[key] || key}:
                </span>
                <span className="text-foreground">{answerLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Guia de Qualificação */}
      <LeadQualificationGuide />

      {/* Alertas de Leads Parados */}
      <LeadRemindersAlert onLeadClick={handleLeadClick} />

      {/* Configuração do WhatsApp - Colapsável */}
      <Card className="border-primary/20 bg-primary/5">
        <Collapsible open={whatsappConfigOpen} onOpenChange={setWhatsappConfigOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-primary/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 md:w-5 md:h-5" />
                  <CardTitle className="text-sm md:text-lg">Config WhatsApp</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${whatsappConfigOpen ? 'rotate-180' : ''}`} />
              </div>
              <CardDescription className="text-xs md:text-sm">
                Número que receberá os leads do formulário
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 md:space-y-4 pt-0">
              <div>
                <Label htmlFor="whatsapp-number" className="text-xs md:text-sm font-medium mb-1.5 block">
                  Número do WhatsApp
                </Label>
                <Input
                  id="whatsapp-number"
                  placeholder="5511999999999"
                  value={supportWhatsapp}
                  onChange={(e) => setSupportWhatsapp(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp-message" className="text-xs md:text-sm font-medium mb-1.5 block">
                  Mensagem Personalizada
                </Label>
                <p className="text-[10px] md:text-xs text-muted-foreground mb-2">
                  Campos disponíveis (clique para adicionar):
                </p>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-1.5 pb-2">
                    {['{nome}', '{email}', '{telefone}', '{empresa}', '{cidade}', '{ifood}'].map((placeholder) => (
                      <Badge 
                        key={placeholder}
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary/10 shrink-0 text-[10px] md:text-xs" 
                        onClick={() => setWhatsappMessage(prev => prev + placeholder)}
                      >
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="md:hidden" />
                </ScrollArea>
                <Textarea
                  id="whatsapp-message"
                  placeholder="Digite a mensagem..."
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Templates - Colapsáveis no mobile */}
              <Collapsible className="md:hidden">
                <CollapsibleTrigger className="text-xs font-medium text-primary flex items-center gap-1">
                  💡 Ver modelos de mensagens
                  <ChevronDown className="w-3 h-3" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1.5 mt-2">
                    {MESSAGE_TEMPLATES.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setWhatsappMessage(template)}
                        className="w-full text-left text-[10px] p-2 rounded bg-background hover:bg-primary/10 transition-colors border"
                      >
                        "{template}"
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Templates - Sempre visíveis no desktop */}
              <div className="hidden md:block bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  💡 Modelos de mensagens (clique para usar):
                </p>
                <div className="space-y-2">
                  {MESSAGE_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setWhatsappMessage(template)}
                      className="w-full text-left text-xs p-2 rounded bg-background hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                    >
                      "{template}"
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveWhatsapp} disabled={savingWhatsapp} className="w-full sm:w-auto h-9 text-sm">
                {savingWhatsapp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Estatísticas - Compactas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">Total</span>
                  <span className="hidden md:inline">Total de Leads</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg shrink-0">
                <UserPlus className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{stats.new}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">Novos</span>
                  <span className="hidden md:inline">Novos Hoje</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-lg shrink-0">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">Conversão</span>
                  <span className="hidden md:inline">Taxa Conversão</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-amber-500/10 rounded-lg shrink-0">
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{stats.converted}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">Convertidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Novos cards de diagnóstico */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-amber-500/20 rounded-lg shrink-0">
                <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{stats.elite}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">Elite</span>
                  <span className="hidden md:inline">Leads Elite</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-emerald-500/20 rounded-lg shrink-0">
                <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{stats.diagnostic}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  <span className="md:hidden">Diagnóstico</span>
                  <span className="hidden md:inline">Via Diagnóstico</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Lista */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex flex-col gap-3">
            <CardTitle className="text-lg md:text-xl">Leads</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-40 md:w-48 h-9 text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1 sm:w-28 md:w-32 h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={qualificationFilter} onValueChange={setQualificationFilter}>
                  <SelectTrigger className="flex-1 sm:w-28 md:w-32 h-9 text-sm">
                    <SelectValue placeholder="Qualificação" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchLeads} className="h-9 w-9 shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={exportToCSV} className="h-9 shrink-0">
                  <Download className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Exportar</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead encontrado
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {filteredLeads.map((lead) => (
                  <Dialog key={lead.id}>
                    <LeadCard
                      lead={lead}
                      statusOptions={STATUS_OPTIONS}
                      onStatusChange={handleUpdateLeadStatus}
                      onViewDetails={() => {
                        setSelectedLead(lead);
                        setLeadNotes(lead.notes || '');
                      }}
                    />
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Lead</DialogTitle>
                        <DialogDescription>
                          Visualize e adicione notas sobre este lead.
                        </DialogDescription>
                      </DialogHeader>
                      {selectedLead && selectedLead.id === lead.id && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Nome</Label>
                              <p className="font-medium text-sm">{selectedLead.name}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Empresa</Label>
                              <p className="font-medium text-sm">{selectedLead.company_name}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Email</Label>
                              <p className="font-medium text-sm truncate">{selectedLead.email}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Telefone</Label>
                              <p className="font-medium text-sm">{selectedLead.phone}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Cidade</Label>
                              <p className="font-medium text-sm">{selectedLead.city}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Qualificação</Label>
                              <div className="mt-1">
                                <QualificationBadge 
                                  level={selectedLead.qualification_level} 
                                  score={selectedLead.qualification_score}
                                  showScore
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Respostas do diagnóstico */}
                          {renderDiagnosticAnswers(selectedLead.diagnostic_answers, selectedLead.qualification_score)}
                          
                          <div>
                            <Label className="text-sm">Notas</Label>
                            <Textarea
                              value={leadNotes}
                              onChange={(e) => setLeadNotes(e.target.value)}
                              placeholder="Adicione observações sobre este lead..."
                              rows={3}
                              className="text-sm"
                            />
                          </div>
                          <Button 
                            onClick={handleSaveNotes} 
                            disabled={updatingLead}
                            className="w-full h-9"
                          >
                            {updatingLead ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar Notas
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                ))}
              </div>

              {/* Desktop: Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Qualificação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className={getRowClassName(lead.updated_at, lead.status)}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{lead.name}</p>
                              <StaleLeadBadge updatedAt={lead.updated_at} status={lead.status} />
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {lead.city}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {lead.company_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </p>
                            <p className="text-sm flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <QualificationBadge 
                            level={lead.qualification_level} 
                            score={lead.qualification_score}
                            showScore
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={lead.status}
                            onValueChange={(value) => handleUpdateLeadStatus(lead.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setLeadNotes(lead.notes || '');
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Lead</DialogTitle>
                                <DialogDescription>
                                  Visualize e adicione notas sobre este lead.
                                </DialogDescription>
                              </DialogHeader>
                              {selectedLead && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Nome</Label>
                                      <p className="font-medium">{selectedLead.name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Empresa</Label>
                                      <p className="font-medium">{selectedLead.company_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Email</Label>
                                      <p className="font-medium">{selectedLead.email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Telefone</Label>
                                      <p className="font-medium">{selectedLead.phone}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Cidade</Label>
                                      <p className="font-medium">{selectedLead.city}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Qualificação</Label>
                                      <div className="mt-1">
                                        <QualificationBadge 
                                          level={selectedLead.qualification_level} 
                                          score={selectedLead.qualification_score}
                                          showScore
                                          size="md"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Respostas do diagnóstico */}
                                  {renderDiagnosticAnswers(selectedLead.diagnostic_answers, selectedLead.qualification_score)}
                                  
                                  <div>
                                    <Label>Notas</Label>
                                    <Textarea
                                      value={leadNotes}
                                      onChange={(e) => setLeadNotes(e.target.value)}
                                      placeholder="Adicione observações sobre este lead..."
                                      rows={4}
                                    />
                                  </div>
                                  <Button 
                                    onClick={handleSaveNotes} 
                                    disabled={updatingLead}
                                    className="w-full"
                                  >
                                    {updatingLead ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                      <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Salvar Notas
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
