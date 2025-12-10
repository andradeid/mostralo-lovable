import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Search, Tags, Download, MoreHorizontal, User, Phone, Trash2, Link, MessageCircle, Camera, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BulkLabelModal } from "./BulkLabelModal";
import { ExportContactsModal } from "./ExportContactsModal";
import { SendMessageModal } from "./SendMessageModal";
import { ManageLabelsModal } from "./ManageLabelsModal";
import { EditContactModal } from "./EditContactModal";

interface Contact {
  id: string;
  phone_number: string;
  name: string | null;
  push_name: string | null;
  profile_picture_url: string | null;
  is_whatsapp_valid: boolean;
  source: string;
  source_group_name: string | null;
  created_at: string;
  customer_id: string | null;
  labels: Array<{ id: string; name: string; color: string }>;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface ContactsTabProps {
  storeId: string;
  instance: {
    instance_name: string;
  };
  onRefresh: () => void;
  storeName?: string;
  storeSlug?: string;
}

export function ContactsTab({ storeId, instance, onRefresh, storeName = "", storeSlug = "" }: ContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [labelFilter, setLabelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [bulkLabelModalOpen, setBulkLabelModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false);
  const [selectedContactForMessage, setSelectedContactForMessage] = useState<Contact | null>(null);
  const [manageLabelsModalOpen, setManageLabelsModalOpen] = useState(false);
  const [selectedContactForLabels, setSelectedContactForLabels] = useState<Contact | null>(null);
  
  // Estados para edição de contato
  const [editContactModalOpen, setEditContactModalOpen] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<Contact | null>(null);
  
  // Estados para progresso da sincronização
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");

  const openManageLabelsModal = (contact: Contact) => {
    setSelectedContactForLabels(contact);
    setManageLabelsModalOpen(true);
  };

  const openEditContactModal = (contact: Contact) => {
    setSelectedContactForEdit(contact);
    setEditContactModalOpen(true);
  };

  // Função para formatar número de telefone
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");

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

  const openSendMessageModal = (contact: Contact) => {
    setSelectedContactForMessage(contact);
    setSendMessageModalOpen(true);
  };

  useEffect(() => {
    fetchContacts();
    fetchLabels();
  }, [storeId]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select(`
          *,
          whatsapp_contact_label_assignments (
            whatsapp_contact_labels (id, name, color)
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedContacts = data?.map(c => ({
        ...c,
        labels: c.whatsapp_contact_label_assignments?.map((a: any) => a.whatsapp_contact_labels).filter(Boolean) || [],
      })) || [];

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabels = async () => {
    const { data } = await supabase
      .from('whatsapp_contact_labels')
      .select('id, name, color')
      .eq('store_id', storeId);
    
    setLabels(data || []);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress(0);
    setSyncMessage("Conectando à API do WhatsApp...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Simular progresso enquanto aguarda resposta
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress > 85) progress = 85;
        setSyncProgress(Math.floor(progress));
        
        if (progress < 20) setSyncMessage("Buscando contatos...");
        else if (progress < 40) setSyncMessage("Processando contatos...");
        else if (progress < 60) setSyncMessage("Vinculando clientes...");
        else if (progress < 80) setSyncMessage("Buscando fotos de perfil...");
        else setSyncMessage("Finalizando...");
      }, 300);

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'syncContacts',
          store_id: storeId,
          instance_name: instance.instance_name,
        },
      });

      clearInterval(progressInterval);
      
      if (response.error) throw response.error;

      setSyncProgress(100);
      setSyncMessage(`${response.data.synced} contatos sincronizados!`);
      
      await new Promise(r => setTimeout(r, 800));

      toast.success(`${response.data.synced} contatos sincronizados!`);
      fetchContacts();
      onRefresh();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar contatos');
    } finally {
      setSyncing(false);
      setSyncProgress(0);
      setSyncMessage("");
    }
  };

  const handleFetchPhotos = async () => {
    setFetchingPhotos(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'fetchProfilePictures',
          store_id: storeId,
          instance_name: instance.instance_name,
        },
      });

      if (response.error) throw response.error;

      if (response.data.updated > 0) {
        toast.success(`${response.data.updated} fotos atualizadas!`);
        fetchContacts();
      } else {
        toast.info(response.data.message || 'Nenhuma foto nova encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
      toast.error('Erro ao buscar fotos de perfil');
    } finally {
      setFetchingPhotos(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast.success('Contato removido');
      fetchContacts();
      onRefresh();
    } catch (error) {
      toast.error('Erro ao remover contato');
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleBulkLabelAssign = async (labelId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'assignLabels',
          store_id: storeId,
          contact_ids: selectedContacts,
          label_id: labelId,
        },
      });

      if (response.error) throw response.error;

      toast.success(`Etiqueta adicionada a ${response.data.assigned} contatos`);
      setSelectedContacts([]);
      setBulkLabelModalOpen(false);
      fetchContacts();
    } catch (error) {
      toast.error('Erro ao adicionar etiqueta');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.phone_number.includes(searchTerm) ||
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.push_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLabel = labelFilter === "all" || 
      contact.labels.some(l => l.id === labelFilter);

    const matchesSource = sourceFilter === "all" || contact.source === sourceFilter;

    return matchesSearch && matchesLabel && matchesSource;
  });

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'sync': return 'Sincronizado';
      case 'group_extract': return 'Extraído de Grupo';
      case 'manual': return 'Manual';
      case 'csv_import': return 'Importação CSV';
      default: return source;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Contatos ({filteredContacts.length})</CardTitle>
          <div className="flex flex-wrap gap-2">
            {selectedContacts.length > 0 && (
              <Button variant="outline" onClick={() => setBulkLabelModalOpen(true)}>
                <Tags className="h-4 w-4 mr-2" />
                Adicionar Etiqueta ({selectedContacts.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => setExportModalOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={handleFetchPhotos} disabled={fetchingPhotos}>
              <Camera className={`h-4 w-4 mr-2 ${fetchingPhotos ? 'animate-pulse' : ''}`} />
              {fetchingPhotos ? 'Buscando...' : 'Buscar Fotos'}
            </Button>
            
            {/* Botão de Sincronizar com Indicador de Progresso */}
            {syncing ? (
              <div className="flex flex-col gap-1.5 min-w-[200px] p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">{syncMessage}</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
                <span className="text-xs text-muted-foreground text-right">{syncProgress}%</span>
              </div>
            ) : (
              <Button onClick={handleSync} disabled={syncing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={labelFilter} onValueChange={setLabelFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por etiqueta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas etiquetas</SelectItem>
              {labels.map(label => (
                <SelectItem key={label.id} value={label.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas origens</SelectItem>
              <SelectItem value="sync">Sincronizado</SelectItem>
              <SelectItem value="group_extract">Extraído de Grupo</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="csv_import">Importação CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de contatos */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum contato encontrado</p>
            <Button variant="outline" className="mt-4" onClick={handleSync}>
              Sincronizar Contatos
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Cabeçalho */}
            <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg">
              <Checkbox 
                checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">Selecionar todos</span>
            </div>

            {/* Lista */}
            {filteredContacts.map(contact => (
              <div 
                key={contact.id} 
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox 
                  checked={selectedContacts.includes(contact.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedContacts([...selectedContacts, contact.id]);
                    } else {
                      setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                    }
                  }}
                />
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.profile_picture_url || undefined} />
                  <AvatarFallback>
                    {(contact.name || contact.push_name || contact.phone_number).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {contact.name || contact.push_name || 'Sem nome'}
                    </p>
                    {contact.customer_id && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <Link className="h-3 w-3 mr-1" />
                        Cliente
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="font-mono text-xs">{formatPhoneNumber(contact.phone_number)}</span>
                    <span className="text-xs">• {getSourceLabel(contact.source)}</span>
                    {contact.source_group_name && (
                      <span className="text-xs truncate">({contact.source_group_name})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {contact.labels.map(label => (
                    <Badge 
                      key={label.id} 
                      variant="secondary"
                      style={{ backgroundColor: `${label.color}20`, color: label.color, borderColor: label.color }}
                      className="text-xs border"
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>

                {/* Botão WhatsApp */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0"
                  onClick={() => openSendMessageModal(contact)}
                  title="Enviar mensagem no WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>

                {/* Botão Editar */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => openEditContactModal(contact)}
                  title="Editar contato"
                  className="flex-shrink-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditContactModal(contact)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar Contato
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openSendMessageModal(contact)}>
                      <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                      Enviar Mensagem
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openManageLabelsModal(contact)}>
                      <Tags className="h-4 w-4 mr-2" />
                      Gerenciar Etiquetas
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <BulkLabelModal
        open={bulkLabelModalOpen}
        onOpenChange={setBulkLabelModalOpen}
        storeId={storeId}
        selectedCount={selectedContacts.length}
        onAssign={handleBulkLabelAssign}
      />

      <ExportContactsModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        storeId={storeId}
        labels={labels}
      />

      <SendMessageModal
        open={sendMessageModalOpen}
        onOpenChange={setSendMessageModalOpen}
        contact={selectedContactForMessage}
        storeId={storeId}
        storeName={storeName}
        storeSlug={storeSlug}
      />

      {selectedContactForLabels && (
        <ManageLabelsModal
          open={manageLabelsModalOpen}
          onOpenChange={setManageLabelsModalOpen}
          storeId={storeId}
          contactId={selectedContactForLabels.id}
          contactName={selectedContactForLabels.name || selectedContactForLabels.push_name || selectedContactForLabels.phone_number}
          currentLabels={selectedContactForLabels.labels}
          onSuccess={fetchContacts}
        />
      )}

      {selectedContactForEdit && (
        <EditContactModal
          open={editContactModalOpen}
          onOpenChange={(open) => {
            setEditContactModalOpen(open);
            if (!open) setSelectedContactForEdit(null);
          }}
          contact={{
            id: selectedContactForEdit.id,
            phone_number: selectedContactForEdit.phone_number,
            name: selectedContactForEdit.name,
            profile_picture_url: selectedContactForEdit.profile_picture_url,
            customer_id: selectedContactForEdit.customer_id,
            labels: selectedContactForEdit.labels
          }}
          storeId={storeId}
          onSave={fetchContacts}
        />
      )}
    </Card>
  );
}
