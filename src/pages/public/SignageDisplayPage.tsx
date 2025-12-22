import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Monitor, Maximize, ImageOff, Info, Store, Volume2, AlertTriangle } from 'lucide-react';
import { usePublicSignage } from '@/hooks/usePublicSignage';
import { usePublicPasswordCalls } from '@/hooks/usePublicPasswordCalls';
import { PasswordCallDisplay } from '@/components/signage/PasswordCallDisplay';
import { PasswordCallHistory } from '@/components/signage/PasswordCallHistory';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Mapeia códigos de erro de vídeo para mensagens amigáveis
const VIDEO_ERROR_MESSAGES: Record<number, { title: string; cause: string; solution: string }> = {
  1: { title: 'Download interrompido', cause: 'O carregamento do vídeo foi cancelado', solution: 'Tente recarregar a página' },
  2: { title: 'Erro de rede', cause: 'Falha na conexão ao carregar o vídeo', solution: 'Verifique sua conexão de internet' },
  3: { title: 'Formato não suportado', cause: 'Codec incompatível (provavelmente HEVC/H.265)', solution: 'Exporte o vídeo em MP4 (H.264) ou WebM' },
  4: { title: 'Vídeo não suportado', cause: 'O formato do arquivo não é reconhecido', solution: 'Use MP4 (H.264) ou WebM' },
};

interface VideoError {
  code: number;
  message: string;
  src: string;
}

