import { supabase } from "@/integrations/supabase/client";

export type AudioType = 'beep' | 'web_speech' | 'elevenlabs';
export type VoiceTextTemplate = 'simple' | 'counter' | 'pickup';

const callTypeLabels: Record<string, string> = {
  password: 'Senha',
  order: 'Pedido',
  table: 'Mesa'
};

export interface CustomTextOptions {
  customTextEnabled?: boolean;
  customTemplate?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  useGreeting?: boolean;
  storeName?: string | null;
}

/**
 * Retorna saudação baseada no horário atual
 */
const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia!';
  if (hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
};

/**
 * Gera o texto a ser falado baseado no template ou texto personalizado
 */
export const getCallText = (
  template: VoiceTextTemplate,
  callType: string,
  number: string | number,
  options?: CustomTextOptions
): string => {
  const label = callTypeLabels[callType] || 'Senha';
  
  // Se texto personalizado está habilitado
  if (options?.customTextEnabled && options?.customTemplate) {
    let text = options.customTemplate
      .replace(/{tipo}/gi, label)
      .replace(/{numero}/gi, String(number));
    
    // Adiciona saudação por horário
    if (options?.useGreeting) {
      text = `${getTimeGreeting()} ${text}`;
    }
    
    // Adiciona prefixo
    if (options?.prefix?.trim()) {
      text = `${options.prefix.trim()} ${text}`;
    }
    
    // Adiciona sufixo
    if (options?.suffix?.trim()) {
      text = `${text} ${options.suffix.trim()}`;
    }
    
    return text;
  }
  
  // Templates padrão
  switch (template) {
    case 'counter':
      return `${label} ${number}, compareça ao balcão`;
    case 'pickup':
      return `${label} ${number} pronto para retirada`;
    case 'simple':
    default:
      return `${label} ${number}`;
  }
};

/**
 * Toca um beep simples usando Web Audio API
 */
export const playBeepSound = (): void => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Som não suportado:', e);
  }
};

/**
 * Usa Web Speech API (gratuito) para falar o texto
 * Com carregamento assíncrono de vozes e logs de debug
 */
export const speakWithWebSpeech = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('[Web Speech] Iniciando síntese:', text);
    
    if (!('speechSynthesis' in window)) {
      console.error('[Web Speech] API não suportada neste navegador');
      reject(new Error('Web Speech API não suportada neste navegador'));
      return;
    }

    // Cancelar fala anterior se houver
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Função que executa a fala após vozes carregadas
    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('[Web Speech] Vozes disponíveis:', voices.length, voices.map(v => `${v.name} (${v.lang})`).slice(0, 5));
      
      const ptVoice = voices.find(v => v.lang.startsWith('pt'));
      if (ptVoice) {
        console.log('[Web Speech] Usando voz pt-BR:', ptVoice.name);
        utterance.voice = ptVoice;
      } else {
        console.log('[Web Speech] Voz pt-BR não encontrada, usando padrão do sistema');
      }

      utterance.onend = () => {
        console.log('[Web Speech] Síntese finalizada com sucesso');
        resolve();
      };
      
      utterance.onerror = (e) => {
        console.error('[Web Speech] Erro na síntese:', e);
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Verificar se vozes já estão carregadas
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      console.log('[Web Speech] Vozes já carregadas, falando imediatamente');
      speak();
    } else {
      console.log('[Web Speech] Aguardando carregamento das vozes...');
      
      let hasSpoken = false;
      
      const voicesChangedHandler = () => {
        if (hasSpoken) return;
        hasSpoken = true;
        window.speechSynthesis.onvoiceschanged = null;
        console.log('[Web Speech] Vozes carregadas via evento');
        speak();
      };
      
      window.speechSynthesis.onvoiceschanged = voicesChangedHandler;
      
      // Timeout de segurança - tenta falar mesmo sem seleção de voz
      setTimeout(() => {
        if (hasSpoken) return;
        hasSpoken = true;
        window.speechSynthesis.onvoiceschanged = null;
        console.log('[Web Speech] Timeout - tentando falar com voz padrão');
        speak();
      }, 2000);
    }
  });
};

/**
 * Reproduz áudio usando ElevenLabs via Edge Function
 * A API key é gerenciada de forma segura no servidor (Supabase Secrets)
 */
