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
import { formatBrazilianPhone, formatInternationalPhone } from '@/lib/utils';
import { Loader2, MessageCirclePlus, Search, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export function AddContactModal({ open, onOpenChange, storeId, onConversationReady }: AddContactModalProps) {
  const [countryCode, setCountryCode] = useState('+55');
  const [phone, setPhone] = useState('');
  const [validating, setValidating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const cleanPhone = phone.replace(/\D/g, '');
  const canValidate = cleanPhone.length >= 10;
  const fullNumber = countryCode.replace('+', '') + cleanPhone;

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
        // Buscar clientes da loja que tenham telefone parecido
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
    // Extrair apenas os dígitos do telefone do cliente
    const digits = customer.phone.replace(/\D/g, '');
    // Se começa com 55 e DDI é +55, remover o 55
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
      // Variante sem o 9º dígito (10 dígitos)
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

      // Buscar conversa existente por qualquer variante de remote_jid ou phone_number
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

      if (existing) {
        // Atualizar foto e nome se estiverem faltando na conversa existente
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
          // Mesclar atualizações no objeto local
          Object.assign(existing, updates);
        }
        onConversationReady(existing as Conversation);
        handleClose();
        toast.success('Conversa encontrada!');
        return;
      }

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

      onConversationReady(newConv as Conversation);
      handleClose();
      toast.success('Conversa iniciada!');
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

          {/* Preview do perfil validado */}
          {validation?.valid && (
            <>
              <WhatsAppProfilePreview
                profilePicture={validation.pictureUrl}
                pushName={validation.pushName}
                formattedNumber={fullNumber}
                formName=""
                isPrivatePhoto={validation.isPrivatePhoto}
              />

              <Button
                onClick={handleStartConversation}
                disabled={creating}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <MessageCirclePlus className="w-4 h-4 mr-2" />
                    Iniciar Conversa
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
