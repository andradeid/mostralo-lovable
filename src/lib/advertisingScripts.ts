/**
 * Scripts de rastreamento para anúncios
 * Configure as variáveis de ambiente antes de ativar
 * 
 * Para ativar:
 * 1. Adicione as seguintes variáveis no arquivo .env:
 *    - VITE_FACEBOOK_PIXEL_ID="seu_pixel_id"
 *    - VITE_GOOGLE_ADS_ID="seu_ads_id"
 * 2. Descomente o código nas funções abaixo
 * 3. Importe e chame as funções no componente Index.tsx
 */

/**
 * Inicializa o Facebook Pixel para rastreamento de conversões
 * Documentação: https://developers.facebook.com/docs/meta-pixel
 */
export const initializeFacebookPixel = () => {
  const pixelId = import.meta.env.VITE_FACEBOOK_PIXEL_ID;
  
  if (!pixelId) {
    console.warn('⚠️ Facebook Pixel ID não configurado. Configure VITE_FACEBOOK_PIXEL_ID no .env');
    return;
  }
  
  // Descomente as linhas abaixo quando tiver o Pixel ID configurado
  /*
  // Carregar o script do Facebook Pixel
  (function(f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  // Inicializar o Pixel
  (window as any).fbq('init', pixelId);
  (window as any).fbq('track', 'PageView');
  
  console.log('✅ Facebook Pixel inicializado com sucesso');
  */
  
  console.log('ℹ️ Facebook Pixel desabilitado. Descomente o código acima para ativar.');
};

/**
 * Inicializa o Google Ads para rastreamento de conversões
 * Documentação: https://support.google.com/google-ads/answer/6331314
 */
export const initializeGoogleAds = () => {
  const adsId = import.meta.env.VITE_GOOGLE_ADS_ID;
  
  if (!adsId) {
    console.warn('⚠️ Google Ads ID não configurado. Configure VITE_GOOGLE_ADS_ID no .env');
    return;
  }
  
  // Descomente as linhas abaixo quando tiver o Ads ID configurado
  /*
  // Carregar o script do Google Ads
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
  document.head.appendChild(script);

  // Configurar o dataLayer
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', adsId);
  
  console.log('✅ Google Ads inicializado com sucesso');
  */
  
  console.log('ℹ️ Google Ads desabilitado. Descomente o código acima para ativar.');
};

/**
 * Rastreia eventos de conversão em ambas as plataformas
 * @param eventName - Nome do evento (ex: 'Purchase', 'Lead', 'SignUp')
 * @param value - Valor da conversão em reais (opcional)
 * @param additionalData - Dados adicionais do evento (opcional)
 */
export const trackConversion = (
  eventName: string, 
  value?: number,
  additionalData?: Record<string, any>
) => {
  // Descomente as linhas abaixo quando os scripts estiverem ativos
  /*
  // Facebook Pixel
  if ((window as any).fbq) {
    (window as any).fbq('track', eventName, {
      value,
      currency: 'BRL',
      ...additionalData
    });
    console.log(`✅ Facebook: Evento ${eventName} rastreado`);
  }
  
  // Google Ads
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, {
      value,
      currency: 'BRL',
      ...additionalData
    });
    console.log(`✅ Google Ads: Evento ${eventName} rastreado`);
  }
  */
  
  console.log(`ℹ️ Conversão simulada: ${eventName} - R$ ${value || 0}`, additionalData);
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
  CONTACT: 'Contact'
} as const;

/**
 * Exemplo de uso no componente:
 * 
 * import { initializeFacebookPixel, initializeGoogleAds, trackConversion, AdEvents } from '@/lib/advertisingScripts';
 * 
 * // No useEffect do componente Index.tsx:
 * useEffect(() => {
 *   initializeFacebookPixel();
 *   initializeGoogleAds();
 * }, []);
 * 
 * // Ao clicar no botão de trial:
 * const handleStartTrial = () => {
 *   trackConversion(AdEvents.START_TRIAL, 297);
 *   // ... resto do código
 * };
 * 
 * // Ao calcular economia:
 * const handleCalculate = () => {
 *   trackConversion(AdEvents.CALCULATE_SAVINGS, savingsYearly, {
 *     monthly_revenue: monthlyRevenue
 *   });
 *   // ... resto do código
 * };
 */
