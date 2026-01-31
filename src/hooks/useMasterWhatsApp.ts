import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppMessages {
  default: string;
  suplementos_landing?: string;
  suplementos_guia?: string;
  supermercados?: string;
  farmacias?: string;
  acougues?: string;
  feirantes?: string;
  lojistas?: string;
  biomundo?: string;
  [key: string]: string | undefined;
}

interface MasterWhatsAppConfig {
  instancePhone: string | null;
  fallbackPhone: string | null;
  messages: WhatsAppMessages;
  isLoading: boolean;
}

export type NichoType = 
  | 'default' 
  | 'suplementos_landing' 
  | 'suplementos_guia' 
  | 'supermercados' 
  | 'farmacias' 
  | 'acougues' 
  | 'feirantes' 
  | 'lojistas' 
  | 'biomundo'
  | 'petshop'
  | 'arena_esportiva';

const DEFAULT_MESSAGES: WhatsAppMessages = {
  default: 'Olá! Gostaria de saber mais sobre o Mostralo',
  suplementos_landing: 'Olá! Quero uma simulação de economia para minha loja de suplementos',
  suplementos_guia: 'Olá! Vi o guia completo e quero saber mais sobre o Mostralo para suplementos',
  supermercados: 'Olá! Tenho um supermercado e quero saber mais sobre o Mostralo',
  farmacias: 'Olá! Tenho uma farmácia e gostaria de conhecer o Mostralo',
  acougues: 'Olá! Tenho um açougue e quero saber mais sobre o Mostralo',
  feirantes: 'Oi! Sou lojista de feira e quero saber mais sobre o Mostralo',
  lojistas: 'Olá! Tenho uma loja física e quero criar minha loja online com o Mostralo',
  biomundo: 'Olá! Sou da Bio Mundo e gostaria de agendar uma apresentação do Mostralo',
  petshop: 'Olá! Tenho um Pet Shop e quero saber mais sobre o Mostralo',
  arena_esportiva: 'Olá! Tenho uma arena esportiva (Beach/Padel/Society) e quero saber mais sobre o Mostralo'
};

const DEFAULT_FALLBACK_NUMBER = '556194009368';

export function useMasterWhatsApp() {
  const [config, setConfig] = useState<MasterWhatsAppConfig>({
    instancePhone: null,
    fallbackPhone: null,
    messages: DEFAULT_MESSAGES,
    isLoading: true
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('master_whatsapp_config')
          .select('instance_phone, fallback_phone, whatsapp_messages')
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar config WhatsApp:', error);
        }
        
        setConfig({
          instancePhone: data?.instance_phone || null,
          fallbackPhone: data?.fallback_phone || null,
          messages: (data?.whatsapp_messages as WhatsAppMessages) || DEFAULT_MESSAGES,
          isLoading: false
        });
      } catch (err) {
        console.error('Erro ao buscar WhatsApp master:', err);
        setConfig(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchConfig();
  }, []);

  // Número efetivo: instance > fallback > default
  const effectivePhone = useMemo(() => {
    return config.instancePhone || config.fallbackPhone || DEFAULT_FALLBACK_NUMBER;
  }, [config.instancePhone, config.fallbackPhone]);

  // Função para gerar link com mensagem do nicho
  const getWhatsAppLink = (nicho: NichoType = 'default'): string => {
    const message = config.messages[nicho] || config.messages.default || DEFAULT_MESSAGES.default;
    return `https://wa.me/${effectivePhone}?text=${encodeURIComponent(message)}`;
  };

  return {
    ...config,
    effectivePhone,
    getWhatsAppLink
  };
}

// Helper function para uso sem hook (ex: em componentes que já tem os dados)
export function buildWhatsAppLink(
  phone: string | null, 
  fallback: string | null, 
  messages: WhatsAppMessages,
  nicho: NichoType = 'default'
): string {
  const number = phone || fallback || DEFAULT_FALLBACK_NUMBER;
  const message = messages[nicho] || messages.default || DEFAULT_MESSAGES.default;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
