/**
 * Scripts de rastreamento para anúncios
 * Refatorado para aceitar IDs como parâmetro (vindos do banco de dados)
 */

/**
 * Inicializa o Facebook Pixel com o ID fornecido
 */
export const initializeFacebookPixel = (pixelId: string) => {
  if (!pixelId || typeof window === 'undefined') return;

  // Evitar inicialização duplicada
  if ((window as any).fbq) return;

  // Verificar se o DOM está pronto
  if (!document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initializeFacebookPixel(pixelId));
    }
    return;
  }

  // Inicializar fbq
  const f = window as any;
  const n: any = (f.fbq = function (...args: any[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  });
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];

  // Carregar script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  // Inicializar pixel
  (window as any).fbq('init', pixelId);
  (window as any).fbq('track', 'PageView');
  
  console.log('✅ Facebook Pixel inicializado:', pixelId);
};

/**
 * Inicializa o Google Ads com o ID fornecido
 */
export const initializeGoogleAds = (adsId: string) => {
  if (!adsId || typeof window === 'undefined') return;

  // Evitar inicialização duplicada
  if ((window as any).gtag && document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${adsId}"]`)) return;

  if (!document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initializeGoogleAds(adsId));
    }
    return;
  }

  // Carregar script gtag
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
  document.head.appendChild(script);

  // Configurar gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function (...args: any[]) {
    (window as any).dataLayer.push(args);
  };
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', adsId);

  console.log('✅ Google Ads inicializado:', adsId);
};

/**
 * Inicializa o Google Analytics (GA4) com o ID fornecido
 */
export const initializeGoogleAnalytics = (measurementId: string) => {
  if (!measurementId || typeof window === 'undefined') return;

  // Se já temos gtag configurado, apenas adicionar o config
  if ((window as any).gtag) {
    (window as any).gtag('config', measurementId);
    console.log('✅ Google Analytics adicionado ao gtag existente:', measurementId);
    return;
  }

  if (!document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initializeGoogleAnalytics(measurementId));
    }
    return;
  }

  // Carregar script gtag
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Configurar gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function (...args: any[]) {
    (window as any).dataLayer.push(args);
  };
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', measurementId);

  console.log('✅ Google Analytics inicializado:', measurementId);
};

/**
 * Rastreia eventos de conversão em todas as plataformas configuradas
 */
export const trackConversion = (
  eventName: string,
  value?: number,
  additionalData?: Record<string, any>
) => {
  // Facebook Pixel
  if ((window as any).fbq) {
    (window as any).fbq('track', eventName, {
      value,
      currency: 'BRL',
      ...additionalData,
    });
  }

  // Google Ads / Analytics (gtag)
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, {
      value,
      currency: 'BRL',
      ...additionalData,
    });
  }
};

/**
 * Rastreia conversão específica do Google Ads com label
 */
export const trackGoogleAdsConversion = (
  adsId: string,
  conversionLabel: string,
  value?: number
) => {
  if (!(window as any).gtag || !adsId || !conversionLabel) return;

  (window as any).gtag('event', 'conversion', {
    send_to: `${adsId}/${conversionLabel}`,
    value,
    currency: 'BRL',
  });
};

/**
 * Eventos pré-definidos para usar no sistema
 */
export const AdEvents = {
  PAGE_VIEW: 'PageView',
  LEAD: 'Lead',
  SIGN_UP: 'CompleteRegistration',
  START_TRIAL: 'StartTrial',
  PURCHASE: 'Purchase',
  ADD_TO_CART: 'AddToCart',
  VIEW_CONTENT: 'ViewContent',
  CALCULATE_SAVINGS: 'CalculateSavings',
  CONTACT: 'Contact',
} as const;
