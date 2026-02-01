import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Phone, Calendar, MessageSquare, User, RefreshCw } from 'lucide-react';
import { formatPhone } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  phone_number: string;
  name: string | null;
  push_name: string | null;
  source: string | null;
  is_whatsapp_valid: boolean | null;
  created_at: string | null;
  last_synced_at: string | null;
  customer_id: string | null;
}

interface LeadsListProps {
  storeId: string | null;
}

export function LeadsList({ storeId }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (storeId) {
      fetchLeads();
    }
  }, [storeId]);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredLeads(leads.filter(lead =>
        (lead.name || '').toLowerCase().includes(term) ||
        (lead.push_name || '').toLowerCase().includes(term) ||
        lead.phone_number.includes(searchTerm)
      ));
    } else {
      setFilteredLeads(leads);
    }
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      
      // Buscar contatos do WhatsApp que NÃO são clientes ainda (customer_id é null)
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('store_id', storeId)
        .is('customer_id', null)
        .order('last_synced_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const getSourceLabel = (source: string | null) => {
    switch (source) {
      case 'chat':
        return { label: 'Mensagem', color: 'bg-blue-600' };
      case 'sync':
        return { label: 'Sincronizado', color: 'bg-gray-600' };
      case 'group':
        return { label: 'Grupo', color: 'bg-purple-600' };
      case 'import':
        return { label: 'Importado', color: 'bg-green-600' };
      default:
        return { label: 'Desconhecido', color: 'bg-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchLeads}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Leads</CardDescription>
            <CardTitle className="text-3xl">{leads.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Via Mensagem</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {leads.filter(l => l.source === 'chat').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sincronizados</CardDescription>
            <CardTitle className="text-3xl text-gray-600">
              {leads.filter(l => l.source === 'sync').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de Leads */}
      {filteredLeads.length > 0 ? (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => {
            const sourceInfo = getSourceLabel(lead.source);
            const displayName = lead.name || lead.push_name || 'Sem nome';
            
            return (
              <Card key={lead.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3 flex-1 min-w-0">
                      {/* Nome e badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{displayName}</h3>
                        <Badge className={`${sourceInfo.color} text-white`}>
                          {sourceInfo.label}
                        </Badge>
                        {lead.is_whatsapp_valid && (
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            ✓ WhatsApp válido
                          </Badge>
                        )}
                      </div>

                      {/* Nome do WhatsApp (se diferente) */}
                      {lead.push_name && lead.name && lead.push_name !== lead.name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Nome no WhatsApp: {lead.push_name}</span>
                        </div>
                      )}

                      {/* Informações */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span className="truncate">{formatPhone(lead.phone_number)}</span>
                        </div>

                        {lead.created_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>
                              Capturado em {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        )}

                        {lead.last_synced_at && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            <span>
                              Última interação: {format(new Date(lead.last_synced_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const phone = lead.phone_number.replace(/\D/g, '');
                          window.open(`https://wa.me/${phone}`, '_blank');
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {searchTerm ? 'Nenhum lead encontrado para esta busca' : 'Nenhum lead capturado ainda. Os leads aparecerão aqui automaticamente quando enviarem mensagens pelo WhatsApp.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
