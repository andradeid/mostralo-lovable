import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomerLocationPicker } from '@/components/checkout/CustomerLocationPicker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { normalizePhone, formatPhone } from '@/lib/utils';
import { MapPin, Loader2, Navigation, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { z } from 'zod';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9zdHJhbG8iLCJhIjoiY200eWI2ZmtvMDFhNjJrczgyaWd4eXJpeSJ9.EWExgXOHVjFpEsLNVdORkQ';

// Schema de validação - localização obrigatória
const customerSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(120, 'Nome deve ter no máximo 120 caracteres'),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  email: z.string().email('E-mail inválido').max(255, 'E-mail deve ter no máximo 255 caracteres').optional().or(z.literal('')),
  address: z.string().trim().min(1, 'Endereço é obrigatório').max(500, 'Endereço deve ter no máximo 500 caracteres'),
  notes: z.string().trim().max(500, 'Observações devem ter no máximo 500 caracteres').optional().or(z.literal('')),
  latitude: z.number({ error: 'Localização GPS é obrigatória' }),
  longitude: z.number({ error: 'Localização GPS é obrigatória' }),
});

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CustomerFormDialog = ({ open, onClose, onSuccess }: CustomerFormDialogProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [storeId, setStoreId] = useState<string>('');

  const geolocation = useGeolocation();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    createPanelAccess: false,
  });

  // Buscar storeId quando o dialog abrir
  useEffect(() => {
    if (open && user) {
      const fetchStoreId = async () => {
        const { data } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        
        if (data) {
          setStoreId(data.id);
        }
      };
      fetchStoreId();
    }
  }, [open, user]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
        createPanelAccess: false,
      });
      geolocation.clearLocation();
    }
  }, [open]);

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
      latitude: geolocation.latitude,
      longitude: geolocation.longitude,
    });

    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.issues[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar loja do usuário
      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (storeError || !stores) {
        throw new Error('Loja não encontrada');
      }

      const normalizedPhone = normalizePhone(formData.phone);

      // Verificar se cliente já existe (global)
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      let customerId: string;

      if (existingCustomer) {
        // Cliente já existe - apenas atualizar dados e criar relacionamento
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            name: formData.name.trim(),
            email: formData.email?.trim() || null,
            address: geolocation.address?.trim() || null,
            notes: formData.notes?.trim() || null,
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
          })
          .eq('id', existingCustomer.id);

        if (updateError) throw updateError;
        customerId = existingCustomer.id;
      } else {
        // Criar novo cliente (global)
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            name: formData.name.trim(),
            phone: normalizedPhone,
            email: formData.email?.trim() || null,
            address: geolocation.address?.trim() || null,
            notes: formData.notes?.trim() || null,
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
          })
          .select('id')
          .single();

        if (insertError) {
          if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
            throw new Error('Este telefone já está cadastrado.');
          }
          throw insertError;
        }
        customerId = newCustomer.id;
      }

      // Criar relacionamento com a loja (customer_stores)
      const { error: relationError } = await supabase
        .from('customer_stores')
        .upsert({
          customer_id: customerId,
          store_id: stores.id,
          first_order_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_id,store_id'
        });

      if (relationError) throw relationError;

      toast({
        title: 'Sucesso',
        description: 'Cliente cadastrado com sucesso',
      });

      // Resetar formulário
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
        createPanelAccess: false,
      });
      geolocation.clearLocation();

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível cadastrar o cliente',
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

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone/WhatsApp *</Label>
        <Input
          id="phone"
          value={formatPhone(formData.phone)}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="(00) 00000-0000"
          maxLength={15}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="cliente@email.com"
          maxLength={255}
        />
      </div>

      {/* Localização - OBRIGATÓRIA */}
      <div className="space-y-3">
        <Label className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          Localização *
          <span className="text-xs text-muted-foreground">(obrigatório)</span>
        </Label>

        {geolocation.hasLocation ? (
          <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700">Localização capturada</p>
                <p className="text-sm text-muted-foreground break-words">{geolocation.address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {geolocation.latitude?.toFixed(6)}, {geolocation.longitude?.toFixed(6)}
                </p>
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
            <Button
              type="button"
              variant="default"
              onClick={handleGetCurrentLocation}
              disabled={geolocation.loading}
              className="w-full"
            >
              {geolocation.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Obtendo localização...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Usar minha localização
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLocationPicker(true)}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Selecionar no Mapa
            </Button>

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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="createPanelAccess"
          checked={formData.createPanelAccess}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, createPanelAccess: checked as boolean }))
          }
        />
        <Label
          htmlFor="createPanelAccess"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Criar acesso ao painel do cliente (senha: 102030)
        </Label>
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
          disabled={loading || !geolocation.hasLocation}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Cliente'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onClose}>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader>
              <SheetTitle>Adicionar Cliente</SheetTitle>
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
              <DialogTitle>Adicionar Cliente</DialogTitle>
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
            : undefined
        }
        storeId={storeId}
      />
    </>
  );
};
