import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { DigitalCard, CardFormData, CustomLink, CardTheme } from '@/types/digitalCard';
import type { Json } from '@/integrations/supabase/types';

export function useDigitalCard() {
  const { user } = useAuth();
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const parseCustomLinks = (links: Json | null): CustomLink[] => {
    if (!links || !Array.isArray(links)) return [];
    return links as unknown as CustomLink[];
  };

  const fetchCard = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCard({
          ...data,
          owner_type: data.owner_type as 'salesperson' | 'admin' | 'store',
          theme: data.theme as CardTheme,
          custom_links: parseCustomLinks(data.custom_links),
          inherit_store_data: data.inherit_store_data ?? true,
          booking_enabled: data.booking_enabled ?? false,
          booking_button_text: data.booking_button_text,
        });
      }
    } catch (error) {
      console.error('Error fetching digital card:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  const generateSlug = (name: string): string => {
    return name
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

  const saveCard = async (formData: CardFormData, ownerType: 'salesperson' | 'admin' = 'salesperson') => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return false;
    }

    setSaving(true);
    try {
      const isAvailable = await checkSlugAvailability(formData.slug, card?.id);
      if (!isAvailable) {
        toast.error('Este slug já está em uso. Escolha outro.');
        return false;
      }

      const cardData = {
        owner_id: user.id,
        owner_type: ownerType,
        slug: formData.slug,
        name: formData.name,
        title: formData.title || null,
        company: formData.company || null,
        headline: formData.headline || null,
        bio: formData.bio || null,
        whatsapp: formData.whatsapp || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        instagram: formData.instagram || null,
        linkedin: formData.linkedin || null,
        facebook: formData.facebook || null,
        tiktok: formData.tiktok || null,
        youtube: formData.youtube || null,
        cta_text: formData.cta_text || null,
        cta_url: formData.cta_url || null,
        custom_links: formData.custom_links as unknown as Json,
        stats_text: formData.stats_text || null,
        theme: formData.theme,
        accent_color: formData.accent_color || '#f97316',
        show_qr_code: formData.show_qr_code,
        show_mostralo_badge: formData.show_mostralo_badge,
      };

      if (card?.id) {
        const { error } = await supabase
          .from('digital_cards')
          .update(cardData)
          .eq('id', card.id);

        if (error) throw error;
        toast.success('Cartão atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('digital_cards')
          .insert(cardData);

        if (error) throw error;
        toast.success('Cartão criado com sucesso!');
      }

      await fetchCard();
      return true;
    } catch (error: unknown) {
      console.error('Error saving card:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar cartão';
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePhoto = async (file: File) => {
    if (!user?.id || !card?.id) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/digital-card.${fileExt}`;

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
        .eq('id', card.id);

      if (updateError) throw updateError;

      await fetchCard();
      toast.success('Foto atualizada!');
      return photoUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto');
      return null;
    }
  };

  const toggleActive = async () => {
    if (!card?.id) return;

    try {
      const { error } = await supabase
        .from('digital_cards')
        .update({ is_active: !card.is_active })
        .eq('id', card.id);

      if (error) throw error;
      
      await fetchCard();
      toast.success(card.is_active ? 'Cartão desativado' : 'Cartão ativado');
    } catch (error) {
      console.error('Error toggling card:', error);
      toast.error('Erro ao alterar status');
    }
  };

  return {
    card,
    loading,
    saving,
    saveCard,
    updatePhoto,
    toggleActive,
    generateSlug,
    checkSlugAvailability,
    refetch: fetchCard,
  };
}

export function usePublicCard(slug: string) {
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseCustomLinks = (links: Json | null): CustomLink[] => {
    if (!links || !Array.isArray(links)) return [];
    return links as unknown as CustomLink[];
  };

  useEffect(() => {
    async function fetchPublicCard() {
      if (!slug) return;
      
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('digital_cards')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;
        
        if (!data) {
          setError('Cartão não encontrado');
          return;
        }

        setCard({
          ...data,
          owner_type: data.owner_type as 'salesperson' | 'admin' | 'store',
          theme: data.theme as CardTheme,
          custom_links: parseCustomLinks(data.custom_links),
          inherit_store_data: data.inherit_store_data ?? true,
          booking_enabled: data.booking_enabled ?? false,
          booking_button_text: data.booking_button_text,
        });

        // Incrementar views
        await supabase.rpc('increment_card_views', { card_slug: slug });
      } catch (err) {
        console.error('Error fetching public card:', err);
        setError('Erro ao carregar cartão');
      } finally {
        setLoading(false);
      }
    }

    fetchPublicCard();
  }, [slug]);

  const trackClick = async (clickType: string, linkLabel?: string) => {
    if (!card?.id) return;

    try {
      await supabase.from('digital_card_clicks').insert({
        card_id: card.id,
        click_type: clickType,
        link_label: linkLabel || null,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  };

  return { card, loading, error, trackClick };
}

export function useCardStats(cardId?: string) {
  const [stats, setStats] = useState({
    totalViews: 0,
    totalClicks: 0,
    clicksByType: {} as Record<string, number>,
    recentClicks: [] as { date: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!cardId) {
        setLoading(false);
        return;
      }

      try {
        // Get card views
        const { data: cardData } = await supabase
          .from('digital_cards')
          .select('views_count')
          .eq('id', cardId)
          .single();

        // Get clicks
        const { data: clicks } = await supabase
          .from('digital_card_clicks')
          .select('click_type, created_at')
          .eq('card_id', cardId);

        const clicksByType: Record<string, number> = {};
        clicks?.forEach(click => {
          clicksByType[click.click_type] = (clicksByType[click.click_type] || 0) + 1;
        });

        // Group clicks by date (last 7 days)
        const last7Days = new Array(7).fill(0).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const recentClicks = last7Days.map(date => {
          const count = clicks?.filter(c => c.created_at.startsWith(date)).length || 0;
          return { date, count };
        });

        setStats({
          totalViews: cardData?.views_count || 0,
          totalClicks: clicks?.length || 0,
          clicksByType,
          recentClicks,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [cardId]);

  return { stats, loading };
}
