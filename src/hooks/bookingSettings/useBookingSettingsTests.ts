// Testes de envio pelo WhatsApp (avaliação do Google e notificações) e encurtador
// do link do Google Review. Código movido da BookingSettingsPage sem mudança
// (mesmas chamadas, mesma ordem, mesmas dependências).
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  buildTestNotificationMessage,
  type BookingSettingsForm,
  type BookingStoreLocation,
} from '@/lib/bookingSettings/bookingSettingsForm';

interface Params {
  storeId: string | null;
  formData: BookingSettingsForm;
  storeLocation: BookingStoreLocation;
}

export function useBookingSettingsTests({ storeId, formData, storeLocation }: Params) {
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
  const [isShortening, setIsShortening] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendingTestType, setSendingTestType] = useState<string | null>(null);

  const handleShortenUrl = useCallback(async () => {
    if (!formData.google_review_url) return;
    setIsShortening(true);
    try {
      const { data, error } = await supabase.functions.invoke('short-link', {
        body: { action: 'create_url', targetUrl: formData.google_review_url, storeSlug: storeLocation.slug || 'general' }
      });
      if (error || !data?.success) { toast.error('Erro ao encurtar link'); return; }
      setShortenedUrl(`${window.location.origin}/r/${data.id}`);
      toast.success('Link encurtado!');
    } catch { toast.error('Erro ao encurtar link'); } finally { setIsShortening(false); }
  }, [formData.google_review_url, storeId, storeLocation.slug]);

  const handleTestReview = useCallback(async () => {
    if (!testPhone) { toast.error('Informe o número'); return; }
    if (!storeId) { toast.error('Loja não identificada'); return; }
    const reviewUrl = shortenedUrl || formData.google_review_url;
    if (!reviewUrl) { toast.error('Configure o link primeiro'); return; }
    setIsSendingTest(true);
    try {
      const normalizedPhone = testPhone.replace(/\D/g, '');
      const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
      const remoteJid = `${phoneWithCountry}@s.whatsapp.net`;
      const message = `⭐ *Teste de Avaliação*\n\nOlá! Este é um teste.\n\n👉 ${reviewUrl}\n\nObrigado! 😊`;
      const { data: storeData } = await supabase.from('stores').select('logo_url').eq('id', storeId).single();
      const logoUrl = storeData?.logo_url || null;
      const { data, error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: { storeId, remoteJid, content: message, messageType: logoUrl ? 'image' : 'text', ...(logoUrl ? { mediaUrl: logoUrl } : {}) }
      });
      if (error) throw new Error(error.message || 'Erro');
      if (data?.error) throw new Error(data.error);
      toast.success('Mensagem enviada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar');
    } finally { setIsSendingTest(false); }
  }, [testPhone, shortenedUrl, formData.google_review_url, storeId]);

  const sendTestNotification = useCallback(async (type: string) => {
    if (!testPhone) { toast.error('Informe o número de WhatsApp'); return; }
    if (!storeId) { toast.error('Loja não identificada'); return; }
    setSendingTestType(type);
    try {
      const normalizedPhone = testPhone.replace(/\D/g, '');
      const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
      const remoteJid = `${phoneWithCountry}@s.whatsapp.net`;

      // Encurtar link de localização para uso no template
      let locationShortLink = 'https://exemplo.com/localizacao';
      const templateUsesLocation = buildTestNotificationMessage(type, formData, '__LOC__', shortenedUrl).includes('__LOC__');
      if (templateUsesLocation && storeLocation.latitude && storeLocation.longitude) {
        const fullLocUrl = `https://mostralo.com.br/navegar?lat=${storeLocation.latitude}&lng=${storeLocation.longitude}${storeLocation.slug ? `&store=${encodeURIComponent(storeLocation.slug)}` : ''}${storeLocation.address ? `&address=${encodeURIComponent(storeLocation.address)}` : ''}`;
        locationShortLink = fullLocUrl;
        try {
          const { data: shortData } = await supabase.functions.invoke('short-link', {
            body: { action: 'create_url', targetUrl: fullLocUrl, storeSlug: storeLocation.slug || 'general' }
          });
          if (shortData?.success && shortData?.id) {
            locationShortLink = `https://mostralo.com.br/r/${shortData.id}`;
          }
        } catch (e) {
          console.warn('Falha ao encurtar link de localização:', e);
        }
      }

      // Mesma troca de variáveis das mensagens reais (_shared/booking-template.ts)
      const message = buildTestNotificationMessage(type, formData, locationShortLink, shortenedUrl);

      const { data: storeData } = await supabase.from('stores').select('logo_url').eq('id', storeId).single();
      const logoUrl = storeData?.logo_url || null;
      const { data, error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: { storeId, remoteJid, content: message, messageType: logoUrl ? 'image' : 'text', ...(logoUrl ? { mediaUrl: logoUrl } : {}) }
      });
      if (error) throw new Error(error.message || 'Erro');
      if (data?.error) throw new Error(data.error);

      // Se for confirmação e enviar localização está ativo, enviar localização com link encurtado + logo
      if (type === 'confirmation' && formData.send_location_in_confirmation && storeLocation.latitude && storeLocation.longitude) {
        const fullLocationLink = `https://mostralo.com.br/navegar?lat=${storeLocation.latitude}&lng=${storeLocation.longitude}${storeLocation.slug ? `&store=${encodeURIComponent(storeLocation.slug)}` : ''}${storeLocation.address ? `&address=${encodeURIComponent(storeLocation.address)}` : ''}`;
        
        // Encurtar o link de localização
        let shortLocationLink = fullLocationLink;
        try {
          const { data: shortData } = await supabase.functions.invoke('short-link', {
            body: { action: 'create_url', targetUrl: fullLocationLink, storeSlug: storeLocation.slug || 'general' }
          });
          if (shortData?.success && shortData?.id) {
            shortLocationLink = `https://mostralo.com.br/r/${shortData.id}`;
          }
        } catch (e) {
          console.warn('Falha ao encurtar link de localização, usando link completo:', e);
        }

        const locationCaption = `📍 *Navegue até nós:*\n${shortLocationLink}`;
        await supabase.functions.invoke('whatsapp-chat-send', {
          body: { 
            storeId, 
            remoteJid, 
            content: locationCaption, 
            messageType: logoUrl ? 'image' : 'text', 
            ...(logoUrl ? { mediaUrl: logoUrl } : {}) 
          }
        });
      }

      toast.success(`✅ Teste de ${type === 'confirmation' ? 'confirmação' : type === 'reminder' ? 'lembrete' : type === 'satisfaction' ? 'satisfação' : type === 'review' ? 'avaliação' : type === 'pix' ? 'PIX' : type} enviado!`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar teste');
    } finally { setSendingTestType(null); }
  }, [testPhone, storeId, formData, shortenedUrl, storeLocation]);

  return {
    shortenedUrl, setShortenedUrl,
    isShortening,
    testPhone, setTestPhone,
    isSendingTest,
    sendingTestType,
    handleShortenUrl,
    handleTestReview,
    sendTestNotification,
  };
}
