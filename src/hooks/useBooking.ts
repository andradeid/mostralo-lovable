import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Professional {
  id: string;
  store_id: string;
  user_id: string | null;
  name: string;
  photo_url: string | null;
  specialty: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalSchedule {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_available: boolean;
  created_at: string;
}

export interface ProfessionalBlock {
  id: string;
  professional_id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface BookingService {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  price_type: 'fixed' | 'from';
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  requires_deposit: boolean;
  deposit_amount: number | null;
  deposit_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalService {
  id: string;
  professional_id: string;
  service_id: string;
  custom_price: number | null;
  custom_duration: number | null;
  created_at: string;
}

export interface Booking {
  id: string;
  store_id: string;
  professional_id: string;
  service_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
  price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  comanda_id: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  reminder_sent: boolean;
  confirmation_sent: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  professional?: Professional;
  service?: BookingService;
}

export interface BookingSettings {
  id: string;
  store_id: string;
  min_advance_hours: number;
  max_advance_days: number;
  slot_interval_minutes: number;
  allow_any_professional: boolean;
  send_confirmation_message: boolean;
  confirmation_message_template: string;
  send_reminder_message: boolean;
  reminder_hours_before: number;
  reminder_message_template: string;
  send_satisfaction_survey: boolean;
  satisfaction_message_template: string;
  require_deposit: boolean;
  default_deposit_percentage: number;
  cancellation_hours_limit: number;
  created_at: string;
  updated_at: string;
}

// Input types
export interface CreateProfessionalInput {
  store_id: string;
  name: string;
  photo_url?: string;
  specialty?: string;
  description?: string;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
}

export interface UpdateProfessionalInput extends Partial<CreateProfessionalInput> {
  id: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateBookingServiceInput {
  store_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_minutes?: number;
  price: number;
  price_type?: 'fixed' | 'from';
  image_url?: string;
  category_id?: string;
  requires_deposit?: boolean;
  deposit_amount?: number;
  deposit_percentage?: number;
}

export interface UpdateBookingServiceInput extends Partial<CreateBookingServiceInput> {
  id: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateBookingInput {
  store_id: string;
  professional_id: string;
  service_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number;
  deposit_amount?: number;
  notes?: string;
}

// Hook principal
export function useBooking(storeId: string | null) {
  const queryClient = useQueryClient();

  // ============ PROFESSIONALS ============
  const { 
    data: professionals = [], 
    isLoading: loadingProfessionals,
    refetch: refetchProfessionals
  } = useQuery({
    queryKey: ['professionals', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Professional[];
    },
    enabled: !!storeId
  });

  const createProfessionalMutation = useMutation({
    mutationFn: async (input: CreateProfessionalInput) => {
      const { data, error } = await supabase
        .from('professionals')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as Professional;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals', storeId] });
      toast.success('Profissional criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar profissional: ${error.message}`);
    }
  });

  const updateProfessionalMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateProfessionalInput) => {
      const { data, error } = await supabase
        .from('professionals')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Professional;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals', storeId] });
      toast.success('Profissional atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar profissional: ${error.message}`);
    }
  });

  const deleteProfessionalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals', storeId] });
      toast.success('Profissional removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover profissional: ${error.message}`);
    }
  });

  // ============ BOOKING SERVICES ============
  const { 
    data: bookingServices = [], 
    isLoading: loadingServices,
    refetch: refetchServices
  } = useQuery({
    queryKey: ['booking-services', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('booking_services')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as BookingService[];
    },
    enabled: !!storeId
  });

  const createServiceMutation = useMutation({
    mutationFn: async (input: CreateBookingServiceInput) => {
      const { data, error } = await supabase
        .from('booking_services')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as BookingService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-services', storeId] });
      toast.success('Serviço criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar serviço: ${error.message}`);
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateBookingServiceInput) => {
      const { data, error } = await supabase
        .from('booking_services')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as BookingService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-services', storeId] });
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar serviço: ${error.message}`);
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('booking_services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-services', storeId] });
      toast.success('Serviço removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover serviço: ${error.message}`);
    }
  });

  // ============ PROFESSIONAL SERVICES (Vínculo) ============
  const linkServiceToProfessional = useMutation({
    mutationFn: async ({ professionalId, serviceId, customPrice, customDuration }: {
      professionalId: string;
      serviceId: string;
      customPrice?: number;
      customDuration?: number;
    }) => {
      const { data, error } = await supabase
        .from('professional_services')
        .upsert({
          professional_id: professionalId,
          service_id: serviceId,
          custom_price: customPrice,
          custom_duration: customDuration
        }, { onConflict: 'professional_id,service_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services', storeId] });
      toast.success('Serviço vinculado ao profissional!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao vincular serviço: ${error.message}`);
    }
  });

  const unlinkServiceFromProfessional = useMutation({
    mutationFn: async ({ professionalId, serviceId }: { professionalId: string; serviceId: string }) => {
      const { error } = await supabase
        .from('professional_services')
        .delete()
        .eq('professional_id', professionalId)
        .eq('service_id', serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services', storeId] });
      toast.success('Serviço desvinculado do profissional!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desvincular serviço: ${error.message}`);
    }
  });

  // ============ PROFESSIONAL SCHEDULES ============
  const { data: schedules = [] } = useQuery({
    queryKey: ['professional-schedules', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('*, professionals!inner(store_id)')
        .eq('professionals.store_id', storeId);
      
      if (error) throw error;
      return data as (ProfessionalSchedule & { professionals: { store_id: string } })[];
    },
    enabled: !!storeId
  });

  const upsertScheduleMutation = useMutation({
    mutationFn: async (schedule: Omit<ProfessionalSchedule, 'id' | 'created_at'> & { id?: string }) => {
      const { data, error } = await supabase
        .from('professional_schedules')
        .upsert(schedule, { onConflict: 'professional_id,day_of_week' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-schedules', storeId] });
      toast.success('Horário salvo com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar horário: ${error.message}`);
    }
  });

  // ============ BOOKINGS ============
  const fetchBookings = useCallback(async (startDate: string, endDate: string) => {
    if (!storeId) return [];
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        professional:professionals(*),
        service:booking_services(*)
      `)
      .eq('store_id', storeId)
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data as Booking[];
  }, [storeId]);

  const createBookingMutation = useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(input)
        .select(`
          *,
          professional:professionals(*),
          service:booking_services(*)
        `)
        .single();
      
      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', storeId] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    }
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status, cancellationReason }: { 
      id: string; 
      status: Booking['status']; 
      cancellationReason?: string 
    }) => {
      const updateData: Partial<Booking> = { status };
      
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = cancellationReason || null;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', storeId] });
      const statusLabels: Record<Booking['status'], string> = {
        pending: 'Pendente',
        confirmed: 'Confirmado',
        in_progress: 'Em Atendimento',
        completed: 'Concluído',
        no_show: 'Faltou',
        cancelled: 'Cancelado'
      };
      toast.success(`Agendamento alterado para: ${statusLabels[variables.status]}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });

  // ============ BOOKING SETTINGS ============
  const { 
    data: bookingSettings,
    isLoading: loadingSettings,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['booking-settings', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      
      if (error) throw error;
      return data as BookingSettings | null;
    },
    enabled: !!storeId
  });

  const upsertSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<BookingSettings> & { store_id: string }) => {
      const { data, error } = await supabase
        .from('booking_settings')
        .upsert(settings, { onConflict: 'store_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data as BookingSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-settings', storeId] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    }
  });

  return {
    // Professionals
    professionals,
    loadingProfessionals,
    refetchProfessionals,
    createProfessional: createProfessionalMutation.mutateAsync,
    updateProfessional: updateProfessionalMutation.mutateAsync,
    deleteProfessional: deleteProfessionalMutation.mutateAsync,
    creatingProfessional: createProfessionalMutation.isPending,
    updatingProfessional: updateProfessionalMutation.isPending,
    deletingProfessional: deleteProfessionalMutation.isPending,

    // Services
    bookingServices,
    loadingServices,
    refetchServices,
    createService: createServiceMutation.mutateAsync,
    updateService: updateServiceMutation.mutateAsync,
    deleteService: deleteServiceMutation.mutateAsync,
    creatingService: createServiceMutation.isPending,
    updatingService: updateServiceMutation.isPending,
    deletingService: deleteServiceMutation.isPending,

    // Professional-Service linking
    linkServiceToProfessional: linkServiceToProfessional.mutateAsync,
    unlinkServiceFromProfessional: unlinkServiceFromProfessional.mutateAsync,

    // Schedules
    schedules,
    upsertSchedule: upsertScheduleMutation.mutateAsync,

    // Bookings
    fetchBookings,
    createBooking: createBookingMutation.mutateAsync,
    updateBookingStatus: updateBookingStatusMutation.mutateAsync,
    creatingBooking: createBookingMutation.isPending,

    // Settings
    bookingSettings,
    loadingSettings,
    refetchSettings,
    upsertSettings: upsertSettingsMutation.mutateAsync,
    savingSettings: upsertSettingsMutation.isPending
  };
}
