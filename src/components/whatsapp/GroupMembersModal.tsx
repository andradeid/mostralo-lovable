import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Users, Crown, Shield, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Group {
  group_jid: string;
  name: string | null;
  participants_count: number;
}

interface Member {
  id: string;
  phoneNumber?: string;
  admin?: string;
  name?: string;
  pushName?: string;
}

interface SyncedContact {
  phone_number: string;
  name: string | null;
  customer_name: string | null;
  labels: string[];
}

interface GroupMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  instance: {
    instance_name: string;
  };
}

export function GroupMembersModal({ 
  open, 
  onOpenChange, 
  group,
  instance 
}: GroupMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [syncedContactsMap, setSyncedContactsMap] = useState<Map<string, SyncedContact>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, group.group_jid]);

  const createPhoneVariants = (phone: string): string[] => {
    const cleaned = phone.replace(/\D/g, '');
    const variants = [cleaned];
    
    // Com e sem 55
    if (cleaned.startsWith('55')) {
      variants.push(cleaned.slice(2));
    } else {
      variants.push('55' + cleaned);
    }
    
    return variants;
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();

      if (!store) throw new Error('Loja não encontrada');

      // Buscar membros do grupo via API
      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'fetchGroupMembers',
          store_id: store.id,
          instance_name: instance.instance_name,
          group_jid: group.group_jid,
        },
      });

      if (response.error) throw response.error;

      const participants = response.data.members?.participants || response.data.members || [];
      setMembers(participants);

      // Buscar contatos sincronizados com etiquetas
      const { data: contacts } = await supabase
        .from('whatsapp_contacts')
        .select(`
          phone_number,
          name,
          customer_id,
          whatsapp_contact_label_assignments(
            whatsapp_contact_labels(name)
          )
        `)
        .eq('store_id', store.id);

      // Buscar nomes dos clientes separadamente
      const customerIds = contacts?.map(c => c.customer_id).filter(Boolean) || [];
      let customersMap = new Map<string, string>();
      
      if (customerIds.length > 0) {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds);
        
        customers?.forEach(c => customersMap.set(c.id, c.name));
      }

      // Criar mapa de telefone → contato
      const contactsMap = new Map<string, SyncedContact>();
      contacts?.forEach(contact => {
        const labels = contact.whatsapp_contact_label_assignments
          ?.map((a: any) => a.whatsapp_contact_labels?.name)
          .filter(Boolean) || [];

        const syncedContact: SyncedContact = {
          phone_number: contact.phone_number,
          name: contact.name,
          customer_name: contact.customer_id ? customersMap.get(contact.customer_id) || null : null,
          labels,
        };

        // Adicionar variantes do telefone para matching
        const variants = createPhoneVariants(contact.phone_number);
        variants.forEach(v => contactsMap.set(v, syncedContact));
      });

      setSyncedContactsMap(contactsMap);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      toast.error('Erro ao carregar membros do grupo');
    } finally {
      setLoading(false);
    }
  };

  const extractPhoneFromMember = (member: Member): string | null => {
    if (member.phoneNumber) {
      const cleaned = member.phoneNumber
        .replace('@s.whatsapp.net', '')
        .replace('@c.us', '');
      if (/^\d{10,13}$/.test(cleaned)) {
        return cleaned;
      }
    }
    
    if (member.id && !member.id.includes('@lid')) {
      const cleaned = member.id
        .replace('@s.whatsapp.net', '')
        .replace('@c.us', '');
      if (/^\d{10,13}$/.test(cleaned)) {
        return cleaned;
      }
    }
    
    return null;
  };

  const findSyncedContact = (phone: string | null): SyncedContact | null => {
    if (!phone) return null;
    const variants = createPhoneVariants(phone);
    for (const v of variants) {
      const contact = syncedContactsMap.get(v);
      if (contact) return contact;
    }
    return null;
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    } else if (cleaned.length === 12) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    } else if (cleaned.length === 11) {
      return `+55 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `+55 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getDisplayName = (member: Member, syncedContact: SyncedContact | null): string => {
    return syncedContact?.customer_name 
      || syncedContact?.name 
      || member.name 
      || member.pushName 
      || 'Sem nome';
  };

  const filteredMembers = members.filter(member => {
    const phone = extractPhoneFromMember(member) || '';
    const syncedContact = findSyncedContact(phone);
    const displayName = getDisplayName(member, syncedContact);
    const labelsText = syncedContact?.labels.join(' ') || '';
    
    return phone.includes(searchTerm) 
      || displayName.toLowerCase().includes(searchTerm.toLowerCase())
      || labelsText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros do Grupo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{group.name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">
                {members.length} membros carregados
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {filteredMembers.map((member, index) => {
                  const phone = extractPhoneFromMember(member);
                  const syncedContact = findSyncedContact(phone);
                  const displayName = getDisplayName(member, syncedContact);

                  return (
                    <div 
                      key={member.id || index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">
                            {displayName}
                          </p>
                          {syncedContact?.labels.map(label => (
                            <Badge 
                              key={label} 
                              variant="outline" 
                              className="text-xs px-1.5 py-0 h-5 gap-1"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {label}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {phone 
                            ? formatPhoneNumber(phone)
                            : 'Número não disponível'}
                        </p>
                      </div>

                      {member.admin === 'admin' && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {member.admin === 'superadmin' && (
                        <Badge className="text-xs bg-amber-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Dono
                        </Badge>
                      )}
                    </div>
                  );
                })}

                {filteredMembers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum membro encontrado
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
