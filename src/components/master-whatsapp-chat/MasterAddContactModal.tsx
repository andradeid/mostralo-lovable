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
import type { MasterConversation } from '@/pages/admin/MasterWhatsAppChatPage';

interface MasterAddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configId: string;
  onConversationReady: (conversation: MasterConversation) => void;
}

interface ValidationResult {
  valid: boolean;
  pushName: string | null;
  pictureUrl: string | null;
  isPrivatePhoto?: boolean;
}

export function MasterAddContactModal({
  open,
  onOpenChange,
  configId,
  onConversationReady,
}: MasterAddContactModalProps) {
  const [countryCode, setCountryCode] = useState('+55');
  const [phone, setPhone] = useState('');
  const [validating, setValidating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const cleanPhone = phone.replace(/\D/g, '');
  const canValidate = cleanPhone.length >= 10;
  const fullNumber = countryCode.replace('+', '') + cleanPhone;

  const handlePhoneChange = (value: string) => {
    const formatted =
      countryCode === '+55'
        ? formatBrazilianPhone(value)
        : formatInternationalPhone(value);
    setPhone(formatted);
    setValidation(null);
  };

  const handleValidate = async () => {
    if (!canValidate) return;
    setValidating(true);
    setValidation(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        'validate-whatsapp-number',
        { body: { phone: fullNumber, sendWelcome: false } }
      );

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
        toast.error('Número não possui WhatsApp ativo');
      }
    } catch (err) {
      console.error('Erro ao validar WhatsApp:', err);
      toast.error('Erro ao validar número');
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
      const { data: existingList } = await supabase
        .from('master_whatsapp_conversations')
        .select('*')
        .eq('config_id', configId)
        .or(`remote_jid.eq.${remoteJid},phone_number.eq.${fullNumber}`)
        .limit(1);

      const existing = existingList?.[0];
      let conversation: MasterConversation;

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
            .from('master_whatsapp_conversations')
            .update(updates)
            .eq('id', existing.id);
          Object.assign(existing, updates);
        }
        conversation = existing as MasterConversation;
      } else {
        const { data: newConv, error } = await supabase
          .from('master_whatsapp_conversations')
          .insert({
            config_id: configId,
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
        conversation = newConv as MasterConversation;
      }

      onConversationReady(conversation);
      handleClose();
      toast.success(existing ? 'Conversa encontrada!' : 'Conversa iniciada!');
    } catch (err: any) {
      console.error('Erro ao criar conversa:', err);
      toast.error('Erro ao iniciar conversa');
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
                placeholder={
                  countryCode === '+55'
                    ? '(00) 00000-0000'
                    : 'Número do telefone'
                }
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

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
