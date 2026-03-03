import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerLocationPicker } from '@/components/checkout/CustomerLocationPicker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { normalizePhone, formatPhone } from '@/lib/utils';
import { MapPin, Loader2, Navigation, CheckCircle2, MessageCircle, X, AlertCircle, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { z } from 'zod';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9zdHJhbG8iLCJhIjoiY200eWI2ZmtvMDFhNjJrczgyaWd4eXJpeSJ9.EWExgXOHVjFpEsLNVdORkQ';

// Schema de validação - localização OPCIONAL agora
const customerSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(120, 'Nome deve ter no máximo 120 caracteres'),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  email: z.string().email('E-mail inválido').max(255, 'E-mail deve ter no máximo 255 caracteres').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Endereço deve ter no máximo 500 caracteres').optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Observações devem ter no máximo 500 caracteres').optional().or(z.literal('')),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

// Dados do cliente para modo edição
export interface CustomerEditData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Se fornecido, o dialog entra em modo edição */
  customer?: CustomerEditData | null;
}

export const CustomerFormDialog = ({ open, onClose, onSuccess, customer }: CustomerFormDialogProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [storeId, setStoreId] = useState<string>('');

  // Estados para validação de WhatsApp
  const [validatingWhatsApp, setValidatingWhatsApp] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [whatsAppJid, setWhatsAppJid] = useState<string | null>(null);

  const isEditMode = !!customer;

  const geolocation = useGeolocation();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Preview da senha (últimos 6 dígitos)
  const passwordPreview = useMemo(() => {
    if (isEditMode) return null; // Não mostrar preview no modo edição
    const normalized = normalizePhone(formData.phone);
    if (normalized.length >= 6) {
      return normalized.slice(-6);
    }
    return null;
  }, [formData.phone, isEditMode]);

  // Buscar storeId quando o dialog abrir
  useEffect(() => {
    if (open && user) {
      const fetchStoreId = async () => {
        // Tentar como owner primeiro
        const { data } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        
        if (data) {
          setStoreId(data.id);
        } else {
          // Fallback: buscar via user_roles
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('store_id')
            .eq('user_id', user.id)
            .not('store_id', 'is', null)
            .limit(1)
            .single();
          if (roleData?.store_id) {
            setStoreId(roleData.store_id);
          }
        }
      };
      fetchStoreId();
    }
  }, [open, user]);

  // Preencher form com dados do cliente no modo edição
  useEffect(() => {
    if (open && customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        notes: customer.notes || '',
      });
      // Carregar localização se existir
      if (customer.latitude && customer.longitude) {
        geolocation.setLocation(customer.latitude, customer.longitude, customer.address || '');
      } else if (customer.address) {
        // Se tem endereço mas não tem GPS, mostrar só o endereço
        geolocation.setLocation(0, 0, customer.address);
        // Limpar as coordenadas fake
        setTimeout(() => {
          if (!customer.latitude && !customer.longitude) {
            geolocation.clearLocation();
          }
        }, 0);
      }
    }
  }, [open, customer]);

  // Reset form when dialog closes (apenas no modo criação)
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
      });
      geolocation.clearLocation();
      setWhatsAppStatus('idle');
      setWhatsAppJid(null);
    }
  }, [open]);

  // Reset validação quando telefone muda
  useEffect(() => {
    setWhatsAppStatus('idle');
    setWhatsAppJid(null);
  }, [formData.phone]);

  const handlePhoneChange = (value: string) => {
    const normalized = normalizePhone(value);
    setFormData(prev => ({ ...prev, phone: normalized }));
  };

  const handleLocationSelect = (data: { address: string; latitude: number; longitude: number }) => {
    geolocation.setLocation(data.latitude, data.longitude, data.address);
    setShowLocationPicker(false);
    toast({
      title: 'Localização selecionada',
      description: 'Endereço atualizado com sucesso',
    });
  };

  const handleGetCurrentLocation = () => {
    geolocation.getCurrentLocation(MAPBOX_TOKEN);
  };

  // Validar WhatsApp
  const handleValidateWhatsApp = async () => {
    const normalized = normalizePhone(formData.phone);
    if (normalized.length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Digite um número de telefone válido primeiro',
        variant: 'destructive',
      });
      return;
    }

    setValidatingWhatsApp(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: normalized }
      });

      if (error) throw error;

      if (data.valid) {
        setWhatsAppStatus('valid');
        setWhatsAppJid(data.jid);
        toast({
          title: 'WhatsApp válido',
          description: 'Número encontrado no WhatsApp',
        });
      } else {
        setWhatsAppStatus('invalid');
        toast({
          title: 'WhatsApp não encontrado',
          description: 'Número não está registrado no WhatsApp',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro ao validar WhatsApp:', error);
      setWhatsAppStatus('idle');
      toast({
        title: 'Erro na validação',
        description: error.message || 'Não foi possível validar o número',
        variant: 'destructive',
      });
    } finally {
      setValidatingWhatsApp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado',
        variant: 'destructive',
      });
      return;
    }

    // Validação com Zod
    const validation = customerSchema.safeParse({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || '',
      address: geolocation.address || '',
      notes: formData.notes || '',
      latitude: geolocation.latitude || null,
      longitude: geolocation.longitude || null,
    });

    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.issues[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (!storeId) {
      toast({
        title: 'Erro',
        description: 'Loja não encontrada',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && customer) {
        // === MODO EDIÇÃO: atualizar diretamente na tabela customers ===
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name.trim(),
            phone: normalizePhone(formData.phone),
            email: formData.email?.trim() || null,
            notes: formData.notes?.trim() || null,
            address: geolocation.address?.trim() || null,
            latitude: geolocation.latitude || null,
            longitude: geolocation.longitude || null,
          })
          .eq('id', customer.id);

        if (error) throw error;

        toast({
          title: 'Cliente atualizado!',
          description: 'Dados salvos com sucesso',
        });
      } else {
        // === MODO CRIAÇÃO: chamar edge function ===
        const { data, error } = await supabase.functions.invoke('create-customer-with-auth', {
          body: {
            name: formData.name.trim(),
            phone: formData.phone,
            storeId,
            email: formData.email?.trim() || null,
            notes: formData.notes?.trim() || null,
            address: geolocation.address?.trim() || null,
            latitude: geolocation.latitude || null,
            longitude: geolocation.longitude || null,
            whatsappJid: whatsAppJid,
            whatsappValid: whatsAppStatus === 'valid',
          }
        });

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Erro ao cadastrar cliente');
        }

        // Mensagem de sucesso baseada no cenário
        if (data.is_new) {
          toast({
            title: 'Cliente criado com sucesso!',
            description: `Senha do cliente: ${data.password}`,
            duration: 10000,
          });
        } else if (data.already_has_auth) {
          toast({
            title: 'Cliente vinculado!',
            description: 'Cliente já possui conta. Foi vinculado à sua loja.',
          });
        } else if (data.password) {
          toast({
            title: 'Acesso criado!',
            description: `Senha criada para o cliente: ${data.password}`,
            duration: 10000,
          });
        }
      }

      // Resetar formulário
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
      });
      geolocation.clearLocation();
      setWhatsAppStatus('idle');
      setWhatsAppJid(null);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cliente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Digite o nome completo"
          maxLength={120}
          required
          autoFocus
        />
      </div>

      {/* Telefone com validação WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="phone">WhatsApp *</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="phone"
              value={formatPhone(formData.phone)}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(00) 00000-0000"
              maxLength={15}
              required
              disabled={isEditMode} // Não permitir alterar telefone na edição
              className={
                whatsAppStatus === 'valid' 
                  ? 'border-green-500 pr-10' 
                  : whatsAppStatus === 'invalid' 
                    ? 'border-orange-500 pr-10' 
                    : ''
              }
            />
            {whatsAppStatus === 'valid' && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
            )}
            {whatsAppStatus === 'invalid' && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
            )}
          </div>
          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleValidateWhatsApp}
              disabled={validatingWhatsApp || formData.phone.length < 10}
              title="Validar WhatsApp"
            >
              {validatingWhatsApp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Preview da senha */}
        {passwordPreview && !isEditMode && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            💡 Senha será: <span className="font-mono font-medium">{passwordPreview}</span>
          </p>
        )}
        
        {whatsAppStatus === 'invalid' && (
          <p className="text-sm text-orange-600">
            ⚠️ Número não encontrado no WhatsApp (você ainda pode cadastrar)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail (opcional)</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="cliente@email.com"
          maxLength={255}
        />
      </div>

      {/* Localização */}
      <div className="space-y-3">
        <Label className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          Localização
          {isEditMode && (
            <span className="text-xs text-orange-600 font-normal">(importante para cálculo de taxa de entrega)</span>
          )}
          {!isEditMode && (
            <span className="text-xs text-muted-foreground">(opcional)</span>
          )}
        </Label>

        {geolocation.hasLocation ? (
          <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700">Localização capturada</p>
                <p className="text-sm text-muted-foreground break-words">{geolocation.address}</p>
                {geolocation.latitude && geolocation.longitude && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {geolocation.latitude?.toFixed(6)}, {geolocation.longitude?.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={geolocation.clearLocation}
              className="mt-2 text-xs"
            >
              Alterar localização
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {isEditMode && !customer?.latitude && customer?.address && (
              <div className="p-2 rounded-lg border border-orange-300/50 bg-orange-50 dark:bg-orange-950/20">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  ⚠️ Este cliente tem endereço mas <strong>sem coordenadas GPS</strong>. 
                  Selecione a localização no mapa para o bot calcular a taxa de entrega corretamente.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGetCurrentLocation}
                disabled={geolocation.loading}
                className="flex-1"
                size="sm"
              >
                {geolocation.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Obtendo...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Usar GPS
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLocationPicker(true)}
                className="flex-1"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Mapa
              </Button>
            </div>

            {geolocation.error && (
              <p className="text-sm text-destructive">{geolocation.error}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Informações adicionais sobre o cliente..."
          maxLength={500}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : isEditMode ? (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          ) : (
            'Salvar Cliente'
          )}
        </Button>
      </div>
    </form>
  );

  const dialogTitle = isEditMode ? 'Editar Cliente' : 'Adicionar Cliente';

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onClose}>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader>
              <SheetTitle>{dialogTitle}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {formContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {formContent}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CustomerLocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialCoords={
          geolocation.hasLocation
            ? { latitude: geolocation.latitude!, longitude: geolocation.longitude! }
            : customer?.latitude && customer?.longitude
              ? { latitude: customer.latitude, longitude: customer.longitude }
              : undefined
        }
        storeId={storeId}
      />
    </>
  );
};
