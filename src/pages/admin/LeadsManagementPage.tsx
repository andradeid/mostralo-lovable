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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  contacted_at: string | null;
  converted_at: string | null;
  salespeople?: { full_name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Novo', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contactado', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualificado', color: 'bg-purple-500' },
  { value: 'converted', label: 'Convertido', color: 'bg-green-500' },
  { value: 'lost', label: 'Perdido', color: 'bg-red-500' }
];

export default function LeadsManagementPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('Olá! Sou {nome} e gostaria de saber mais sobre o Mostralo!');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState('');
  const [updatingLead, setUpdatingLead] = useState(false);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    converted: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchLeads();
    fetchWhatsappConfig();
  }, [statusFilter]);

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

      const { data, error } = await query;

      if (error) throw error;

      setLeads(data || []);

      // Calcular estatísticas
      const allLeads = data || [];
      const newLeads = allLeads.filter(l => l.status === 'new').length;
      const convertedLeads = allLeads.filter(l => l.status === 'converted').length;
      
      setStats({
        total: allLeads.length,
        new: newLeads,
        converted: convertedLeads,
        conversionRate: allLeads.length > 0 ? Math.round((convertedLeads / allLeads.length) * 100) : 0
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
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cidade', 'Status', 'Vendedor', 'Data'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company_name,
      lead.city,
      STATUS_OPTIONS.find(s => s.value === lead.status)?.label || lead.status,
      lead.salespeople?.full_name || '-',
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Configuração do WhatsApp */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            Configuração do WhatsApp de Suporte
          </CardTitle>
          <CardDescription>
            Este número receberá os leads após preencherem o formulário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="whatsapp-number" className="text-sm font-medium mb-2 block">
              Número do WhatsApp
            </Label>
            <Input
              id="whatsapp-number"
              placeholder="5511999999999"
              value={supportWhatsapp}
              onChange={(e) => setSupportWhatsapp(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="whatsapp-message" className="text-sm font-medium mb-2 block">
              Mensagem Personalizada
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Use os campos abaixo para personalizar. Serão substituídos automaticamente:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => setWhatsappMessage(prev => prev + '{nome}')}>
                {'{nome}'}
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => setWhatsappMessage(prev => prev + '{email}')}>
                {'{email}'}
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => setWhatsappMessage(prev => prev + '{telefone}')}>
                {'{telefone}'}
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => setWhatsappMessage(prev => prev + '{empresa}')}>
                {'{empresa}'}
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => setWhatsappMessage(prev => prev + '{cidade}')}>
                {'{cidade}'}
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => setWhatsappMessage(prev => prev + '{ifood}')}>
                {'{ifood}'}
              </Badge>
            </div>
            <Textarea
              id="whatsapp-message"
              placeholder="Digite a mensagem..."
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
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

          <Button onClick={handleSaveWhatsapp} disabled={savingWhatsapp} className="w-full sm:w-auto">
            {savingWhatsapp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserPlus className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-sm text-muted-foreground">Novos Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.converted}</p>
                <p className="text-sm text-muted-foreground">Convertidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabela */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Leads</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
              <Button variant="outline" size="icon" onClick={fetchLeads}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.name}</p>
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
                          {lead.salespeople?.full_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
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
                            <DialogContent>
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
                                      <Label className="text-muted-foreground">Usa iFood?</Label>
                                      <p className="font-medium">
                                        {selectedLead.uses_ifood === true ? 'Sim' : selectedLead.uses_ifood === false ? 'Não' : '—'}
                                      </p>
                                    </div>
                                  </div>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}