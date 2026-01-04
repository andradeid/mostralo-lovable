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
  phone: string | null;
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
  enable_professional_reviews: boolean;
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
  phone?: string;
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

// Helper to execute raw queries (bypass type checking for new tables)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawQuery = async <T>(
  table: string,
  query: 'select' | 'insert' | 'update' | 'delete' | 'upsert',
  options: {
    select?: string;
    data?: unknown;
    eq?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean }[];
    single?: boolean;
    onConflict?: string;
  } = {}
): Promise<T> => {
  // Use rpc for raw SQL or direct table access
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (columns?: string) => unknown;
      insert: (data: unknown) => unknown;
      update: (data: unknown) => unknown;
      delete: () => unknown;
      upsert: (data: unknown, options?: { onConflict?: string }) => unknown;
    };
  };

  let builder: unknown = client.from(table);

  if (query === 'select') {
    builder = (builder as { select: (s: string) => unknown }).select(options.select || '*');
  } else if (query === 'insert') {
    builder = (builder as { insert: (d: unknown) => unknown }).insert(options.data);
    if (options.select) {
      builder = (builder as { select: (s?: string) => unknown }).select(options.select);
    }
  } else if (query === 'update') {
    builder = (builder as { update: (d: unknown) => unknown }).update(options.data);
    if (options.select) {
      builder = (builder as { select: (s?: string) => unknown }).select(options.select);
    }
  } else if (query === 'delete') {
    builder = (builder as { delete: () => unknown }).delete();
  } else if (query === 'upsert') {
    builder = (builder as { upsert: (d: unknown, o?: { onConflict?: string }) => unknown })
      .upsert(options.data, { onConflict: options.onConflict });
    if (options.select) {
      builder = (builder as { select: (s?: string) => unknown }).select(options.select);
    }
  }

  // Apply filters
  if (options.eq) {
    for (const [key, value] of Object.entries(options.eq)) {
      builder = (builder as { eq: (k: string, v: unknown) => unknown }).eq(key, value);
    }
  }

  // Apply ordering
  if (options.order) {
    for (const ord of options.order) {
      builder = (builder as { order: (c: string, o: { ascending: boolean }) => unknown })
        .order(ord.column, { ascending: ord.ascending ?? true });
    }
  }

  // Get single result
  if (options.single) {
    builder = (builder as { single: () => unknown }).single();
  }

  const result = await (builder as Promise<{ data: T; error: Error | null }>);
  
  if ((result as { error: Error | null }).error) {
    throw (result as { error: Error }).error;
  }
  
  return (result as { data: T }).data;
};

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
      return rawQuery<Professional[]>('professionals', 'select', {
        eq: { store_id: storeId },
        order: [{ column: 'display_order', ascending: true }]
      });
    },
    enabled: !!storeId
  });

  const createProfessionalMutation = useMutation({
    mutationFn: async (input: CreateProfessionalInput) => {
      return rawQuery<Professional>('professionals', 'insert', {
        data: input,
        select: '*',
        single: true
      });
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
      return rawQuery<Professional>('professionals', 'update', {
        data: input,
        eq: { id },
        select: '*',
        single: true
      });
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
      return rawQuery<null>('professionals', 'delete', {
        eq: { id }
      });
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
      return rawQuery<BookingService[]>('booking_services', 'select', {
        eq: { store_id: storeId },
        order: [{ column: 'display_order', ascending: true }]
      });
    },
    enabled: !!storeId
  });

  const createServiceMutation = useMutation({
    mutationFn: async (input: CreateBookingServiceInput) => {
      return rawQuery<BookingService>('booking_services', 'insert', {
        data: input,
        select: '*',
        single: true
      });
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
      return rawQuery<BookingService>('booking_services', 'update', {
        data: input,
        eq: { id },
        select: '*',
        single: true
      });
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
      return rawQuery<null>('booking_services', 'delete', {
        eq: { id }
      });
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
      return rawQuery<ProfessionalService>('professional_services', 'upsert', {
        data: {
          professional_id: professionalId,
          service_id: serviceId,
          custom_price: customPrice,
          custom_duration: customDuration
        },
        onConflict: 'professional_id,service_id',
        select: '*',
        single: true
      });
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
      return rawQuery<null>('professional_services', 'delete', {
        eq: { professional_id: professionalId, service_id: serviceId }
      });
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
      // We'll need a join here, but for now just get all schedules
      // and filter on the client side based on professionals
      const profIds = professionals.map(p => p.id);
      if (profIds.length === 0) return [];
      
      // For now, just fetch all and let RLS filter
      return rawQuery<ProfessionalSchedule[]>('professional_schedules', 'select', {});
    },
    enabled: !!storeId && professionals.length > 0
  });

  const upsertScheduleMutation = useMutation({
    mutationFn: async (schedule: Omit<ProfessionalSchedule, 'id' | 'created_at'> & { id?: string }) => {
      return rawQuery<ProfessionalSchedule>('professional_schedules', 'upsert', {
        data: schedule,
        onConflict: 'professional_id,day_of_week',
        select: '*',
        single: true
      });
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
    
    // For now, use a simpler query without joins
    const bookings = await rawQuery<Booking[]>('bookings', 'select', {
      eq: { store_id: storeId },
      order: [
        { column: 'booking_date', ascending: true },
        { column: 'start_time', ascending: true }
      ]
    });
    
    // Filter by date range
    return bookings.filter(b => 
      b.booking_date >= startDate && b.booking_date <= endDate
    );
  }, [storeId]);

  const createBookingMutation = useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      return rawQuery<Booking>('bookings', 'insert', {
        data: input,
        select: '*',
        single: true
      });
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
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = cancellationReason || null;
      }
      
      return rawQuery<Booking>('bookings', 'update', {
        data: updateData,
        eq: { id },
        select: '*',
        single: true
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', storeId] });
      const statusLabels: Record<Booking['status'], string> = {
        pending: 'pendente',
        confirmed: 'confirmado',
        in_progress: 'em atendimento',
        completed: 'concluído',
        no_show: 'não compareceu',
        cancelled: 'cancelado'
      };
      toast.success(`Agendamento ${statusLabels[variables.status]}!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });

  // ============ BOOKING SETTINGS ============
  const { data: bookingSettings } = useQuery({
    queryKey: ['booking-settings', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      try {
        const settings = await rawQuery<BookingSettings[]>('booking_settings', 'select', {
          eq: { store_id: storeId }
        });
        return settings[0] || null;
      } catch {
        return null;
      }
    },
    enabled: !!storeId
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<BookingSettings> & { store_id: string }) => {
      return rawQuery<BookingSettings>('booking_settings', 'upsert', {
        data: settings,
        onConflict: 'store_id',
        select: '*',
        single: true
      });
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

    // Professional Services
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
    updateSettings: updateSettingsMutation.mutateAsync
  };
}