export const speakWithElevenLabs = async (
  text: string,
  voiceId?: string | null
): Promise<void> => {
  console.log('[ElevenLabs] Iniciando síntese:', text, 'Voice:', voiceId || 'padrão');
  
  const { data, error } = await supabase.functions.invoke('text-to-speech', {
    body: { text, voiceId: voiceId || 'onwK4e9ZLuTAKqWW03F9' }
  });

  if (error) {
    console.error('[ElevenLabs] Erro na chamada:', error);
    throw new Error(`Erro ao chamar serviço de voz: ${error.message}`);
  }

  const { audioContent, error: apiError } = data;
  
  if (apiError) {
    console.error('[ElevenLabs] Erro da API:', apiError);
    throw new Error(`Erro da API ElevenLabs: ${apiError}`);
  }

  if (!audioContent) {
    throw new Error('Nenhum áudio retornado pelo serviço');
  }

  // Validar tamanho do áudio
  const audioSize = audioContent.length;
  console.log('[ElevenLabs] Áudio recebido. Tamanho base64:', audioSize, 'caracteres');
  
  if (audioSize < 100) {
    throw new Error('Áudio recebido é muito pequeno, pode estar corrompido');
  }

  // Converter base64 para ArrayBuffer usando AudioContext (mais compatível)
  console.log('[ElevenLabs] Decodificando base64 para ArrayBuffer...');
  const binaryString = atob(audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Usar AudioContext para reprodução (evita restrições de URL)
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('AudioContext não suportado neste navegador');
  }
  
  const audioContext = new AudioContextClass();
  console.log('[ElevenLabs] AudioContext criado, decodificando áudio...');
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
    console.log('[ElevenLabs] Áudio decodificado. Duração:', audioBuffer.duration.toFixed(2), 'segundos');
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    return new Promise<void>((resolve, reject) => {
      source.onended = () => {
        console.log('[ElevenLabs] Reprodução finalizada com sucesso');
        audioContext.close();
        resolve();
      };
      
      try {
        source.start(0);
        console.log('[ElevenLabs] Reprodução iniciada via AudioContext');
      } catch (playError: any) {
        console.error('[ElevenLabs] Erro ao iniciar reprodução:', playError);
        audioContext.close();
        reject(new Error(`Falha ao reproduzir: ${playError.message || 'Erro desconhecido'}`));
      }
    });
  } catch (decodeError: any) {
    console.error('[ElevenLabs] Erro ao decodificar áudio:', decodeError);
    audioContext.close();
    throw new Error(`Erro ao decodificar áudio: ${decodeError.message || 'Formato inválido'}`);
  }
};

/**
 * Retorna mensagem legível para códigos de erro de mídia
 */
const getMediaErrorMessage = (code: number): string => {
  switch (code) {
    case 1: return 'Reprodução abortada pelo usuário';
    case 2: return 'Erro de rede ao carregar áudio';
    case 3: return 'Erro ao decodificar áudio';
    case 4: return 'Formato de áudio não suportado';
    default: return 'Erro desconhecido';
  }
};

/**
 * Função principal para reproduzir áudio de chamada
 * Nota: ElevenLabs agora usa API key segura no servidor
 */
export const playPasswordCallAudio = async (
  audioType: AudioType,
  text: string,
  elevenLabsVoiceId?: string | null
): Promise<void> => {
  console.log('[Audio] Reproduzindo tipo:', audioType);
  
  switch (audioType) {
    case 'beep':
      playBeepSound();
      break;
    case 'web_speech':
      await speakWithWebSpeech(text);
      break;
    case 'elevenlabs':
      await speakWithElevenLabs(text, elevenLabsVoiceId);
      break;
  }
};

// Vozes ElevenLabs organizadas por tipo
// Modelo multilingual_v2 detecta português automaticamente
export const elevenLabsVoices = [
  // === VOZES RECOMENDADAS PARA PT-BR ===
  // Estas vozes funcionam bem com português brasileiro usando o modelo multilingual_v2
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: '🇧🇷 Masculina clara (recomendada)', category: 'recomendada' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: '🇧🇷 Feminina suave (recomendada)', category: 'recomendada' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: '🇧🇷 Masculina profunda (recomendada)', category: 'recomendada' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: '🇧🇷 Feminina profissional (recomendada)', category: 'recomendada' },
  
  // === OUTRAS VOZES MULTILÍNGUES ===
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Masculina madura', category: 'multilingual' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Feminina jovem', category: 'multilingual' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Masculina casual', category: 'multilingual' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Masculina narradora', category: 'multilingual' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Feminina calorosa', category: 'multilingual' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Feminina expressiva', category: 'multilingual' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', description: 'Masculina amigável', category: 'multilingual' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', description: 'Masculina casual', category: 'multilingual' },
];
