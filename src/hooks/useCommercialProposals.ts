import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface SelectedModule {
  id: string;
  name: string;
  key: string;
  price: number;
}

export interface CommercialProposal {
  id: string;
  proposal_number: string;
  slug: string;
  client_name: string;
  client_email: string | null;
  client_phone: string;
  client_company: string | null;
  niche_id: string | null;
  selected_modules: SelectedModule[];
  modules_total: number;
  setup_fee: number;
  discount_percentage: number;
  discount_amount: number;
  final_monthly_price: number;
  billing_cycle: string;
  status: string;
  valid_until: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  signature_data: Record<string, unknown> | null;
  contract_accepted: boolean;
  created_by: string | null;
  salesperson_id: string | null;
  store_id: string | null;
  payment_approval_id: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  niche?: {
    id: string;
    name: string;
    icon: string | null;
  };
  salesperson?: {
    id: string;
    user_id: string;
    profile?: {
      full_name: string | null;
    };
  };
}

export interface CreateProposalData {
  client_name: string;
  client_email?: string;
  client_phone: string;
  client_company?: string;
  niche_id?: string;
  selected_modules: SelectedModule[];
  modules_total: number;
  setup_fee?: number;
  discount_percentage?: number;
  discount_amount?: number;
  final_monthly_price: number;
  billing_cycle?: string;
  valid_until?: string;
  salesperson_id?: string;
  internal_notes?: string;
  store_count?: number;
  payment_method?: string;
}

// Gera slug único
function generateSlug(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Gera número da proposta (AAMM0001)
function generateProposalNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${year}${month}${random}`;
}

export function useCommercialProposals(filters?: { status?: string; salesperson_id?: string }) {
  return useQuery({
    queryKey: ['commercial-proposals', filters],
    queryFn: async () => {
      let query = supabase
        .from('commercial_proposals')
        .select(`
          *,
          niche:niches(id, name, icon)
        `)
        .order('created_at', { ascending: false });
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.salesperson_id) {
        query = query.eq('salesperson_id', filters.salesperson_id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Parse selected_modules from JSON
      return (data || []).map(p => ({
        ...p,
        selected_modules: (p.selected_modules as unknown as SelectedModule[]) || []
      })) as CommercialProposal[];
    }
  });
}

export function useProposalBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['proposal', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('commercial_proposals')
        .select(`
          *,
          niche:niches(id, name, icon)
        `)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        selected_modules: (data.selected_modules as unknown as SelectedModule[]) || []
      } as CommercialProposal;
    },
    enabled: !!slug
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProposalData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const proposalData = {
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        client_company: data.client_company,
        niche_id: data.niche_id,
        modules_total: data.modules_total,
        setup_fee: data.setup_fee || 0,
        discount_percentage: data.discount_percentage || 0,
        discount_amount: data.discount_amount || 0,
        final_monthly_price: data.final_monthly_price,
        billing_cycle: data.billing_cycle || 'monthly',
        valid_until: data.valid_until,
        salesperson_id: data.salesperson_id,
        internal_notes: data.internal_notes,
        store_count: data.store_count || 1,
        payment_method: data.payment_method || 'pix',
        proposal_number: generateProposalNumber(),
        slug: generateSlug(),
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_by: user.user?.id,
        selected_modules: data.selected_modules as unknown as Json
      };

      const { data: result, error } = await supabase
        .from('commercial_proposals')
        .insert(proposalData)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-proposals'] });
      toast.success('Proposta criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar proposta:', error);
      toast.error('Erro ao criar proposta');
    }
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProposalData> & { status?: string } }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.client_name !== undefined) updateData.client_name = data.client_name;
      if (data.client_email !== undefined) updateData.client_email = data.client_email;
      if (data.client_phone !== undefined) updateData.client_phone = data.client_phone;
      if (data.client_company !== undefined) updateData.client_company = data.client_company;
      if (data.niche_id !== undefined) updateData.niche_id = data.niche_id;
      if (data.modules_total !== undefined) updateData.modules_total = data.modules_total;
      if (data.setup_fee !== undefined) updateData.setup_fee = data.setup_fee;
      if (data.discount_percentage !== undefined) updateData.discount_percentage = data.discount_percentage;
      if (data.discount_amount !== undefined) updateData.discount_amount = data.discount_amount;
      if (data.final_monthly_price !== undefined) updateData.final_monthly_price = data.final_monthly_price;
      if (data.billing_cycle !== undefined) updateData.billing_cycle = data.billing_cycle;
      if (data.valid_until !== undefined) updateData.valid_until = data.valid_until;
      if (data.salesperson_id !== undefined) updateData.salesperson_id = data.salesperson_id;
      if (data.internal_notes !== undefined) updateData.internal_notes = data.internal_notes;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.selected_modules !== undefined) updateData.selected_modules = data.selected_modules as unknown as Json;

      const { data: result, error } = await supabase
        .from('commercial_proposals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-proposals'] });
      toast.success('Proposta atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar proposta:', error);
      toast.error('Erro ao atualizar proposta');
    }
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commercial_proposals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-proposals'] });
      toast.success('Proposta excluída!');
    },
    onError: (error) => {
      console.error('Erro ao excluir proposta:', error);
      toast.error('Erro ao excluir proposta');
    }
  });
}

// Registrar visualização da proposta
export async function registerProposalView(proposalId: string) {
  await supabase
    .from('commercial_proposals')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', proposalId)
    .is('viewed_at', null);

  await supabase
    .from('proposal_activity_log')
    .insert({
      proposal_id: proposalId,
      action: 'viewed',
      actor_type: 'client',
      metadata: {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
}
