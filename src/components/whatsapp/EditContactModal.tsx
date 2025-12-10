import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  UserPlus, 
  Link2, 
  Tag, 
  X, 
  Plus, 
  Check,
  Search,
  User,
  Store
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LabelWithColor {
  id: string;
  name: string;
  color: string;
}

interface EditContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: {
    id?: string;
    phone_number: string;
    name: string | null;
    profile_picture_url?: string | null;
    customer_id?: string | null;
    customer_name?: string | null;
    labels: { name: string; color: string }[];
  };
  storeId: string;
  onSave?: () => void;
}

export function EditContactModal({ 
  open, 
  onOpenChange, 
  contact,
  storeId,
  onSave 
}: EditContactModalProps) {
  const [name, setName] = useState(contact.name || "");
  const [saving, setSaving] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<LabelWithColor[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [linkedCustomer, setLinkedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  useEffect(() => {
    if (open) {
      setName(contact.name || "");
      setSelectedLabels(contact.labels.map(l => l.name));
      if (contact.customer_id && contact.customer_name) {
        setLinkedCustomer({ id: contact.customer_id, name: contact.customer_name });
      } else {
        setLinkedCustomer(null);
      }
      fetchAvailableLabels();
    }
  }, [open, contact]);

  const fetchAvailableLabels = async () => {
    const { data } = await supabase
      .from('whatsapp_contact_labels')
      .select('id, name, color')
      .eq('store_id', storeId)
      .order('name');
    
    if (data) {
      setAvailableLabels(data);
    }
  };

  const searchCustomers = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('customers')
      .select('id, name, phone')
      .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(5);

    setSearchResults(data || []);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Verificar se contato existe
      const { data: existingContact } = await supabase
        .from('whatsapp_contacts')
        .select('id')
        .eq('store_id', storeId)
        .eq('phone_number', contact.phone_number)
        .single();

      let contactId = existingContact?.id;

      if (!contactId) {
        // Criar contato se não existir
        const { data: newContact, error } = await supabase
          .from('whatsapp_contacts')
          .insert({
            store_id: storeId,
            phone_number: contact.phone_number,
            name: name || null,
            customer_id: linkedCustomer?.id || null
          })
          .select('id')
          .single();

        if (error) throw error;
        contactId = newContact.id;
      } else {
        // Atualizar contato existente
        await supabase
          .from('whatsapp_contacts')
          .update({
            name: name || null,
            customer_id: linkedCustomer?.id || null
          })
          .eq('id', contactId);
      }

      // Atualizar etiquetas
      // Remover todas as atribuições atuais
      await supabase
        .from('whatsapp_contact_label_assignments')
        .delete()
        .eq('contact_id', contactId);

      // Adicionar novas atribuições
      if (selectedLabels.length > 0) {
        const labelIds = availableLabels
          .filter(l => selectedLabels.includes(l.name))
          .map(l => l.id);

        if (labelIds.length > 0) {
          await supabase
            .from('whatsapp_contact_label_assignments')
            .insert(labelIds.map(labelId => ({
              contact_id: contactId,
              label_id: labelId
            })));
        }
      }

      toast.success('Contato atualizado');
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar contato');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomer = async () => {
    setCreatingCustomer(true);
    try {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: name || 'Cliente ' + contact.phone_number,
          phone: contact.phone_number,
        })
        .select('id, name')
        .single();

      if (error) throw error;

      // Vincular à loja
      await supabase
        .from('customer_stores')
        .insert({
          customer_id: newCustomer.id,
          store_id: storeId
        });

      setLinkedCustomer({ id: newCustomer.id, name: newCustomer.name });
      toast.success('Cliente criado e vinculado');
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleLinkCustomer = (customer: { id: string; name: string }) => {
    setLinkedCustomer(customer);
    setShowCustomerSearch(false);
    setSearchCustomer("");
    setSearchResults([]);
  };

  const toggleLabel = (labelName: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelName) 
        ? prev.filter(l => l !== labelName)
        : [...prev, labelName]
    );
  };

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    } else if (cleaned.length === 12) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Contato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do Contato */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              {contact.profile_picture_url && (
                <AvatarImage src={contact.profile_picture_url} />
              )}
              <AvatarFallback>
                {(name || contact.phone_number).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">
                {formatPhone(contact.phone_number)}
              </p>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome do Contato</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
            />
          </div>

          {/* Etiquetas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Etiquetas
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map(label => (
                <Badge
                  key={label.id}
                  variant={selectedLabels.includes(label.name) ? "default" : "outline"}
                  className="cursor-pointer transition-all"
                  style={selectedLabels.includes(label.name) ? {
                    backgroundColor: label.color,
                    borderColor: label.color,
                    color: 'white'
                  } : {
                    borderColor: label.color,
                    color: label.color
                  }}
                  onClick={() => toggleLabel(label.name)}
                >
                  {selectedLabels.includes(label.name) && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  {label.name}
                </Badge>
              ))}
              {availableLabels.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma etiqueta configurada</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Cliente Vinculado */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Cliente da Loja
            </Label>

            {linkedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{linkedCustomer.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLinkedCustomer(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {showCustomerSearch ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchCustomer}
                        onChange={(e) => {
                          setSearchCustomer(e.target.value);
                          searchCustomers(e.target.value);
                        }}
                        placeholder="Buscar cliente por nome ou telefone..."
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                    
                    {searchResults.length > 0 && (
                      <ScrollArea className="h-32 border rounded-lg">
                        <div className="p-2 space-y-1">
                          {searchResults.map(customer => (
                            <button
                              key={customer.id}
                              className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left"
                              onClick={() => handleLinkCustomer(customer)}
                            >
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCustomerSearch(false);
                        setSearchCustomer("");
                        setSearchResults([]);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowCustomerSearch(true)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Vincular Existente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCreateCustomer}
                      disabled={creatingCustomer}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Novo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
