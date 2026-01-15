import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { usePublicCard } from '@/hooks/useDigitalCard';
import { DigitalCardPreview } from '@/components/digital-card/DigitalCardPreview';
import { useQRCode } from '@/hooks/useQRCode';
import { supabase } from '@/integrations/supabase/client';

interface RatingStats {
  avg: number;
  count: number;
}

export default function DigitalCardPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { card, loading, error, trackClick } = usePublicCard(slug || '');
  const cardUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrCodeUrl = useQRCode(cardUrl, 120);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [ratings, setRatings] = useState<RatingStats | null>(null);

  // Buscar slug da loja se o cartão tiver store_id e professional_id
  useEffect(() => {
    async function fetchStoreSlug() {
      if (card?.store_id && card?.professional_id) {
        const { data: store } = await supabase
          .from('stores')
          .select('slug')
          .eq('id', card.store_id)
          .single();
        
        if (store?.slug) {
          setStoreSlug(store.slug);
        }
      }
    }
    fetchStoreSlug();
  }, [card?.store_id, card?.professional_id]);

  // Buscar avaliações do profissional
  useEffect(() => {
    async function fetchRatings() {
      if (card?.professional_id) {
        const { data } = await supabase
          .from('booking_reviews')
          .select('rating')
          .eq('professional_id', card.professional_id)
          .eq('is_public', true)
          .not('rating', 'is', null);
        
        if (data && data.length > 0) {
          const validRatings = data.filter(r => r.rating !== null);
          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, r) => acc + (r.rating || 0), 0);
            const avg = sum / validRatings.length;
            setRatings({ 
              avg: Math.round(avg * 10) / 10, 
              count: validRatings.length 
            });
          }
        }
      }
    }
    fetchRatings();
  }, [card?.professional_id]);

  // Update page title and meta
  useEffect(() => {
    if (card) {
      document.title = `${card.name} | Cartão Digital`;
      
      // Update OG meta tags
      const updateMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateMeta('og:title', `${card.name} - ${card.title || 'Cartão Digital'}`);
      updateMeta('og:description', card.headline || 'Veja meu cartão digital');
      if (card.photo_url) {
        updateMeta('og:image', card.photo_url);
      }
    }
  }, [card]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Cartão não encontrado</h1>
          <p className="text-muted-foreground">
            O cartão que você está procurando não existe ou foi desativado.
          </p>
        </div>
      </div>
    );
  }

  const formData = {
    name: card.name,
    title: card.title || '',
    company: card.company || '',
    headline: card.headline || '',
    bio: card.bio || '',
    whatsapp: card.whatsapp || '',
    phone: card.phone || '',
    email: card.email || '',
    website: card.website || '',
    instagram: card.instagram || '',
    linkedin: card.linkedin || '',
    facebook: card.facebook || '',
    tiktok: card.tiktok || '',
    youtube: card.youtube || '',
    cta_text: card.cta_text || '',
    cta_url: card.cta_url || '',
    custom_links: card.custom_links || [],
    stats_text: card.stats_text || '',
    theme: card.theme,
    accent_color: card.accent_color || '#f97316',
    show_qr_code: card.show_qr_code,
    show_mostralo_badge: card.show_mostralo_badge,
    slug: card.slug,
    booking_enabled: card.booking_enabled,
    booking_button_text: card.booking_button_text,
  };

  // Gerar URL de agendamento se aplicável (usando professional_id como fallback)
  const bookingUrl = card.booking_enabled && storeSlug && card.professional_id
    ? `/agendar/${storeSlug}?profissional=${card.professional_id}`
    : undefined;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center md:p-4">
      <div className="w-full md:max-w-md">
        <DigitalCardPreview
          data={formData}
          photoUrl={card.photo_url}
          isInteractive
          onClickAction={trackClick}
          qrCodeUrl={card.show_qr_code ? qrCodeUrl : undefined}
          bookingUrl={bookingUrl}
          ratings={ratings}
        />
      </div>
    </div>
  );
}