export default function SignageDisplayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { store, items, config, passwordCallConfig, loading, error } = usePublicSignage(slug);
  const { calls, latestCall, showPopup, closePopup } = usePublicPasswordCalls({ 
    storeId: store?.id || null, 
    config: passwordCallConfig 
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenButton, setShowFullscreenButton] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [zoomDirection, setZoomDirection] = useState<'in' | 'out'>('in');
  const [videoError, setVideoError] = useState<VideoError | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoRetryCount, setVideoRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ativar áudio (desbloqueia autoplay do navegador)
  const enableAudio = useCallback(() => {
    // Criar contexto de áudio para desbloquear
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContext.resume();
      
      // Pré-carregar vozes do Web Speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        // Falar texto vazio para "aquecer" o sistema
        const warmup = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(warmup);
      }
      
      setAudioEnabled(true);
      toast.success('Áudio ativado! As chamadas serão anunciadas.');
      console.log('[Signage] Áudio ativado pelo usuário');
    } catch (e) {
      console.error('[Signage] Erro ao ativar áudio:', e);
      toast.error('Erro ao ativar áudio');
    }
  }, []);

  const currentItem = items[currentIndex];
  const isVertical = config?.orientation === 'vertical';

  // Fullscreen handler
  const enterFullscreen = useCallback(async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        setShowFullscreenButton(false);
      }
    } catch (err) {
      console.log('Fullscreen não suportado:', err);
    }
  }, []);

  // Monitorar estado do fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setShowFullscreenButton(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide fullscreen button após alguns segundos
  useEffect(() => {
    if (!isFullscreen && showFullscreenButton) {
      const timer = setTimeout(() => {
        setShowFullscreenButton(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, showFullscreenButton]);

  // Mostrar botão ao mover o mouse
  const handleMouseMove = useCallback(() => {
    if (!isFullscreen) {
      setShowFullscreenButton(true);
    }
  }, [isFullscreen]);

  // Atualizar relógio
  useEffect(() => {
    if (!config?.show_clock) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [config?.show_clock]);

  // Limpar timeout de erro e retry quando mudar de item
  useEffect(() => {
    setVideoRetryCount(0);
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [currentIndex]);

  // Controlar transições - apenas para imagens
  // Vídeos usam o evento onEnded diretamente no elemento <video>
  useEffect(() => {
    if (items.length === 0 || !currentItem) return;

    // Limpar estado de erro anterior
    setVideoError(null);

    // Para vídeos, o controle é feito via onEnded no próprio elemento
    if (currentItem.file_type === 'video') {
      console.log('[Signage] 🎬 Iniciando carregamento de vídeo:', currentItem.title);
      console.log('[Signage] 📂 URL:', currentItem.file_url);
      setIsVideoLoading(true);
      
      // Timeout de carregamento - se não carregar em 10s, pula para próximo
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('[Signage] ⏰ Vídeo não carregou em 10s, pulando:', currentItem.title);
        setIsVideoLoading(false);
        goToNext();
      }, 10000);
      
      // Timeout de segurança máximo (5 minutos) caso o vídeo trave
      const maxTimeout = setTimeout(() => {
        console.warn('[Signage] ⚠️ Timeout de segurança - vídeo não terminou em 5 min:', currentItem.title);
        goToNext();
      }, 5 * 60 * 1000);

      return () => {
        clearTimeout(maxTimeout);
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    }

    // Para imagens, usar a duração definida
    setIsVideoLoading(false);
    console.log('[Signage] 🖼️ Exibindo imagem:', currentItem.title, 'por', currentItem.duration_seconds, 'segundos');
    const timer = setTimeout(goToNext, currentItem.duration_seconds * 1000);
    return () => clearTimeout(timer);
  }, [currentIndex, items, currentItem]);

  // Tentar dar play no vídeo quando carregar
  useEffect(() => {
    if (currentItem?.file_type === 'video' && videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
          console.log('[Signage] ▶️ Play iniciado com sucesso');
        } catch (err) {
          const error = err as Error;
          console.error('[Signage] ❌ Erro ao dar play:', error.name, error.message);
          if (error.name === 'NotAllowedError') {
            console.warn('[Signage] 🔇 Autoplay bloqueado pelo navegador - tente clicar na tela');
          }
        }
      };
      // Pequeno delay para garantir que o vídeo foi montado
      setTimeout(playVideo, 100);
    }
  }, [currentItem?.id]);

  const goToNext = useCallback(() => {
    // Limpar erro e loading ao avançar
    setVideoError(null);
    setIsVideoLoading(false);
    
    if (config?.transition_type !== 'none') {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
        setZoomDirection(prev => prev === 'in' ? 'out' : 'in');
        setIsTransitioning(false);
      }, config?.transition_duration_ms || 500);
    } else {
      setCurrentIndex(prev => (prev + 1) % items.length);
      setZoomDirection(prev => prev === 'in' ? 'out' : 'in');
    }
  }, [config?.transition_type, config?.transition_duration_ms, items.length]);

  // Handlers de vídeo
  const handleVideoLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    console.log('[Signage] 📊 Vídeo metadata carregado:', {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      readyState: video.readyState
    });
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    console.log('[Signage] ✅ Vídeo pronto para reprodução');
    setIsVideoLoading(false);
    // Limpar timeout de carregamento
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const mediaError = video.error;
    const errorCode = mediaError?.code || 0;
    const errorMessage = mediaError?.message || 'Erro desconhecido';
    
    console.error('[Signage] ❌ Erro no vídeo:', {
      code: errorCode,
      message: errorMessage,
      src: video.currentSrc,
      readyState: video.readyState,
      networkState: video.networkState,
      retryCount: videoRetryCount
    });

    // Se for erro de rede e ainda não tentou recarregar, tenta uma vez
    if (errorCode === 2 && videoRetryCount < 1) {
      console.log('[Signage] 🔄 Erro de rede, tentando recarregar...');
      setVideoRetryCount(prev => prev + 1);
      video.load();
      video.play().catch(() => {});
      return;
    }

    setIsVideoLoading(false);
    
    // Mostrar erro por 4 segundos antes de avançar
    setVideoError({
      code: errorCode,
      message: errorMessage,
      src: video.currentSrc
    });

    // Agendar avanço após exibir o erro
    errorTimeoutRef.current = setTimeout(() => {
      setVideoError(null);
      goToNext();
    }, 4000);
  }, [goToNext, videoRetryCount]);

  // Estados de loading e erro
  if (loading) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black"
        style={{ backgroundColor: config?.background_color || '#000000' }}
      >
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white max-w-md px-8">
          <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Loja Não Encontrada</h1>
          <p className="text-white/70">
            O painel "{slug}" não existe ou foi removido
          </p>
        </div>
      </div>
    );
  }

  if (!config?.is_enabled) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Painel Desativado</h1>
          <p className="text-white/70">Este painel não está ativo no momento</p>
        </div>
      </div>
    );
  }

  // Tela quando não há mídias cadastradas
  if (items.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center text-white max-w-lg px-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
            <ImageOff className="h-12 w-12 text-white/60" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">
            Nenhum conteúdo configurado
          </h1>
          
          <p className="text-white/70 mb-8">
            Este painel ainda não possui mídias para exibição
          </p>
          
          <div className="bg-white/10 rounded-xl p-6 text-left">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-400" />
              Como configurar:
            </h2>
            <ol className="space-y-3 text-white/80 text-sm">
              <li className="flex gap-3">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Acesse o painel administrativo da sua loja</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Vá em <strong>Marketing → Painel Digital</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Adicione imagens ou vídeos promocionais</span>
              </li>
            </ol>
          </div>
          
          <div className="mt-8 text-white/40 text-sm">
            {store.name}
          </div>
        </div>
      </div>
    );
  }

  // Estilos de transição
  const getTransitionStyle = () => {
    const duration = config?.transition_duration_ms || 500;
    
    switch (config?.transition_type) {
      case 'fade':
        return {
          opacity: isTransitioning ? 0 : 1,
          transition: `opacity ${duration}ms ease-in-out`
        };
      case 'slide':
        return {
          transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)',
          transition: `transform ${duration}ms ease-in-out`
        };
      default:
        return {};
    }
  };

  // Formatar hora
  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Classes de posição do relógio
  const getClockPositionClasses = () => {
    const position = config?.clock_position || 'right';
    
    if (isVertical) {
      // Em modo vertical, sempre centralizado no topo
      return 'top-8 left-1/2 -translate-x-1/2 text-center';
    }
    
    switch (position) {
      case 'left':
        return 'top-6 left-6 text-left';
      case 'center':
        return 'top-6 left-1/2 -translate-x-1/2 text-center';
      case 'right':
      default:
        return 'top-6 right-6 text-right';
    }
  };

  // Classes de tamanho do relógio
  const getClockSizeClasses = () => {
    const size = config?.clock_size || 'medium';
    
    switch (size) {
      case 'small':
        return { time: 'text-3xl', date: 'text-sm' };
      case 'large':
        return { time: isVertical ? 'text-8xl' : 'text-7xl', date: isVertical ? 'text-2xl' : 'text-xl' };
      case 'medium':
      default:
        return { time: isVertical ? 'text-6xl' : 'text-5xl', date: isVertical ? 'text-xl' : 'text-lg' };
    }
  };

  // Estilos baseados na orientação
  const containerStyle = {
    backgroundColor: config?.background_color || '#000000',
    aspectRatio: isVertical ? '9/16' : '16/9',
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden flex items-center justify-center bg-black"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
    >
      {/* Container com aspect ratio correto */}
      <div 
        className="relative w-full h-full max-w-full max-h-full"
        style={containerStyle}
      >
        {/* Conteúdo principal */}
        <div 
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={getTransitionStyle()}
        >
        {currentItem && (
            currentItem.file_type === 'video' ? (
              <>
              <video
                  ref={videoRef}
                  key={currentItem.id}
                  src={currentItem.file_url}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={!audioEnabled || !currentItem.has_audio}
                  playsInline
                  preload="auto"
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onCanPlay={handleVideoCanPlay}
                  onPlay={() => console.log('[Signage] ▶️ Vídeo iniciou:', currentItem.title, '| Áudio:', audioEnabled && currentItem.has_audio ? 'ON' : 'OFF')}
                  onEnded={() => {
                    console.log('[Signage] ✅ Vídeo terminou:', currentItem.title);
                    goToNext();
                  }}
                  onError={handleVideoError}
                />

                {/* Loading spinner para vídeo */}
                {isVideoLoading && !videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-3" />
                      <p className="text-lg font-medium">Carregando vídeo...</p>
                      <p className="text-sm text-white/70 mt-1">{currentItem.title}</p>
                    </div>
                  </div>
                )}

                {/* Overlay de erro de vídeo */}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 animate-fade-in">
                    <div className="text-center text-white max-w-md px-6">
                      <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-red-400" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        {VIDEO_ERROR_MESSAGES[videoError.code]?.title || 'Erro ao reproduzir vídeo'}
                      </h3>
                      <p className="text-white/70 mb-3">
                        {VIDEO_ERROR_MESSAGES[videoError.code]?.cause || videoError.message}
                      </p>
                      <div className="bg-white/10 rounded-lg p-3 text-sm">
                        <p className="text-orange-300 font-medium">
                          💡 {VIDEO_ERROR_MESSAGES[videoError.code]?.solution || 'Tente converter o vídeo para MP4 (H.264)'}
                        </p>
                      </div>
                      <p className="text-white/50 text-xs mt-4">
                        Avançando em alguns segundos...
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <img
                key={`${currentItem.id}-${zoomDirection}`}
                src={currentItem.file_url}
                alt={currentItem.title}
                className={`w-full h-full object-cover ${
                  zoomDirection === 'in' ? 'animate-ken-burns-in' : 'animate-ken-burns-out'
                }`}
                style={{ animationDuration: `${currentItem.duration_seconds}s` }}
              />
            )
          )}
        </div>

        {/* Relógio - posição e tamanho configuráveis */}
        {config?.show_clock && (
          <div className={`absolute drop-shadow-lg text-white ${getClockPositionClasses()}`}>
            <div className={`font-bold tracking-wider ${getClockSizeClasses().time}`}>
              {formatTime()}
            </div>
            <div className={`capitalize text-white/80 mt-1 ${getClockSizeClasses().date}`}>
              {formatDate()}
            </div>
          </div>
        )}

        {/* Indicador de slides */}
        <div className={`absolute flex gap-2 ${
          isVertical 
            ? 'bottom-12 left-1/2 -translate-x-1/2' 
            : 'bottom-6 left-1/2 -translate-x-1/2'
        }`}>
          {items.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Logo e nome da loja */}
        {store && (
          <div className={`absolute flex items-center gap-3 ${
            isVertical ? 'bottom-4 left-1/2 -translate-x-1/2' : 'bottom-6 left-6'
          }`}>
            {store.logo_url && (
              <img 
                src={store.logo_url} 
                alt={store.name} 
                className="h-10 w-10 rounded-lg object-cover shadow-lg"
              />
            )}
            <span className="text-white/80 text-sm font-medium drop-shadow-lg">
              {store.name}
            </span>
          </div>
        )}
      </div>

      {/* Histórico de Senhas */}
      <PasswordCallHistory 
        calls={calls} 
        config={passwordCallConfig} 
        latestCallId={latestCall?.id}
      />

      {/* Pop-up de Chamada de Senha */}
      <PasswordCallDisplay 
        call={latestCall} 
        config={passwordCallConfig} 
        show={showPopup}
        storeId={store?.id}
      />

      {/* Botões de controle */}
      {showFullscreenButton && !isFullscreen && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in flex gap-2">
          {/* Botão Ativar Som - só aparece se som está habilitado nas configs e ainda não foi ativado */}
          {passwordCallConfig?.sound_enabled && !audioEnabled && (
            <Button 
              onClick={enableAudio}
              size="lg"
              className="bg-orange-500/90 hover:bg-orange-600 backdrop-blur-sm text-white border border-orange-400/50"
            >
              <Volume2 className="h-5 w-5 mr-2" />
              Ativar Som
            </Button>
          )}
          
          <Button 
            onClick={enterFullscreen}
            size="lg"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30"
          >
            <Maximize className="h-5 w-5 mr-2" />
            Tela Cheia
          </Button>
        </div>
      )}
    </div>
  );
}
