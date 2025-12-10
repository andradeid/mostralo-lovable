import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Search, Users, Crown, Shield, Tag, Pencil, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditContactModal } from "./EditContactModal";
import { BulkLabelModal } from "./BulkLabelModal";

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

interface LabelWithColor {
  name: string;
  color: string;
}

interface SyncedContact {
  phone_number: string;
  name: string | null;
  customer_id: string | null;
  customer_name: string | null;
  profile_picture_url: string | null;
  labels: LabelWithColor[];
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
  const [storeId, setStoreId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<{
    phone_number: string;
    name: string | null;
    profile_picture_url?: string | null;
    customer_id?: string | null;
    customer_name?: string | null;
    labels: { name: string; color: string }[];
  } | null>(null);
  
  // Seleção múltipla
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  const [showBulkLabelModal, setShowBulkLabelModal] = useState(false);
  const [addingAllContacts, setAddingAllContacts] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
      setSelectedPhones(new Set());
    }
  }, [open, group.group_jid]);

  const createPhoneVariants = (phone: string): string[] => {
    const cleaned = phone.replace(/\D/g, '');
    const variants = [cleaned];
    
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
      setStoreId(store.id);

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

      const { data: contacts } = await supabase
        .from('whatsapp_contacts')
        .select(`
          id,
          phone_number,
          name,
          customer_id,
          profile_picture_url,
          whatsapp_contact_label_assignments(
            whatsapp_contact_labels(name, color)
          )
        `)
        .eq('store_id', store.id);

      const customerIds = contacts?.map(c => c.customer_id).filter(Boolean) || [];
      const customersMap = new Map<string, string>();
      
      if (customerIds.length > 0) {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds);
        
        customers?.forEach(c => customersMap.set(c.id, c.name));
      }

      const contactsMap = new Map<string, SyncedContact>();
      contacts?.forEach(contact => {
        const labels: LabelWithColor[] = contact.whatsapp_contact_label_assignments
          ?.map((a: { whatsapp_contact_labels: { name: string; color: string } | null }) => ({
            name: a.whatsapp_contact_labels?.name,
            color: a.whatsapp_contact_labels?.color || '#6b7280'
          }))
          .filter((l: LabelWithColor) => l.name) || [];

        const syncedContact: SyncedContact = {
          phone_number: contact.phone_number,
          name: contact.name,
          customer_id: contact.customer_id || null,
          customer_name: contact.customer_id ? customersMap.get(contact.customer_id) || null : null,
          profile_picture_url: contact.profile_picture_url || null,
          labels,
        };

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

  // Membros não sincronizados
  const getUnsyncedMembers = (): { member: Member; phone: string }[] => {
    return members
      .map(m => ({ member: m, phone: extractPhoneFromMember(m) }))
      .filter((item): item is { member: Member; phone: string } => 
        item.phone !== null && !findSyncedContact(item.phone)
      );
  };

  // Adicionar todos como contatos
  const handleAddAllAsContacts = async () => {
    if (!storeId) return;
    
    const unsyncedMembers = getUnsyncedMembers();
    if (unsyncedMembers.length === 0) {
      toast.info('Todos os membros já são contatos');
      return;
    }

    setAddingAllContacts(true);
    try {
      const contactsToInsert = unsyncedMembers.map(({ member, phone }) => ({
        store_id: storeId,
        phone_number: phone,
        name: member.name || member.pushName || null,
        source: 'whatsapp_group',
        whatsapp_jid: member.id,
      }));

      const { error } = await supabase
        .from('whatsapp_contacts')
        .upsert(contactsToInsert, { 
          onConflict: 'store_id,phone_number',
          ignoreDuplicates: true 
        });

      if (error) throw error;

      toast.success(`${unsyncedMembers.length} contatos adicionados com sucesso!`);
      await fetchMembers();
    } catch (error) {
      console.error('Erro ao adicionar contatos:', error);
      toast.error('Erro ao adicionar contatos');
    } finally {
      setAddingAllContacts(false);
    }
  };

  // Toggle seleção individual
  const toggleSelection = (phone: string) => {
    const newSelection = new Set(selectedPhones);
    if (newSelection.has(phone)) {
      newSelection.delete(phone);
    } else {
      newSelection.add(phone);
    }
    setSelectedPhones(newSelection);
  };

  // Selecionar/deselecionar todos
  const toggleSelectAll = () => {
    const allPhones = filteredMembers
      .map(m => extractPhoneFromMember(m))
      .filter((p): p is string => p !== null);
    
    if (selectedPhones.size === allPhones.length) {
      setSelectedPhones(new Set());
    } else {
      setSelectedPhones(new Set(allPhones));
    }
  };

  // Aplicar etiqueta em massa
  const handleBulkLabelAssign = async (labelId: string) => {
    if (!storeId || selectedPhones.size === 0) return;

    try {
      const phonesArray = Array.from(selectedPhones);

      // Primeiro, garantir que todos os selecionados são contatos
      const contactsToCreate: { store_id: string; phone_number: string; name: string | null; source: string }[] = [];
      
      for (const phone of phonesArray) {
        if (!findSyncedContact(phone)) {
          const member = members.find(m => extractPhoneFromMember(m) === phone);
          if (member) {
            contactsToCreate.push({
              store_id: storeId,
              phone_number: phone,
              name: member.name || member.pushName || null,
              source: 'whatsapp_group',
            });
          }
        }
      }

      if (contactsToCreate.length > 0) {
        await supabase
          .from('whatsapp_contacts')
          .upsert(contactsToCreate, { 
            onConflict: 'store_id,phone_number',
            ignoreDuplicates: true 
          });
      }

      // Buscar IDs dos contatos
      const { data: contacts } = await supabase
        .from('whatsapp_contacts')
        .select('id, phone_number')
        .eq('store_id', storeId)
        .in('phone_number', phonesArray);

      if (!contacts || contacts.length === 0) {
        toast.error('Nenhum contato encontrado');
        return;
      }

      // Criar assignments de etiqueta
      const assignments = contacts.map(c => ({
        contact_id: c.id,
        label_id: labelId,
      }));

      const { error } = await supabase
        .from('whatsapp_contact_label_assignments')
        .upsert(assignments, { 
          onConflict: 'contact_id,label_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;

      toast.success(`Etiqueta aplicada a ${contacts.length} contatos!`);
      setShowBulkLabelModal(false);
      setSelectedPhones(new Set());
      await fetchMembers();
    } catch (error) {
      console.error('Erro ao aplicar etiquetas:', error);
      toast.error('Erro ao aplicar etiquetas');
    }
  };

  const filteredMembers = members.filter(member => {
    const phone = extractPhoneFromMember(member) || '';
    const syncedContact = findSyncedContact(phone);
    const displayName = getDisplayName(member, syncedContact);
    const labelsText = syncedContact?.labels.map(l => l.name).join(' ') || '';
    
    return phone.includes(searchTerm) 
      || displayName.toLowerCase().includes(searchTerm.toLowerCase())
      || labelsText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectablePhones = filteredMembers
    .map(m => extractPhoneFromMember(m))
    .filter((p): p is string => p !== null);

  const unsyncedCount = getUnsyncedMembers().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros do Grupo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{group.name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">
                {members.length} membros carregados
              </p>
            </div>
            {unsyncedCount > 0 && (
              <Button 
                size="sm" 
                onClick={handleAddAllAsContacts}
                disabled={addingAllContacts}
              >
                {addingAllContacts ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Adicionar {unsyncedCount}
              </Button>
            )}
          </div>

          {/* Barra de seleção */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all"
                checked={selectedPhones.size > 0 && selectedPhones.size === selectablePhones.length}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm cursor-pointer">
                Selecionar Todos
              </label>
            </div>
            
            {selectedPhones.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="secondary">
                  {selectedPhones.size} selecionado(s)
                </Badge>
                <Button 
                  size="sm" 
                  onClick={() => setShowBulkLabelModal(true)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Aplicar Etiqueta
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedPhones(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
              <div className="space-y-3">
                {filteredMembers.map((member, index) => {
                  const phone = extractPhoneFromMember(member);
                  const syncedContact = findSyncedContact(phone);
                  const displayName = getDisplayName(member, syncedContact);
                  const isSelected = phone ? selectedPhones.has(phone) : false;

                  return (
                    <Card 
                      key={member.id || index}
                      className={`p-3 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {phone && (
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(phone)}
                          />
                        )}
                        
                        <Avatar className="h-12 w-12">
                          {syncedContact?.profile_picture_url && (
                            <AvatarImage src={syncedContact.profile_picture_url} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">
                              {displayName}
                            </p>
                            {member.admin === 'admin' && (
                              <Badge variant="secondary" className="text-xs h-5">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {member.admin === 'superadmin' && (
                              <Badge className="text-xs h-5 bg-amber-500">
                                <Crown className="h-3 w-3 mr-1" />
                                Dono
                              </Badge>
                            )}
                            {!syncedContact && phone && (
                              <Badge variant="outline" className="text-xs h-5">
                                Novo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {phone 
                              ? formatPhoneNumber(phone)
                              : 'Número não disponível'}
                          </p>
                          {syncedContact?.labels && syncedContact.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {syncedContact.labels.map(label => (
                                <Badge 
                                  key={label.name} 
                                  className="text-xs px-1.5 py-0 h-5 gap-1 text-white border-0"
                                  style={{ backgroundColor: label.color }}
                                >
                                  <Tag className="h-2.5 w-2.5" />
                                  {label.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => setEditingContact({
                              phone_number: phone,
                              name: syncedContact?.name || member.name || member.pushName || null,
                              profile_picture_url: syncedContact?.profile_picture_url,
                              customer_id: syncedContact?.customer_id,
                              customer_name: syncedContact?.customer_name,
                              labels: syncedContact?.labels || []
                            })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
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

      {/* Modal de Edição */}
      {editingContact && storeId && (
        <EditContactModal
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          contact={editingContact}
          storeId={storeId}
          onSave={() => fetchMembers()}
        />
      )}

      {/* Modal de Etiqueta em Massa */}
      {storeId && (
        <BulkLabelModal
          open={showBulkLabelModal}
          onOpenChange={setShowBulkLabelModal}
          storeId={storeId}
          selectedCount={selectedPhones.size}
          onAssign={handleBulkLabelAssign}
        />
      )}
    </Dialog>
  );
}
