import { useState } from 'react';
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
import { Loader2, MessageCirclePlus, Search } from 'lucide-react';
import { toast } from 'sonner';
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

export function AddContactModal({ open, onOpenChange, storeId, onConversationReady }: AddContactModalProps) {
  const [countryCode, setCountryCode] = useState('+55');
  const [phone, setPhone] = useState('');
  const [validating, setValidating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const cleanPhone = phone.replace(/\D/g, '');
  const canValidate = cleanPhone.length >= 10;
  const fullNumber = countryCode.replace('+', '') + cleanPhone;

  const handlePhoneChange = (value: string) => {
    const formatted = countryCode === '+55'
      ? formatBrazilianPhone(value)
      : formatInternationalPhone(value);
    setPhone(formatted);
    // Resetar validação ao mudar número
    setValidation(null);
  };

  const handleValidate = async () => {
    if (!canValidate) return;
    setValidating(true);
    setValidation(null);

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

      // Buscar conversa existente
      const { data: existing } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .maybeSingle();

      if (existing) {
        // Se estava fechada, reabrir
        if (existing.status === 'closed') {
          await supabase
            .from('whatsapp_conversations')
            .update({ status: 'open' })
            .eq('id', existing.id);
          existing.status = 'open';
        }
        onConversationReady(existing as Conversation);
        handleClose();
        return;
      }

      // Criar nova conversa
      const { data: newConv, error } = await supabase
        .from('whatsapp_conversations')
        .insert({
          store_id: storeId,
          remote_jid: remoteJid,
          phone_number: fullNumber,
          contact_name: validation.pushName,
          profile_picture_url: validation.pictureUrl,
          status: 'open',
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
    onOpenChange(false);
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
