import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Search, Info, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomerLocationPicker } from './CustomerLocationPicker';
import { normalizePhone, formatPhone } from '@/lib/utils';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGeolocation } from '@/hooks/useGeolocation';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9zdHJhbG8iLCJhIjoiY200eWI2ZmtvMDFhNjJrczgyaWd4eXJpeSJ9.EWExgXOHVjFpEsLNVdORkQ';

// Schema de validação - localização obrigatória
const customerSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120, 'Nome deve ter no máximo 120 caracteres'),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  email: z.string().trim().email('E-mail inválido').max(255, 'E-mail deve ter no máximo 255 caracteres').optional().or(z.literal('')),
  address: z.string().trim().min(1, 'Endereço é obrigatório').max(500, 'Endereço deve ter no máximo 500 caracteres'),
  notes: z.string().trim().max(500, 'Observações devem ter no máximo 500 caracteres').optional().or(z.literal('')),
  latitude: z.number({ error: 'Localização GPS é obrigatória' }),
  longitude: z.number({ error: 'Localização GPS é obrigatória' }),
});

interface CustomerRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
}

export function CustomerRegisterDialog({ open, onOpenChange, storeId }: CustomerRegisterDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const geolocation = useGeolocation();

  // Carregar dados do localStorage ao abrir
  useEffect(() => {
    if (open) {
      const savedProfile = localStorage.getItem(`customer_${storeId}`);
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setName(profile.name || '');
          setPhone(formatPhone(profile.phone || ''));
          setEmail(profile.email || '');
          setNotes(profile.notes || '');
          if (profile.latitude && profile.longitude) {
            geolocation.setLocation(profile.latitude, profile.longitude, profile.address || '');
          }
        } catch (error) {
          console.error('Erro ao carregar perfil:', error);
        }
      }
    }
  }, [open, storeId]);

  const handleSearchCustomer = async () => {
    if (!phone) {
      toast.error('Digite um telefone para buscar');
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    
    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      toast.error('Telefone deve ter 10 ou 11 dígitos');
      return;
    }

    // Passo 1: Buscar no localStorage primeiro
    const localKey = `customer_${storeId}`;
    const savedProfile = localStorage.getItem(localKey);
    
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        if (normalizePhone(profile.phone) === normalizedPhone) {
          setName(profile.name || '');
          setEmail(profile.email || '');
          setNotes(profile.notes || '');
          if (profile.latitude && profile.longitude) {
            geolocation.setLocation(profile.latitude, profile.longitude, profile.address || '');
          }
          toast.success('Dados encontrados no seu dispositivo!');
          return;
        }
      } catch (e) {
        console.error('Erro ao ler localStorage:', e);
      }
    }

    // Passo 2: Tentar buscar no Supabase (pode falhar por RLS)
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, address, notes, latitude, longitude')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        if (errorMessage.includes('permission') || errorMessage.includes('policy') || error.code === 'PGRST301' || error.code === '42501') {
          toast.info('Por segurança, a busca no servidor está desativada. Preencha seus dados e salve; nas próximas vezes reconhecemos pelo telefone.', { duration: 5000 });
          return;
        }
        throw error;
      }

      if (data) {
        setName(data.name);
        setEmail(data.email || '');
        setNotes(data.notes || '');
        if (data.latitude && data.longitude) {
          geolocation.setLocation(Number(data.latitude), Number(data.longitude), data.address || '');
        }
        toast.success('Cliente encontrado!');
      } else {
        toast.info('Cliente não encontrado. Preencha seus dados para se cadastrar.');
      }
    } catch (error: any) {
      console.error('Erro ao buscar cliente:', error);
      toast.error('Erro ao buscar cliente');
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!storeId) {
      toast.error('Loja não identificada. Tente novamente.');
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    
    const validation = customerSchema.safeParse({
      name: name.trim(),
      phone: normalizedPhone,
      email: email?.trim() || '',
      address: geolocation.address?.trim() || '',
      notes: notes?.trim() || '',
      latitude: geolocation.latitude,
      longitude: geolocation.longitude,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .upsert({
          phone: normalizedPhone,
          name: name.trim(),
          email: email?.trim() || null,
          address: geolocation.address?.trim() || null,
          notes: notes?.trim() || null,
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
        }, {
          onConflict: 'phone',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (error) throw error;

      await supabase
        .from('customer_stores')
        .upsert({
          customer_id: customer.id,
          store_id: storeId,
          first_order_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_id,store_id'
        });

      const profile = {
        name: name.trim(),
        phone: normalizedPhone,
        email: email?.trim() || '',
        address: geolocation.address?.trim() || '',
        notes: notes?.trim() || '',
        latitude: geolocation.latitude,
        longitude: geolocation.longitude,
      };
      localStorage.setItem(`customer_${storeId}`, JSON.stringify(profile));

      toast.success('Cadastro salvo com sucesso!');
      window.dispatchEvent(new CustomEvent('customerProfileUpdated', { detail: profile }));
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar cadastro:', error);
      
      const errorCode = error?.code || '';
      const errorMessage = error?.message?.toLowerCase() || '';
      
      if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        toast.error('Este telefone já está cadastrado! Use o botão de busca (🔍) para carregar seus dados.', { duration: 5000 });
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy') || errorCode === '42501') {
        toast.error('Erro de permissão. Tente novamente ou entre em contato com a loja.', { duration: 4000 });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.', { duration: 4000 });
      } else {
        toast.error('Erro ao salvar cadastro. Tente novamente.', { duration: 4000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (data: { address: string; latitude: number; longitude: number }) => {
    geolocation.setLocation(data.latitude, data.longitude, data.address);
    setShowMapPicker(false);
  };

  const handleGetCurrentLocation = () => {
    geolocation.getCurrentLocation(MAPBOX_TOKEN);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastro Rápido</DialogTitle>
            <DialogDescription>
              Seu cadastro é feito uma única vez. Nas próximas compras, reconhecemos seus dados automaticamente pelo seu telefone.
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              💡 Nas próximas compras, basta digitar seu telefone e clicar no ícone de busca para recuperar seus dados automaticamente.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Telefone com busca */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp *</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={15}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSearchCustomer}
                  disabled={searching}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                    onClick={() => setShowMapPicker(true)}
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

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Perto do mercado, portão azul..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading || !geolocation.hasLocation}>
              {loading ? 'Salvando...' : 'Salvar Cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomerLocationPicker
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialCoords={geolocation.hasLocation ? { latitude: geolocation.latitude!, longitude: geolocation.longitude! } : undefined}
        storeId={storeId}
      />
    </>
  );
}
