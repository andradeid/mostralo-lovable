import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserPlus, MapPin } from 'lucide-react';
import { CustomerLocationPicker } from '@/components/checkout/CustomerLocationPicker';
import { normalizePhone } from '@/lib/utils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9zdHJhbG8iLCJhIjoiY200eWI2ZmtvMDFhNjJrczgyaWd4eXJpeSJ9.EWExgXOHVjFpEsLNVdORkQ';

interface EditContactModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
  phoneNumber: string;
  remoteJid: string;
  /** Dados pré-carregados do contato/cliente */
  contactName: string | null;
  customerData: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
  } | null;
}

export function EditContactModal({
  open, onClose, onSuccess, storeId, phoneNumber, remoteJid,
  contactName, customerData,
}: EditContactModalProps) {
  const isExistingCustomer = !!customerData;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [createAsCustomer, setCreateAsCustomer] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preencher formulário quando abrir
  useEffect(() => {
    if (open) {
      if (customerData) {
        setName(customerData.name || '');
        setEmail(customerData.email || '');
        setAddress(customerData.address || '');
        setNotes(customerData.notes || '');
        setLatitude(customerData.latitude);
        setLongitude(customerData.longitude);
        setCreateAsCustomer(false);
      } else {
        setName(contactName || '');
        setEmail('');
        setAddress('');
        setNotes('');
        setLatitude(null);
        setLongitude(null);
        setCreateAsCustomer(false);
      }
    }
  }, [open, customerData, contactName]);

  const handleLocationSelect = (data: { address: string; latitude: number; longitude: number }) => {
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    if (data.address) setAddress(data.address);
    setShowLocationPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const normalizedPhone = normalizePhone(phoneNumber);

      // 1. Atualizar nome na conversa
      await supabase
        .from('whatsapp_conversations')
        .update({ contact_name: name.trim() })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid);

      // 2. Atualizar contato WhatsApp
      await supabase
        .from('whatsapp_contacts')
        .upsert({
          store_id: storeId,
          phone_number: normalizedPhone,
          name: name.trim(),
          source: 'manual',
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'store_id,phone_number' });

      // 3. Se é cliente existente, atualizar dados
      if (isExistingCustomer && customerData) {
        const updateData: Record<string, any> = {
          name: name.trim(),
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          latitude,
          longitude,
        };

        await supabase
          .from('customers')
          .update(updateData)
          .eq('id', customerData.id);

        toast.success('Dados do cliente atualizados!');
      }
      // 4. Se não é cliente e o atendente quer criar como cliente
      else if (!isExistingCustomer && createAsCustomer) {
        // Verificar se já existe cliente com esse telefone
        const phoneVariants = buildPhoneVariants(phoneNumber, remoteJid);
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .in('phone', phoneVariants)
          .is('deleted_at', null)
          .limit(1);

        if (existing && existing.length > 0) {
          // Atualizar cliente existente
          await supabase
            .from('customers')
            .update({
              name: name.trim(),
              email: email.trim() || null,
              address: address.trim() || null,
              notes: notes.trim() || null,
              latitude,
              longitude,
            })
            .eq('id', existing[0].id);

          // Vincular à loja
          await supabase
            .from('customer_stores')
            .upsert({
              customer_id: existing[0].id,
              store_id: storeId,
            }, { onConflict: 'customer_id,store_id' });

          toast.success('Cliente existente atualizado e vinculado à loja!');
        } else {
          // Criar novo cliente
          const { data: newCustomer, error: insertError } = await supabase
            .from('customers')
            .insert({
              name: name.trim(),
              phone: normalizedPhone,
              email: email.trim() || null,
              address: address.trim() || null,
              notes: notes.trim() || null,
              latitude,
              longitude,
              whatsapp_jid: remoteJid,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;

          // Vincular à loja
          if (newCustomer) {
            await supabase
              .from('customer_stores')
              .upsert({
                customer_id: newCustomer.id,
                store_id: storeId,
              }, { onConflict: 'customer_id,store_id' });
          }

          toast.success('Cliente cadastrado com sucesso!');
        }
      } else {
        // Apenas salvar nome no contato (já feito acima)
        toast.success('Dados do contato atualizados!');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Erro ao salvar contato:', err);
      toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  if (showLocationPicker) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && setShowLocationPicker(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Selecionar Localização</DialogTitle>
          </DialogHeader>
          <div className="h-[400px]">
            <CustomerLocationPicker
              mapboxToken={MAPBOX_TOKEN}
              onLocationSelect={handleLocationSelect}
              initialLat={latitude || undefined}
              initialLng={longitude || undefined}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationPicker(false)}>
              Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isExistingCustomer ? 'Editar Cliente' : 'Editar Contato'}
          </DialogTitle>
          <DialogDescription>
            {isExistingCustomer
              ? 'Atualize os dados do cliente cadastrado.'
              : 'Edite os dados do contato. Opcionalmente, cadastre como cliente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Nome *</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do contato"
            />
          </div>

          {/* Telefone (read-only) */}
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={formatPhoneDisplay(phoneNumber)} readOnly className="bg-muted" />
          </div>

          {/* Mostrar campos extras se é cliente existente OU se quer criar como cliente */}
          {(isExistingCustomer || createAsCustomer) && (
            <>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">E-mail</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Endereço */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-address">Endereço</Label>
                <Input
                  id="contact-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro..."
                />
              </div>

              {/* Localização */}
              <div className="space-y-1.5">
                <Label>Localização GPS</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => setShowLocationPicker(true)}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {latitude && longitude
                    ? `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                    : 'Selecionar no mapa'}
                </Button>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-notes">Observações</Label>
                <Textarea
                  id="contact-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre o cliente..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Opção de cadastrar como cliente (só aparece para contatos sem cadastro) */}
          {!isExistingCustomer && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Cadastrar como cliente</p>
                  <p className="text-xs text-muted-foreground">Salvar na base de clientes da loja</p>
                </div>
              </div>
              <Switch
                checked={createAsCustomer}
                onCheckedChange={setCreateAsCustomer}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Helpers ---

function buildPhoneVariants(phoneNumber: string, remoteJid?: string): string[] {
  const variants = new Set<string>();
  const sources = [phoneNumber, remoteJid].filter(Boolean) as string[];

  sources.forEach((source) => {
    const digits = source.replace(/\D/g, '');
    if (!digits) return;

    const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
    const canonical = normalizePhone(local);

    variants.add(digits);
    variants.add(local);
    variants.add(canonical);

    if (canonical.length === 11) {
      const withoutNine = canonical.slice(0, 2) + canonical.slice(3);
      variants.add(withoutNine);
      variants.add(`55${canonical}`);
      variants.add(`55${withoutNine}`);
    }

    if (local.length === 10) {
      const withNine = local.slice(0, 2) + '9' + local.slice(2);
      variants.add(withNine);
      variants.add(`55${withNine}`);
    }
  });

  return Array.from(variants).filter((value) => value.length >= 10);
}

function formatPhoneDisplay(phone: string): string {
  if (phone.length === 13 && phone.startsWith('55')) {
    return `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }
  if (phone.length === 12 && phone.startsWith('55')) {
    return `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
  }
  return phone;
}
