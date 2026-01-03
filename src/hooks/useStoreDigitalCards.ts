import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { toast } from 'sonner';
import type { DigitalCard, CardFormData, CustomLink, CardTheme } from '@/types/digitalCard';
import type { Json } from '@/integrations/supabase/types';

export interface Professional {
  id: string;
  name: string;
  photo_url: string | null;
  specialty: string | null;
  phone: string | null;
  user_id: string | null;
}

export interface StoreData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  address: string | null;
}

export interface DigitalCardWithProfessional extends DigitalCard {
  professional?: Professional | null;
}

const MAX_CARDS = 5;

export function useStoreDigitalCards() {
  const { storeId, isLoading: storeAccessLoading } = useStoreAccess();
  const [cards, setCards] = useState<DigitalCardWithProfessional[]>([]);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const parseCustomLinks = (links: Json | null): CustomLink[] => {
    if (!links || !Array.isArray(links)) return [];
    return links as unknown as CustomLink[];
  };

  const fetchData = useCallback(async () => {
    if (!storeId || storeAccessLoading) return;

    setLoading(true);
    try {
      // Buscar dados da loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name, slug, logo_url, phone, whatsapp, instagram, facebook, website, address')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStoreData(store);

      // Buscar profissionais da loja
      const { data: profs, error: profsError } = await supabase
        .from('professionals')
        .select('id, name, photo_url, specialty, phone, user_id')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (profsError) throw profsError;
      setProfessionals(profs || []);

      // Buscar cartões da loja
      const { data: cardsData, error: cardsError } = await supabase
        .from('digital_cards')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      // Mapear cartões com profissionais
      const cardsWithProfessionals: DigitalCardWithProfessional[] = (cardsData || []).map(card => {
        const professional = profs?.find(p => p.id === card.professional_id) || null;
        return {
          ...card,
          owner_type: card.owner_type as 'salesperson' | 'admin' | 'store',
          theme: (card.theme || 'dark') as CardTheme,
          custom_links: parseCustomLinks(card.custom_links),
          inherit_store_data: card.inherit_store_data ?? true,
          booking_enabled: card.booking_enabled ?? true,
          professional,
        };
      });

      setCards(cardsWithProfessionals);
    } catch (error) {
      console.error('Error fetching store digital cards:', error);
      toast.error('Erro ao carregar cartões');
    } finally {
      setLoading(false);
    }
  }, [storeId, storeAccessLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateSlug = (storeName: string, professionalName: string): string => {
    const combined = `${storeName}-${professionalName}`;
    return combined
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const checkSlugAvailability = async (slug: string, excludeId?: string): Promise<boolean> => {
    const query = supabase
      .from('digital_cards')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query.neq('id', excludeId);
    }

    const { data } = await query.maybeSingle();
    return !data;
  };

  const canCreateMore = cards.length < MAX_CARDS;

  const getAvailableProfessionals = (): Professional[] => {
    const usedProfessionalIds = cards.map(c => c.professional_id).filter(Boolean);
    return professionals.filter(p => !usedProfessionalIds.includes(p.id));
  };

  const createCard = async (professionalId: string, formData: Partial<CardFormData>) => {
    if (!storeId || !storeData) {
      toast.error('Loja não encontrada');
      return false;
    }

    if (!canCreateMore) {
      toast.error(`Limite de ${MAX_CARDS} cartões atingido`);
      return false;
    }

    const professional = professionals.find(p => p.id === professionalId);
    if (!professional) {
      toast.error('Profissional não encontrado');
      return false;
    }

    setSaving(true);
    try {
      const slug = formData.slug || generateSlug(storeData.slug || storeData.name, professional.name);
      
      const isAvailable = await checkSlugAvailability(slug);
      if (!isAvailable) {
        toast.error('Este slug já está em uso');
        return false;
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error('Usuário não autenticado');

      const cardData = {
        owner_id: authData.user.id,
        owner_type: 'store' as const,
        store_id: storeId,
        professional_id: professionalId,
        slug,
        name: professional.name,
        title: formData.title || professional.specialty || null,
        company: storeData.name,
        headline: formData.headline || null,
        bio: formData.bio || null,
        whatsapp: formData.whatsapp || storeData.whatsapp || null,
        phone: formData.phone || professional.phone || storeData.phone || null,
        email: formData.email || null,
        website: formData.website || storeData.website || null,
        instagram: formData.instagram || storeData.instagram || null,
        linkedin: formData.linkedin || null,
        facebook: formData.facebook || storeData.facebook || null,
        tiktok: formData.tiktok || null,
        youtube: formData.youtube || null,
        cta_text: formData.cta_text || null,
        cta_url: formData.cta_url || null,
        custom_links: (formData.custom_links || []) as unknown as Json,
        stats_text: formData.stats_text || null,
        theme: formData.theme || 'dark',
        accent_color: formData.accent_color || '#f97316',
        show_qr_code: formData.show_qr_code ?? true,
        show_mostralo_badge: formData.show_mostralo_badge ?? true,
        inherit_store_data: true,
        booking_enabled: true,
        booking_button_text: 'Agendar Horário',
        is_active: true,
      };

      const { error } = await supabase
        .from('digital_cards')
        .insert(cardData);

      if (error) throw error;

      toast.success('Cartão criado com sucesso!');
      await fetchData();
      return true;
    } catch (error: unknown) {
      console.error('Error creating card:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar cartão';
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateCard = async (cardId: string, formData: Partial<CardFormData> & { 
    inherit_store_data?: boolean;
    booking_enabled?: boolean;
    booking_button_text?: string;
  }) => {
    if (!storeId) return false;

    setSaving(true);
    try {
      const existingCard = cards.find(c => c.id === cardId);
      if (!existingCard) throw new Error('Cartão não encontrado');

      if (formData.slug && formData.slug !== existingCard.slug) {
        const isAvailable = await checkSlugAvailability(formData.slug, cardId);
        if (!isAvailable) {
          toast.error('Este slug já está em uso');
          return false;
        }
      }

      const updateData: Record<string, unknown> = {};
      
      if (formData.slug !== undefined) updateData.slug = formData.slug;
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.title !== undefined) updateData.title = formData.title || null;
      if (formData.company !== undefined) updateData.company = formData.company || null;
      if (formData.headline !== undefined) updateData.headline = formData.headline || null;
      if (formData.bio !== undefined) updateData.bio = formData.bio || null;
      if (formData.whatsapp !== undefined) updateData.whatsapp = formData.whatsapp || null;
      if (formData.phone !== undefined) updateData.phone = formData.phone || null;
      if (formData.email !== undefined) updateData.email = formData.email || null;
      if (formData.website !== undefined) updateData.website = formData.website || null;
      if (formData.instagram !== undefined) updateData.instagram = formData.instagram || null;
      if (formData.linkedin !== undefined) updateData.linkedin = formData.linkedin || null;
      if (formData.facebook !== undefined) updateData.facebook = formData.facebook || null;
      if (formData.tiktok !== undefined) updateData.tiktok = formData.tiktok || null;
      if (formData.youtube !== undefined) updateData.youtube = formData.youtube || null;
      if (formData.cta_text !== undefined) updateData.cta_text = formData.cta_text || null;
      if (formData.cta_url !== undefined) updateData.cta_url = formData.cta_url || null;
      if (formData.custom_links !== undefined) updateData.custom_links = formData.custom_links as unknown as Json;
      if (formData.stats_text !== undefined) updateData.stats_text = formData.stats_text || null;
      if (formData.theme !== undefined) updateData.theme = formData.theme;
      if (formData.accent_color !== undefined) updateData.accent_color = formData.accent_color || '#f97316';
      if (formData.show_qr_code !== undefined) updateData.show_qr_code = formData.show_qr_code;
      if (formData.show_mostralo_badge !== undefined) updateData.show_mostralo_badge = formData.show_mostralo_badge;
      if (formData.inherit_store_data !== undefined) updateData.inherit_store_data = formData.inherit_store_data;
      if (formData.booking_enabled !== undefined) updateData.booking_enabled = formData.booking_enabled;
      if (formData.booking_button_text !== undefined) updateData.booking_button_text = formData.booking_button_text || 'Agendar Horário';

      const { error } = await supabase
        .from('digital_cards')
        .update(updateData)
        .eq('id', cardId)
        .eq('store_id', storeId);

      if (error) throw error;

      toast.success('Cartão atualizado com sucesso!');
      await fetchData();
      return true;
    } catch (error: unknown) {
      console.error('Error updating card:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar cartão';
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!storeId) return false;

    try {
      const { error } = await supabase
        .from('digital_cards')
        .delete()
        .eq('id', cardId)
        .eq('store_id', storeId);

      if (error) throw error;

      toast.success('Cartão excluído com sucesso!');
      await fetchData();
      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Erro ao excluir cartão');
      return false;
    }
  };

  const toggleActive = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return false;

    try {
      const { error } = await supabase
        .from('digital_cards')
        .update({ is_active: !card.is_active })
        .eq('id', cardId)
        .eq('store_id', storeId);

      if (error) throw error;

      toast.success(card.is_active ? 'Cartão desativado' : 'Cartão ativado');
      await fetchData();
      return true;
    } catch (error) {
      console.error('Error toggling card:', error);
      toast.error('Erro ao alterar status');
      return false;
    }
  };

  const updatePhoto = async (cardId: string, file: File) => {
    if (!storeId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/${cardId}/photo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('digital_cards')
        .update({ photo_url: photoUrl })
        .eq('id', cardId)
        .eq('store_id', storeId);

      if (updateError) throw updateError;

      await fetchData();
      toast.success('Foto atualizada!');
      return photoUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto');
      return null;
    }
  };

  return {
    cards,
    storeData,
    professionals,
    loading: loading || storeAccessLoading,
    saving,
    canCreateMore,
    maxCards: MAX_CARDS,
    getAvailableProfessionals,
    createCard,
    updateCard,
    deleteCard,
    toggleActive,
    updatePhoto,
    generateSlug,
    checkSlugAvailability,
    refetch: fetchData,
  };
}
