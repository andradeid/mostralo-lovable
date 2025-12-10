import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  content: string;
}

interface Contact {
  id: string;
  phone_number: string;
  name: string | null;
  push_name: string | null;
}

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  storeId: string;
  storeName?: string;
  storeSlug?: string;
}

export function SendMessageModal({
  open,
  onOpenChange,
  contact,
  storeId,
  storeName = "",
  storeSlug = "",
}: SendMessageModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && storeId) {
      fetchTemplates();
    }
  }, [open, storeId]);

  useEffect(() => {
    if (open && contact) {
      // Reset ao abrir com novo contato
      setSelectedTemplate("custom");
      setMessage("");
    }
  }, [open, contact]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("whatsapp_templates")
        .select("id, name, content")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("name");

      setTemplates(data || []);
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const replaceVariables = (text: string): string => {
    if (!contact) return text;

    const contactName = contact.name || contact.push_name || "Cliente";
    const firstName = contactName.split(" ")[0];
    const storeLink = storeSlug
      ? `${window.location.origin}/loja/${storeSlug}`
      : "";

    return text
      .replace(/{nome}/gi, contactName)
      .replace(/{primeiro_nome}/gi, firstName)
      .replace(/{telefone}/gi, formatPhoneNumber(contact.phone_number))
      .replace(/{loja}/gi, storeName)
      .replace(/{link_loja}/gi, storeLink);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);

    if (templateId === "custom") {
      setMessage("");
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessage(replaceVariables(template.content));
    }
  };

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

  const sendMessage = async () => {
    if (!contact || !message.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          storeId: storeId,
          phoneNumber: contact.phone_number,
          messageType: 'text',
          content: message,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Mensagem enviada com sucesso!');
        setMessage("");
        setSelectedTemplate("custom");
        onOpenChange(false);
      } else {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || 'Erro ao enviar mensagem. Verifique se o WhatsApp está conectado.');
    } finally {
      setSending(false);
    }
  };

  const contactDisplayName =
    contact?.name || contact?.push_name || "Contato";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar Mensagem para {contactDisplayName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Número do contato */}
          <div className="text-sm text-muted-foreground">
            Telefone: {contact ? formatPhoneNumber(contact.phone_number) : ""}
          </div>

          {/* Seletor de Template */}
          <div className="space-y-2">
            <Label>Modelo de Mensagem</Label>
            <Select
              value={selectedTemplate}
              onValueChange={handleTemplateSelect}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">✏️ Mensagem personalizada</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    📝 {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de Mensagem */}
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Variáveis disponíveis */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <strong>Variáveis disponíveis:</strong>{" "}
            <code className="bg-muted px-1 rounded">{"{nome}"}</code>,{" "}
            <code className="bg-muted px-1 rounded">{"{primeiro_nome}"}</code>,{" "}
            <code className="bg-muted px-1 rounded">{"{telefone}"}</code>,{" "}
            <code className="bg-muted px-1 rounded">{"{loja}"}</code>,{" "}
            <code className="bg-muted px-1 rounded">{"{link_loja}"}</code>
          </div>

          {/* Botão de Envio */}
          <Button
            onClick={sendMessage}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sending ? 'Enviando...' : 'Enviar Mensagem'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
