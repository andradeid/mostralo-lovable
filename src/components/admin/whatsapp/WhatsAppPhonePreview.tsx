import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Video, FileText, ArrowLeft, MoreVertical, Check, Sun, Moon } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WhatsAppPhonePreviewProps {
  storeName: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  showTypingAnimation?: boolean;
  playNotificationSound?: boolean;
  allowThemeToggle?: boolean;
  defaultTheme?: 'light' | 'dark' | 'system';
  // Para tipo de interação
  interactionType?: 'text' | 'poll' | 'list';
  // Para enquetes
  pollQuestion?: string;
  pollOptions?: string[];
  pollSelectableCount?: number;
  // Para lista interativa
  listTitle?: string;
  listButtonText?: string;
  listSections?: Array<{
    title: string;
    rows: Array<{ title: string; description: string; rowId: string }>;
  }>;
}

// Hook para animação de digitação
function useTypingAnimation(
  text: string, 
  enabled: boolean, 
  speed: number = 25,
  onComplete?: () => void
) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const hasCalledComplete = useRef(false);

  const startAnimation = useDebouncedCallback(() => {
    if (!enabled || !text) {
      setDisplayText(text);
      setIsComplete(true);
      setIsTyping(false);
      return;
    }

    // Reset
    setDisplayText('');
    setIsComplete(false);
    setIsTyping(true);
    indexRef.current = 0;
    hasCalledComplete.current = false;

    // Limpa animação anterior
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Inicia animação
    animationRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        if (animationRef.current) clearInterval(animationRef.current);
        setIsTyping(false);
        setIsComplete(true);
        if (onComplete && !hasCalledComplete.current) {
          hasCalledComplete.current = true;
          onComplete();
        }
      }
    }, speed);
  }, 400);

  useEffect(() => {
    startAnimation();
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [text, enabled]);

  return { displayText, isTyping, isComplete };
}

