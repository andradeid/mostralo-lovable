import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemBannerData {
  id: string;
  title: string;
  html_content: string;
  position: string;
  display_order: number;
}

interface SystemBannerProps {
  position: string;
}

// Função simples de sanitização (remove scripts e eventos)
const sanitizeHTML = (html: string): string => {
  // Remove tags script
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers (onclick, onerror, etc)
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');
  // Remove javascript: URLs
  clean = clean.replace(/javascript:/gi, '');
  return clean;
};

export function SystemBanner({ position }: SystemBannerProps) {
  const [banners, setBanners] = useState<SystemBannerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('system_banners')
          .select('id, title, html_content, position, display_order')
          .or(`position.eq.${position},position.eq.all_pages`)
          .eq('is_active', true)
          .or(`start_date.is.null,start_date.lte.${now}`)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .order('display_order', { ascending: true });
        
        if (error) {
          console.error('Erro ao carregar system_banners:', error);
          return;
        }
        
        if (data) {
          setBanners(data as SystemBannerData[]);
        }
      } catch (err) {
        console.error('Erro ao carregar banners:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, [position]);

  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 w-full">
      {banners.map(banner => (
        <div 
          key={banner.id}
          className="rounded-lg overflow-hidden border-2 border-yellow-500/60 shadow-lg min-h-[80px]"
          dangerouslySetInnerHTML={{ 
            __html: sanitizeHTML(banner.html_content) 
          }}
        />
      ))}
    </div>
  );
}
