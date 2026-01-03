import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Scissors, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ProfessionalServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
  storeId: string;
  onSuccess?: () => void;
}

interface BookingService {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface ProfessionalService {
  id?: string;
  professional_id: string;
  service_id: string;
  custom_price: number | null;
  custom_duration: number | null;
  is_active: boolean;
}

export function ProfessionalServicesDialog({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  storeId,
  onSuccess
}: ProfessionalServicesDialogProps) {
  const [services, setServices] = useState<BookingService[]>([]);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch services and professional services
  useEffect(() => {
    const fetchData = async () => {
      if (!open || !professionalId || !storeId) return;
      
      setLoading(true);
      try {
        // Fetch all services
        const { data: servicesData, error: servicesError } = await (supabase as any)
          .from('booking_services')
          .select('id, name, price, duration_minutes')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (servicesError) throw servicesError;
        setServices((servicesData || []) as BookingService[]);

        // Fetch professional services
        const { data: psData, error: psError } = await (supabase as any)
          .from('professional_services')
          .select('*')
          .eq('professional_id', professionalId);

        if (psError) throw psError;
        setProfessionalServices((psData || []) as ProfessionalService[]);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, professionalId, storeId]);

  const isServiceLinked = (serviceId: string) => {
    const ps = professionalServices.find(ps => ps.service_id === serviceId);
    return ps?.is_active ?? false;
  };

  const getCustomPrice = (serviceId: string) => {
    const ps = professionalServices.find(ps => ps.service_id === serviceId);
    return ps?.custom_price ?? null;
  };

  const getCustomDuration = (serviceId: string) => {
    const ps = professionalServices.find(ps => ps.service_id === serviceId);
    return ps?.custom_duration ?? null;
  };

  const toggleService = (serviceId: string, checked: boolean) => {
    setProfessionalServices(prev => {
      const existing = prev.find(ps => ps.service_id === serviceId);
      if (existing) {
        return prev.map(ps => 
          ps.service_id === serviceId ? { ...ps, is_active: checked } : ps
        );
      } else {
        return [...prev, {
          professional_id: professionalId,
          service_id: serviceId,
          custom_price: null,
          custom_duration: null,
          is_active: checked
        }];
      }
    });
  };

  const updateCustomPrice = (serviceId: string, price: number | null) => {
    setProfessionalServices(prev => {
      const existing = prev.find(ps => ps.service_id === serviceId);
      if (existing) {
        return prev.map(ps => 
          ps.service_id === serviceId ? { ...ps, custom_price: price } : ps
        );
      } else {
        return [...prev, {
          professional_id: professionalId,
          service_id: serviceId,
          custom_price: price,
          custom_duration: null,
          is_active: true
        }];
      }
    });
  };

  const updateCustomDuration = (serviceId: string, duration: number | null) => {
    setProfessionalServices(prev => {
      const existing = prev.find(ps => ps.service_id === serviceId);
      if (existing) {
        return prev.map(ps => 
          ps.service_id === serviceId ? { ...ps, custom_duration: duration } : ps
        );
      } else {
        return [...prev, {
          professional_id: professionalId,
          service_id: serviceId,
          custom_price: null,
          custom_duration: duration,
          is_active: true
        }];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get all services that should be linked (active)
      const activeServices = professionalServices.filter(ps => ps.is_active);
      const inactiveServices = professionalServices.filter(ps => !ps.is_active && ps.id);

      // Delete inactive ones that have IDs (were previously saved)
      for (const ps of inactiveServices) {
        if (ps.id) {
          await (supabase as any)
            .from('professional_services')
            .delete()
            .eq('id', ps.id);
        }
      }

      // Upsert active ones
      for (const ps of activeServices) {
        const data = {
          professional_id: ps.professional_id,
          service_id: ps.service_id,
          custom_price: ps.custom_price,
          custom_duration: ps.custom_duration,
          is_active: true
        };

        if (ps.id) {
          await (supabase as any)
            .from('professional_services')
            .update(data)
            .eq('id', ps.id);
        } else {
          await (supabase as any)
            .from('professional_services')
            .insert(data);
        }
      }

      toast.success('Serviços vinculados com sucesso!');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving professional services:', error);
      toast.error('Erro ao salvar serviços');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Serviços de {professionalName}
          </DialogTitle>
          <DialogDescription>
            Selecione os serviços que este profissional pode realizar
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8">
            <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum serviço cadastrado. Cadastre serviços primeiro.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => {
              const linked = isServiceLinked(service.id);
              const customPrice = getCustomPrice(service.id);
              const customDuration = getCustomDuration(service.id);
              
              return (
                <div 
                  key={service.id} 
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    linked ? "border-primary bg-primary/5" : "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={linked}
                      onCheckedChange={(checked) => toggleService(service.id, !!checked)}
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Padrão: {formatPrice(service.price)} • {service.duration_minutes} min
                        </p>
                      </div>

                      {linked && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Preço customizado</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={`${service.price}`}
                              value={customPrice ?? ''}
                              onChange={(e) => updateCustomPrice(
                                service.id, 
                                e.target.value ? parseFloat(e.target.value) : null
                              )}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Duração customizada (min)</Label>
                            <Input
                              type="number"
                              min="5"
                              step="5"
                              placeholder={`${service.duration_minutes}`}
                              value={customDuration ?? ''}
                              onChange={(e) => updateCustomDuration(
                                service.id, 
                                e.target.value ? parseInt(e.target.value) : null
                              )}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Salvar Serviços
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
