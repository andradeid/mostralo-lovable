import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Search, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomerLocationPicker } from './CustomerLocationPicker';
import { normalizePhone, formatPhone } from '@/lib/utils';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Schema de validação
const customerSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120, 'Nome deve ter no máximo 120 caracteres'),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  email: z.string().trim().email('E-mail inválido').max(255, 'E-mail deve ter no máximo 255 caracteres').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Endereço deve ter no máximo 500 caracteres').optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Observações devem ter no máximo 500 caracteres').optional().or(z.literal('')),
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
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

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
          setAddress(profile.address || '');
          setNotes(profile.notes || '');
          setLatitude(profile.latitude || null);
          setLongitude(profile.longitude || null);
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
          setAddress(profile.address || '');
          setNotes(profile.notes || '');
          setLatitude(profile.latitude);
          setLongitude(profile.longitude);
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
        // Se for erro de permissão RLS, avisar de forma amigável
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
        setAddress(data.address || '');
        setNotes(data.notes || '');
        setLatitude(data.latitude ? Number(data.latitude) : null);
        setLongitude(data.longitude ? Number(data.longitude) : null);
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
    // Guarda 1: verificar storeId
    if (!storeId) {
      toast.error('Loja não identificada. Tente novamente.');
      return;
    }

    // Guarda 2: validar com Zod
    const normalizedPhone = normalizePhone(phone);
    
    const validation = customerSchema.safeParse({
      name: name.trim(),
      phone: normalizedPhone,
      email: email?.trim() || '',
      address: address?.trim() || '',
      notes: notes?.trim() || '',
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      // UPSERT do cliente (global)
      const { data: customer, error } = await supabase
        .from('customers')
        .upsert({
          phone: normalizedPhone,
          name: name.trim(),
          email: email?.trim() || null,
          address: address?.trim() || null,
          notes: notes?.trim() || null,
          latitude: latitude || null,
          longitude: longitude || null,
        }, {
          onConflict: 'phone',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (error) throw error;

      // Criar relacionamento com a loja
      await supabase
        .from('customer_stores')
        .upsert({
          customer_id: customer.id,
          store_id: storeId,
          first_order_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_id,store_id'
        });

      if (error) {
        console.error('Erro detalhado ao salvar:', error);
        const errorMessage = error?.message || 'Erro ao salvar cadastro';
        toast.error(errorMessage, { duration: 4000 });
        return;
      }

      // Salvar snapshot no localStorage com a nova chave padronizada
      const profile = {
        name: name.trim(),
        phone: normalizedPhone,
        email: email?.trim() || '',
        address: address?.trim() || '',
        notes: notes?.trim() || '',
        latitude,
        longitude,
      };
      localStorage.setItem(`customer_${storeId}`, JSON.stringify(profile));

      toast.success('Cadastro salvo com sucesso!');
      
      // Notificar Store.tsx para atualizar saudação
      window.dispatchEvent(new CustomEvent('customerProfileUpdated', { detail: profile }));
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar cadastro:', error);
      const errorMessage = error?.message || 'Erro ao salvar cadastro';
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (data: { address: string; latitude: number; longitude: number }) => {
    setAddress(data.address);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    setShowMapPicker(false);
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

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                placeholder="Rua, número, bairro, cidade..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMapPicker(true)}
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Selecionar no Mapa
              </Button>
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
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomerLocationPicker
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialCoords={latitude && longitude ? { latitude, longitude } : undefined}
        storeId={storeId}
      />
    </>
  );
}
