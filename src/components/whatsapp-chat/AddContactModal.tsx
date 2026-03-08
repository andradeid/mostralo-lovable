import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { WhatsAppProfilePreview } from '@/components/leads/WhatsAppProfilePreview';
import { supabase } from '@/integrations/supabase/client';
import { formatBrazilianPhone, formatInternationalPhone, normalizePhone } from '@/lib/utils';
import { Loader2, MessageCirclePlus, Search, User, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Conversation } from '@/pages/admin/WhatsAppChatPage';

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onConversationReady: (conversation: Conversation) => void;
}

interface ValidationResult {
  valid: boolean;
  pushName: string | null;
  pictureUrl: string | null;
  isPrivatePhoto?: boolean;
}

interface CustomerSuggestion {
  id: string;
  name: string;
  phone: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  message_type: string | null;
  media_url: string | null;
}

export function AddContactModal({ open, onOpenChange, storeId, onConversationReady }: AddContactModalProps) {
  const [countryCode, setCountryCode] = useState('+55');
  const [phone, setPhone] = useState('');
  const [validating, setValidating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const cleanPhone = phone.replace(/\D/g, '');
  const canValidate = cleanPhone.length >= 10;
  const fullNumber = countryCode.replace('+', '') + cleanPhone;

  // Buscar templates da loja quando o modal abre
  useEffect(() => {
    if (!open || !storeId) return;
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('whatsapp_templates' as any)
        .select('id, name, content, message_type, media_url')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');
      if (data) setTemplates(data as Template[]);
    };
    fetchTemplates();
  }, [open, storeId]);

  // Buscar sugestões de clientes ao digitar
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (cleanPhone.length < 3 || validation?.valid) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data } = await supabase
          .from('customer_stores')
          .select('customer_id, customers!inner(id, name, phone)')
          .eq('store_id', storeId)
          .ilike('customers.phone', `%${cleanPhone}%`)
          .limit(5);

        if (data && data.length > 0) {
          const mapped = data
            .map((cs: any) => ({
              id: cs.customers.id as string,
              name: cs.customers.name as string,
              phone: cs.customers.phone as string,
            }))
            .filter((c: CustomerSuggestion) => c.phone);
          setSuggestions(mapped);
          setShowSuggestions(mapped.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cleanPhone, storeId, validation?.valid]);

  const handlePhoneChange = (value: string) => {
    const formatted = countryCode === '+55'
      ? formatBrazilianPhone(value)
      : formatInternationalPhone(value);
    setPhone(formatted);
    setValidation(null);
  };

  const handleSelectSuggestion = (customer: CustomerSuggestion) => {
    const digits = customer.phone.replace(/\D/g, '');
    let localDigits = digits;
    if (countryCode === '+55' && digits.startsWith('55') && digits.length > 11) {
      localDigits = digits.slice(2);
    }
    const formatted = countryCode === '+55'
      ? formatBrazilianPhone(localDigits)
      : formatInternationalPhone(localDigits);
    setPhone(formatted);
    setShowSuggestions(false);
    setValidation(null);
  };

  const handleValidate = async () => {
    if (!canValidate) return;
    setValidating(true);
    setValidation(null);
    setShowSuggestions(false);

    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullNumber, sendWelcome: false }
      });

      if (error) throw error;

      if (data?.valid || data?.numberExists || data?.exists) {
        setValidation({
          valid: true,
          pushName: data.pushName || data.name || null,
          pictureUrl: data.pictureUrl || data.profilePicUrl || null,
          isPrivatePhoto: !data.pictureUrl && !data.profilePicUrl,
        });
      } else {
        setValidation({ valid: false, pushName: null, pictureUrl: null });
        toast.error('Número não possui WhatsApp ativo', {
          description: 'Verifique o número e tente novamente.',
        });
      }
    } catch (err: any) {
      console.error('Erro ao validar WhatsApp:', err);
      toast.error('Erro ao validar número', {
        description: 'Tente novamente em alguns instantes.',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleStartConversation = async () => {
    if (!validation?.valid) return;
    setCreating(true);

    try {
      const remoteJid = `${fullNumber}@s.whatsapp.net`;

      // Gerar variantes de telefone para busca tolerante
      const normalized = normalizePhone(fullNumber);
      const withDdi = `55${normalized}`;
      const without9 = normalized.length === 11
        ? normalized.slice(0, 2) + normalized.slice(3)
        : normalized;
      const jidVariants = [
        `${fullNumber}@s.whatsapp.net`,
        `${withDdi}@s.whatsapp.net`,
        `${normalized}@s.whatsapp.net`,
        `55${without9}@s.whatsapp.net`,
        `${without9}@s.whatsapp.net`,
      ];
      const phoneVariants = [fullNumber, withDdi, normalized, without9, `55${without9}`];

      // Buscar conversa existente por qualquer variante
      const { data: existingList } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('store_id', storeId)
        .or(
          [...new Set(jidVariants)].map(j => `remote_jid.eq.${j}`).join(',') +
          ',' +
          [...new Set(phoneVariants)].map(p => `phone_number.eq.${p}`).join(',')
        )
        .limit(1);

      const existing = existingList?.[0];
      let conversation: Conversation;

      if (existing) {
        const updates: Record<string, string> = {};
        if (!existing.profile_picture_url && validation.pictureUrl) {
          updates.profile_picture_url = validation.pictureUrl;
        }
        if (!existing.contact_name && validation.pushName) {
          updates.contact_name = validation.pushName;
        }
        if (existing.status === 'closed') {
          updates.status = 'active';
          existing.status = 'active';
        }
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('whatsapp_conversations')
            .update(updates)
            .eq('id', existing.id);
          Object.assign(existing, updates);
        }
        conversation = existing as Conversation;
      } else {
        const { data: newConv, error } = await supabase
          .from('whatsapp_conversations')
          .insert({
            store_id: storeId,
            remote_jid: remoteJid,
            phone_number: fullNumber,
            contact_name: validation.pushName,
            profile_picture_url: validation.pictureUrl,
            status: 'active',
            unread_count: 0,
            is_bot_active: false,
          })
          .select('*')
          .single();

        if (error) throw error;
        conversation = newConv as Conversation;
      }

      // Enviar template se selecionado
      if (selectedTemplateId && selectedTemplateId !== 'none') {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) {
          const convRemoteJid = conversation.remote_jid || remoteJid;
          try {
            const sendBody: Record<string, string> = {
              storeId,
              remoteJid: convRemoteJid,
              content: template.content,
              messageType: template.message_type || 'text',
            };
            if (template.media_url) {
              sendBody.mediaUrl = template.media_url;
            }
            await supabase.functions.invoke('whatsapp-chat-send', { body: sendBody });
          } catch (sendErr) {
            console.error('Erro ao enviar template:', sendErr);
            // Não bloquear a abertura da conversa
          }
        }
      }

      onConversationReady(conversation);
      handleClose();
      toast.success(existing ? 'Conversa encontrada!' : 'Conversa iniciada!');
    } catch (err: any) {
      console.error('Erro ao criar conversa:', err);
      toast.error('Erro ao iniciar conversa', {
        description: err.message || 'Tente novamente.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setPhone('');
    setCountryCode('+55');
    setValidation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedTemplateId('none');
    onOpenChange(false);
  };

  const formatPhoneDisplay = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length >= 12 && digits.startsWith('55')) {
      const ddd = digits.slice(2, 4);
      const part1 = digits.slice(4, 9);
      const part2 = digits.slice(9);
      return `(${ddd}) ${part1}-${part2}`;
    }
    if (digits.length >= 10) {
      const ddd = digits.slice(0, 2);
      const part1 = digits.slice(2, 7);
      const part2 = digits.slice(7);
      return `(${ddd}) ${part1}-${part2}`;
    }
    return phoneStr;
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCirclePlus className="w-5 h-5 text-[#25D366]" />
            Nova Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* DDI + Telefone */}
          <div className="space-y-2">
            <Label>Número de WhatsApp</Label>
            <div className="flex gap-2">
              <CountryCodeSelect
                value={countryCode}
                onChange={(val) => {
                  setCountryCode(val);
                  setValidation(null);
                }}
              />
              <Input
                placeholder={countryCode === '+55' ? '(00) 00000-0000' : 'Número do telefone'}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Sugestões de clientes */}
          {showSuggestions && !validation?.valid && (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground">Clientes encontrados</p>
              </div>
              <ScrollArea className="max-h-[160px]">
                {suggestions.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectSuggestion(customer)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {formatPhoneDisplay(customer.phone)}
                      </p>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}

          {loadingSuggestions && cleanPhone.length >= 3 && !validation?.valid && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Buscando clientes...
            </div>
          )}

          {/* Botão Validar */}
          {!validation?.valid && (
            <Button
              onClick={handleValidate}
              disabled={!canValidate || validating}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Validando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Validar WhatsApp
                </>
              )}
            </Button>
          )}

          {/* Preview do perfil validado + Template */}
          {validation?.valid && (
            <>
              <WhatsAppProfilePreview
                profilePicture={validation.pictureUrl}
                pushName={validation.pushName}
                formattedNumber={fullNumber}
                formName=""
                isPrivatePhoto={validation.isPrivatePhoto}
              />

              {/* Seletor de template */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    Enviar mensagem template (opcional)
                  </Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Nenhum template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum template</SelectItem>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Preview do conteúdo do template */}
                  {selectedTemplate && (
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Pré-visualização:</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                        {selectedTemplate.content}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleStartConversation}
                disabled={creating}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {selectedTemplateId !== 'none' ? 'Enviando...' : 'Iniciando...'}
                  </>
                ) : (
                  <>
                    <MessageCirclePlus className="w-4 h-4 mr-2" />
                    {selectedTemplateId !== 'none' ? 'Iniciar e Enviar Template' : 'Iniciar Conversa'}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