// Componente de indicador de digitação (3 pontos)
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2 px-1">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export function WhatsAppPhonePreview({
  storeName,
  message,
  mediaUrl,
  mediaType,
  showTypingAnimation = true,
  playNotificationSound = true,
  allowThemeToggle = false,
  defaultTheme = 'system',
  interactionType = 'text',
  pollQuestion,
  pollOptions = [],
  pollSelectableCount = 1,
  listTitle,
  listButtonText,
  listSections = []
}: WhatsAppPhonePreviewProps) {
  const { resolvedTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | null>(
    defaultTheme === 'system' ? null : defaultTheme
  );
  
  // Se tem tema local definido, usa ele; senão usa o do sistema
  const isDark = localTheme 
    ? localTheme === 'dark' 
    : resolvedTheme === 'dark';

  // Toggle de tema
  const toggleTheme = useCallback(() => {
    setLocalTheme(prev => {
      if (prev === null) {
        return resolvedTheme === 'dark' ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [resolvedTheme]);

  // Callback para tocar som quando animação completar
  const handleAnimationComplete = useCallback(() => {
    if (playNotificationSound && message) {
      const audio = new Audio('/sounds/bell-1.mp3');
      audio.volume = 0.25;
      audio.play().catch(() => {});
    }
  }, [playNotificationSound, message]);

  const { displayText, isTyping, isComplete } = useTypingAnimation(
    message, 
    showTypingAnimation,
    25,
    handleAnimationComplete
  );

  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Cores do WhatsApp
  const colors = isDark ? {
    frame: '#0a0a0a',
    statusBar: '#1F2C34',
    header: '#1F2C34',
    headerText: '#e9edef',
    chatBg: '#0B141A',
    chatPattern: 'rgba(255,255,255,0.02)',
    bubble: '#005C4B',
    bubbleText: '#e9edef',
    inputBg: '#1F2C34',
    inputText: '#8696a0',
    timeText: 'rgba(255,255,255,0.6)',
    checkColor: '#53BDEB'
  } : {
    frame: '#1a1a1a',
    statusBar: '#075E54',
    header: '#075E54',
    headerText: '#ffffff',
    chatBg: '#E5DDD5',
    chatPattern: 'rgba(0,0,0,0.05)',
    bubble: '#DCF8C6',
    bubbleText: '#303030',
    inputBg: '#f0f0f0',
    inputText: '#667781',
    timeText: 'rgba(0,0,0,0.45)',
    checkColor: '#53BDEB'
  };

  return (
    <div className="flex justify-center">
      {/* Container com toggle */}
      <div className="relative">
        {/* Toggle de tema */}
        {allowThemeToggle && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="absolute -top-2 -right-2 z-20 bg-muted hover:bg-muted/80 rounded-full p-1.5 shadow-md transition-colors"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Alternar tema do preview</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Frame do celular */}
        <div 
          className="relative w-[360px] rounded-[3rem] p-2.5 shadow-2xl"
          style={{ backgroundColor: colors.frame }}
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-xl z-10" />
        
        {/* Tela */}
        <div className="rounded-[2.5rem] overflow-hidden">
          {/* Status Bar */}
          <div 
            className="flex items-center justify-between px-8 py-2 text-xs"
            style={{ backgroundColor: colors.statusBar, color: colors.headerText }}
          >
            <span className="font-medium">9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 17h2v4H2v-4zm4-4h2v8H6v-8zm4-4h2v12h-2V9zm4-4h2v16h-2V5z"/>
              </svg>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 4h-3V2h-4v2H7v18h10V4z"/>
              </svg>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div 
            className="flex items-center gap-3 px-3 py-2.5"
            style={{ backgroundColor: colors.header }}
          >
            <ArrowLeft className="w-6 h-6" style={{ color: colors.headerText }} />
            
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold text-base">
              {storeName.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <p 
                className="font-medium text-base truncate"
                style={{ color: colors.headerText }}
              >
                {storeName || 'Sua Loja'}
              </p>
              <p 
                className="text-xs opacity-80"
                style={{ color: colors.headerText }}
              >
                online
              </p>
            </div>
            
            <div className="flex items-center gap-4" style={{ color: colors.headerText }}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
              <MoreVertical className="w-6 h-6" />
            </div>
          </div>

          {/* Chat Area */}
          <div 
            className="h-[420px] px-4 py-4 overflow-y-auto"
            style={{ 
              backgroundColor: colors.chatBg,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? '%23ffffff' : '%23000000'}' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          >
            {/* Data do chat */}
            <div className="flex justify-center mb-3">
              <span 
                className="text-[10px] px-2 py-0.5 rounded-md"
                style={{ 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'
                }}
              >
                Hoje
              </span>
            </div>

            {/* Mensagem de Enquete */}
            {interactionType === 'poll' && pollQuestion && pollOptions.length > 0 && (
              <div className="flex justify-end">
                <div 
                  className="max-w-[90%] rounded-lg rounded-tr-sm shadow-sm"
                  style={{ backgroundColor: colors.bubble }}
                >
                  {/* Header da enquete */}
                  <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ color: isDark ? '#00A884' : '#25D366' }}>
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: isDark ? '#00A884' : '#25D366' }}>
                        Enquete
                      </span>
                    </div>
                    <p className="font-medium text-sm" style={{ color: colors.bubbleText }}>
                      {pollQuestion}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.timeText }}>
                      Selecione {pollSelectableCount > 1 ? `até ${pollSelectableCount} opções` : '1 opção'}
                    </p>
                  </div>
                  
                  {/* Opções */}
                  <div className="px-3 py-2 space-y-2">
                    {pollOptions.filter(o => o.trim()).map((option, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                        style={{ 
                          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                        }}
                      >
                        <div 
                          className={`w-4 h-4 border-2 ${pollSelectableCount > 1 ? 'rounded' : 'rounded-full'}`}
                          style={{ borderColor: isDark ? '#00A884' : '#25D366' }}
                        />
                        <span className="text-sm flex-1" style={{ color: colors.bubbleText }}>
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Footer */}
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs" style={{ color: colors.timeText }}>0 votos</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: colors.timeText }}>{currentTime}</span>
                      {isComplete && (
                        <div className="flex -space-x-1">
                          <Check className="w-3.5 h-3.5" style={{ color: colors.checkColor }} />
                          <Check className="w-3.5 h-3.5 -ml-1.5" style={{ color: colors.checkColor }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem com Lista Interativa */}
            {interactionType === 'list' && listButtonText && (
              <div className="flex flex-col items-end gap-1">
                {/* Balão da mensagem */}
                <div 
                  className="max-w-[90%] rounded-lg rounded-tr-sm shadow-sm relative"
                  style={{ backgroundColor: colors.bubble }}
                >
                  {/* Mídia */}
                  {mediaUrl && mediaType === 'image' && (
                    <img src={mediaUrl} alt="Media" className="w-full max-h-44 object-cover rounded-t-lg" />
                  )}
                  
                  <div className="px-3 py-2">
                    {listTitle && (
                      <p className="text-sm font-medium mb-1" style={{ color: colors.bubbleText }}>
                        {listTitle}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed pr-14" style={{ color: colors.bubbleText }}>
                      {displayText || message}
                    </p>
                    <div className="flex items-center justify-end gap-1 -mt-4">
                      <span className="text-xs" style={{ color: colors.timeText }}>{currentTime}</span>
                      {isComplete && (
                        <div className="flex -space-x-1">
                          <Check className="w-3.5 h-3.5" style={{ color: colors.checkColor }} />
                          <Check className="w-3.5 h-3.5 -ml-1.5" style={{ color: colors.checkColor }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Botão que abre a lista */}
                <button
                  className="w-[90%] py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border"
                  style={{ 
                    backgroundColor: isDark ? '#1F2C34' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    color: isDark ? '#53BDEB' : '#007AFF'
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
                  </svg>
                  {listButtonText}
                </button>
                
                {/* Preview das seções (expandido para mostrar ao usuário) */}
                {listSections.some(s => s.rows.some(r => r.title)) && (
                  <div 
                    className="w-[90%] rounded-lg border overflow-hidden text-xs"
                    style={{ 
                      backgroundColor: isDark ? '#1F2C34' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide" style={{ color: colors.timeText }}>
                      Preview da lista
                    </div>
                    {listSections.map((section, sIdx) => (
                      section.rows.some(r => r.title) && (
                        <div key={sIdx}>
                          {section.title && (
                            <div 
                              className="px-3 py-1.5 font-medium text-xs"
                              style={{ 
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                color: isDark ? '#00A884' : '#25D366'
                              }}
                            >
                              {section.title}
                            </div>
                          )}
                          {section.rows.filter(r => r.title).map((row, rIdx) => (
                            <div 
                              key={rIdx}
                              className="px-3 py-2 border-t"
                              style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                            >
                              <p className="font-medium" style={{ color: colors.bubbleText }}>{row.title}</p>
                              {row.description && (
                                <p className="text-[10px] mt-0.5" style={{ color: colors.timeText }}>{row.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mensagem Normal (texto/mídia) */}
            {interactionType === 'text' && (
              <div className="flex justify-end">
                <div 
                  className="max-w-[90%] rounded-lg rounded-tr-sm shadow-sm relative"
                  style={{ backgroundColor: colors.bubble }}
                >
                  {/* Mídia */}
                  {mediaUrl && mediaType === 'image' && (
                    <img 
                      src={mediaUrl} 
                      alt="Media" 
                      className="w-full max-h-44 object-cover rounded-t-lg"
                    />
                  )}
                  {mediaUrl && mediaType === 'video' && (
                    <div 
                      className="w-full h-32 rounded-t-lg flex items-center justify-center"
                      style={{ backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0' }}
                    >
                      <Video className="w-12 h-12 opacity-50" style={{ color: colors.bubbleText }} />
                    </div>
                  )}
                  {mediaUrl && mediaType === 'document' && (
                    <div 
                      className="w-full h-20 rounded-t-lg flex items-center justify-center gap-2"
                      style={{ backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0' }}
                    >
                      <FileText className="w-8 h-8 opacity-50" style={{ color: colors.bubbleText }} />
                      <span className="text-sm opacity-60" style={{ color: colors.bubbleText }}>Documento</span>
                    </div>
                  )}

                  {/* Texto */}
                  <div className="px-3 py-2">
                    {isTyping && !displayText ? (
                      <TypingIndicator />
                    ) : (
                      <>
                        <p 
                          className="text-sm whitespace-pre-wrap leading-relaxed pr-14"
                          style={{ color: colors.bubbleText }}
                        >
                          {displayText || message}
                          {isTyping && <span className="animate-pulse">|</span>}
                        </p>
                        
                        {/* Horário e checks */}
                        <div className="flex items-center justify-end gap-1 -mt-4">
                          <span 
                            className="text-xs"
                            style={{ color: colors.timeText }}
                          >
                            {currentTime}
                          </span>
                          {isComplete && (
                            <div className="flex -space-x-1">
                              <Check className="w-3.5 h-3.5" style={{ color: colors.checkColor }} />
                              <Check className="w-3.5 h-3.5 -ml-1.5" style={{ color: colors.checkColor }} />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div 
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ backgroundColor: isDark ? '#1F2C34' : '#f0f0f0' }}
          >
            <div 
              className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5"
              style={{ backgroundColor: isDark ? '#2A3942' : '#ffffff' }}
            >
              <span className="text-xl">😊</span>
              <span 
                className="flex-1 text-base"
                style={{ color: colors.inputText }}
              >
                Mensagem
              </span>
              <svg className="w-6 h-6" style={{ color: colors.inputText }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
              </svg>
            </div>
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#00A884' }}
            >
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            </div>
          </div>
        </div>

          {/* Home indicator */}
          <div className="flex justify-center py-1.5">
            <div className="w-28 h-1.5 bg-gray-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
