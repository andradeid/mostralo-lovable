import { supabase } from '@/integrations/supabase/client';

interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

// Gerar ou recuperar session ID
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('popup_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('popup_session_id', sessionId);
  }
  return sessionId;
};

// Escolher variação aleatória (distribuição igual)
export const getRandomVariation = (): 'A' | 'B' | 'C' | 'D' => {
  const variations = ['A', 'B', 'C', 'D'] as const;
  const index = Math.floor(Math.random() * variations.length);
  return variations[index];
};

// Captura UTM da URL atual
export const getUTMParams = (): UTMParams => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term')
  };
};

// Detectar tipo de dispositivo
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Registrar evento
export const trackPopupEvent = async (
  variation: string,
  action: 'shown' | 'clicked_cta' | 'closed' | 'clicked_outside'
): Promise<void> => {
  try {
    const utmParams = getUTMParams();
    
    await supabase.from('popup_analytics').insert({
      variation,
      action,
      session_id: getSessionId(),
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_content: utmParams.utm_content,
      utm_term: utmParams.utm_term,
      page_url: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      device_type: getDeviceType()
    });
  } catch (error) {
    console.error('Erro ao registrar analytics do popup:', error);
  }
};
