import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Phone, Calendar, MessageSquare, User, RefreshCw } from 'lucide-react';
import { normalizePhone } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Normaliza telefone para formato canônico (apenas dígitos, sem DDI, com 9 se celular)
const normalizePhoneForComparison = (phone: string): string => {
  let digits = phone.replace(/\D/g, '');
  
  // Remove DDI 55 se presente (pode ter 12 ou 13 dígitos com DDI)
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.substring(2);
  }
  
  // Caso especial: número com 11 dígitos começando com 55
  // Isso pode ser DDI 55 + número de 9 dígitos (sem DDD) - formato incorreto
  // Vamos extrair apenas o número do assinante para comparação
  if (digits.startsWith('55') && digits.length === 11) {
    // Provavelmente é DDI 55 + 9 dígitos, vamos tratar como número sem DDD
    digits = digits.substring(2); // Remove 55, fica com 9 dígitos
  }
  
  // Remove 0 à esquerda do DDD se presente
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.substring(1);
  }
  
  // Se tem 10 dígitos, adicionar o 9 após o DDD (celular brasileiro)
  if (digits.length === 10) {
    digits = digits.substring(0, 2) + '9' + digits.substring(2);
  }
  
  return digits;
};

// Extrai apenas o número do assinante (últimos 8-9 dígitos) para deduplicação mais agressiva
const getSubscriberNumber = (phone: string): string => {
  // IMPORTANTE: para deduplicação, precisamos comparar sempre a partir de um
  // formato consistente (sem DDI e corrigindo casos como "5599..." sem DDD).
  const normalized = normalizePhoneForComparison(phone);

  // Assinante no Brasil: 9 dígitos (celular) ou 8 dígitos (fixo)
  // - Se temos DDD+celular (11), pegar últimos 9
  // - Se temos DDD+fixo (10), pegar últimos 8
  // - Se vier sem DDD (8-9), usar o que tiver
  if (normalized.length >= 11) return normalized.slice(-9);
  if (normalized.length === 10) return normalized.slice(-8);
  if (normalized.length >= 9) return normalized.slice(-9);
  return normalized;
};

// Formata telefone brasileiro para exibição (55) XXXX-XXXX ou (XX) XXXXX-XXXX
const formatPhoneDisplay = (phone: string): string => {
  const normalized = normalizePhoneForComparison(phone);
  
  if (normalized.length === 11) {
    // Formato: (XX) XXXXX-XXXX
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 7)}-${normalized.slice(7)}`;
  }
  if (normalized.length === 10) {
    // Formato: (XX) XXXX-XXXX
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)}-${normalized.slice(6)}`;
  }
  
  // Fallback: retorna o número original formatado
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('55')) {
    // Com DDI: formatar sem o 55
    const withoutDdi = digits.substring(2);
    if (withoutDdi.length === 11) {
      return `(${withoutDdi.slice(0, 2)}) ${withoutDdi.slice(2, 7)}-${withoutDdi.slice(7)}`;
    }
  }
  return phone;
};

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
    if (!storeId) {
      console.log('❌ LeadsList: storeId não definido');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 LeadsList: Buscando leads para store:', storeId);
      
      // 1. Buscar contatos do WhatsApp que NÃO são clientes ainda
      const { data: contactsData, error: contactsError } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('store_id', storeId)
        .is('customer_id', null)
        .order('last_synced_at', { ascending: false, nullsFirst: false });

      if (contactsError) throw contactsError;

      // 2. Buscar números únicos de whatsapp_messages que interagiram com a loja
      // mas não estão em whatsapp_contacts
      const { data: messagesData, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('phone_number, customer_name, created_at')
        .eq('store_id', storeId)
        .not('phone_number', 'is', null)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // 3. Combinar os dados usando deduplicação AGRESSIVA
      // Usa tanto o telefone normalizado quanto o número do assinante para detectar duplicatas
      
      // Map de número do assinante -> lead mais completo/recente
      const subscriberMap = new Map<string, Lead>();
      
      // Função para adicionar/atualizar lead no map com prioridade
      const addLeadWithPriority = (lead: Lead, source: 'contact' | 'message') => {
        const normalizedPhone = normalizePhoneForComparison(lead.phone_number);
        const subscriberNum = getSubscriberNumber(lead.phone_number);
        
        // Verificar se já existe pelo número do assinante (deduplicação agressiva)
        const existing = subscriberMap.get(subscriberNum);
        
        if (!existing) {
          // Não existe, adicionar
          subscriberMap.set(subscriberNum, {
            ...lead,
            phone_number: normalizedPhone.length >= 10 ? lead.phone_number : lead.phone_number
          });
        } else {
          // Já existe - decidir qual manter
          const existingDate = new Date(existing.last_synced_at || existing.created_at || 0).getTime();
          const newDate = new Date(lead.last_synced_at || lead.created_at || 0).getTime();
          const existingHasName = !!(existing.name || existing.push_name);
          const newHasName = !!(lead.name || lead.push_name);
          
          // Priorizar: 1) contatos sobre mensagens, 2) com nome, 3) mais recente, 4) telefone mais completo
          const existingNormalized = normalizePhoneForComparison(existing.phone_number);
          const newNormalized = normalizePhoneForComparison(lead.phone_number);
          
          const shouldReplace = 
            // Novo tem nome e antigo não
            (newHasName && !existingHasName) ||
            // Ambos têm ou não têm nome, mas novo é mais recente
            (newHasName === existingHasName && newDate > existingDate) ||
            // Novo tem telefone mais completo (com DDD válido)
            (newNormalized.length === 11 && existingNormalized.length < 11);
          
          if (shouldReplace) {
            subscriberMap.set(subscriberNum, lead);
          }
        }
      };
      
      // Processar contatos primeiro (têm prioridade)
      (contactsData || []).forEach(contact => {
        addLeadWithPriority(contact, 'contact');
      });
      
      // Processar mensagens
      (messagesData || []).forEach(msg => {
        if (!msg.phone_number) return;
        
        const messageLead: Lead = {
          id: `msg-${getSubscriberNumber(msg.phone_number)}`,
          phone_number: msg.phone_number,
          name: msg.customer_name,
          push_name: null,
          source: 'chat',
          is_whatsapp_valid: true,
          created_at: msg.created_at,
          last_synced_at: msg.created_at,
          customer_id: null
        };
        
        addLeadWithPriority(messageLead, 'message');
      });

      const allLeads: Lead[] = Array.from(subscriberMap.values());
      
      // Ordenar por data mais recente
      allLeads.sort((a, b) => {
        const dateA = new Date(a.last_synced_at || a.created_at || 0).getTime();
        const dateB = new Date(b.last_synced_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      console.log('✅ LeadsList: Leads encontrados:', allLeads.length, '(contatos:', contactsData?.length || 0, ', mensagens:', messagesData?.length || 0, ')');
      setLeads(allLeads);
      setFilteredLeads(allLeads);
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
                          <span className="truncate">{formatPhoneDisplay(lead.phone_number)}</span>
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
