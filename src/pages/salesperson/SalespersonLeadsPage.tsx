import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuth } from '@/hooks/use-auth';
import { LeadQualificationGuide } from '@/components/leads/LeadQualificationGuide';
import { LeadRemindersAlert } from '@/components/leads/LeadRemindersAlert';
import { StaleLeadBadge, getRowClassName } from '@/components/leads/StaleLeadBadge';
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
  Download
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
  status: string;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  converted_at: string | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Novo', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contactado', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualificado', color: 'bg-purple-500' },
  { value: 'converted', label: 'Convertido', color: 'bg-green-500' },
  { value: 'lost', label: 'Perdido', color: 'bg-red-500' }
];

export default function SalespersonLeadsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState('');
  const [updatingLead, setUpdatingLead] = useState(false);
  const [salespersonId, setSalespersonId] = useState<string | null>(null);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    converted: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchSalespersonId();
    }
  }, [user?.id]);

  useEffect(() => {
    if (salespersonId) {
      fetchLeads();
    }
  }, [salespersonId, statusFilter]);

  const fetchSalespersonId = async () => {
    try {
      const { data, error } = await supabase
        .from('salespeople')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSalespersonId(data?.id);
    } catch (error) {
      console.error('Erro ao buscar salesperson:', error);
    }
  };

  const fetchLeads = async () => {
    if (!salespersonId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('salesperson_id', salespersonId)
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

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cidade', 'Status', 'Data'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company_name,
      lead.city,
      STATUS_OPTIONS.find(s => s.value === lead.status)?.label || lead.status,
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `meus_leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleLeadClick = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setLeadNotes(lead.notes || '');
    }
  };

  return (
    <div className="space-y-6">
      {/* Guia de Qualificação */}
      <LeadQualificationGuide />

      {/* Alertas de Leads Parados */}
      <LeadRemindersAlert onLeadClick={handleLeadClick} salespersonId={salespersonId || undefined} />

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
                <p className="text-sm text-muted-foreground">Meus Leads</p>
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
                <p className="text-sm text-muted-foreground">Novos</p>
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
                <p className="text-sm text-muted-foreground">Conversão</p>
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

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Meus Leads</CardTitle>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className={getRowClassName(lead.updated_at, lead.status)}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
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