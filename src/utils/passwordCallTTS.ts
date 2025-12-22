import { supabase } from "@/integrations/supabase/client";

export type AudioType = 'beep' | 'web_speech' | 'elevenlabs';
export type VoiceTextTemplate = 'simple' | 'counter' | 'pickup';

const callTypeLabels: Record<string, string> = {
  password: 'Senha',
  order: 'Pedido',
  table: 'Mesa'
};

/**
 * Gera o texto a ser falado baseado no template
 */
export const getCallText = (
  template: VoiceTextTemplate,
  callType: string,
  number: string | number
): string => {
  const label = callTypeLabels[callType] || 'Senha';
  
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
 */
export const speakWithWebSpeech = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
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

    // Tentar encontrar uma voz em português
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Usa ElevenLabs API (premium) para falar o texto
 */
export const speakWithElevenLabs = async (
  text: string,
  voiceId: string,
  apiKey: string
): Promise<void> => {
  try {
    const response = await supabase.functions.invoke('text-to-speech', {
      body: { text, voiceId, apiKey }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const { audioContent, error } = response.data;
    
    if (error) {
      throw new Error(error);
    }

    if (!audioContent) {
      throw new Error('Nenhum áudio retornado');
    }

    // Tocar o áudio base64
    const audioUrl = `data:audio/mpeg;base64,${audioContent}`;
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('Erro ElevenLabs TTS:', error);
    throw error;
  }
};

/**
 * Função principal que escolhe o tipo de áudio baseado na config
 */
export const playPasswordCallAudio = async (
  audioType: AudioType,
  text: string,
  elevenLabsVoiceId?: string | null,
  elevenLabsApiKey?: string | null
): Promise<void> => {
  switch (audioType) {
    case 'web_speech':
      await speakWithWebSpeech(text);
      break;
    
    case 'elevenlabs':
      if (!elevenLabsApiKey) {
        console.warn('API key ElevenLabs não configurada, usando beep');
        playBeepSound();
        return;
      }
      await speakWithElevenLabs(
        text,
        elevenLabsVoiceId || 'JBFqnCBsd6RMkjVDRZzb',
        elevenLabsApiKey
      );
      break;
    
    case 'beep':
    default:
      playBeepSound();
      break;
  }
};

// Vozes populares do ElevenLabs
export const elevenLabsVoices = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Masculina (inglês)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Feminina (inglês)' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Feminina (inglês)' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Masculina (inglês)' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Masculina (inglês)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Masculina (inglês)' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Feminina (inglês)' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Masculina (inglês)' },
];
