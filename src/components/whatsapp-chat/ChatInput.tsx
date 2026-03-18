import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Smile, Paperclip, Image, FileText, Mic, MicOff, Bold, Italic, Code, X, Reply, Package, ShoppingCart, Square, MapPin, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChatMessage } from '@/pages/admin/WhatsAppChatPage';

interface ChatInputProps {
  onSend: (content: string) => void;
  onSendMedia?: (file: File, caption: string) => void;
  onSendLocation?: () => void;
  onOpenPaymentRequest?: () => void;
  onOpenProductSearch?: () => void;
  onOpenCart?: () => void;
  cartItemCount?: number;
  cartTotal?: number;
  sending: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
  storeId?: string;
  remoteJid?: string;
  onTypingChange?: (isTyping: boolean) => void;
  prefillMessage?: string | null;
}

function wrapSelection(textarea: HTMLTextAreaElement, prefix: string, suffix: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);
  const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
  textarea.value = newText;
  textarea.selectionStart = start + prefix.length;
  textarea.selectionEnd = end + prefix.length;
  textarea.focus();
  // Trigger change event
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

const EMOJI_CATEGORIES = [
  {
    name: '😀 Rostos',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','😐','😑','😶','😏','😒','🙄','😬','😮‍💨','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐']
  },
  {
    name: '👋 Gestos',
    emojis: ['👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤏']
  },
  {
    name: '❤️ Símbolos',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','✨','⭐','🌟','💫','🔥','💯','✅','❌','⚠️','🚀','💰','🎉','🎊']
  },
  {
    name: '🍕 Comida',
    emojis: ['🍕','🍔','🍟','🌭','🍿','🧂','🥗','🍱','🍣','🍙','🍘','🍥','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍩','🍪','☕','🍵','🧃','🥤','🍺','🍻']
  },
];

const MAX_FILE_SIZE = 16 * 1024 * 1024;

const ACCEPTED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/3gpp'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/mp4'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'],
};

function getMediaType(mimeType: string): string {
  for (const [type, mimes] of Object.entries(ACCEPTED_TYPES)) {
    if (mimes.includes(mimeType)) return type;
  }
  return 'document';
}

export function ChatInput({ onSend, onSendMedia, onSendLocation, onOpenPaymentRequest, onOpenProductSearch, onOpenCart, cartItemCount = 0, cartTotal = 0, sending, replyingTo, onCancelReply, storeId, remoteJid, onTypingChange, prefillMessage }: ChatInputProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  const [text, setText] = useState('');
  const prefillAppliedRef = useRef<string | null>(null);
  
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const presenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  // Prefill message (ex: interesse do cliente vindo do alerta de triagem)
  useEffect(() => {
    if (prefillMessage && prefillMessage !== prefillAppliedRef.current) {
      setText(prefillMessage);
      prefillAppliedRef.current = prefillMessage;
      // Focus no textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [prefillMessage]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm',
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) {
          toast.error('Áudio muito curto');
          setIsRecording(false);
          setRecordingTime(0);
          return;
        }

        const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        
        if (onSendMedia) {
          if (storeId && remoteJid) {
            supabase.functions.invoke('whatsapp-chat-send', {
              body: { storeId, remoteJid, messageType: 'presence', presence: 'paused' },
            }).catch(() => {});
          }
          onSendMedia(file, '');
        }

        setIsRecording(false);
        setRecordingTime(0);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      if (storeId && remoteJid) {
        supabase.functions.invoke('whatsapp-chat-send', {
          body: { storeId, remoteJid, messageType: 'presence', presence: 'recording' },
        }).catch(() => {});
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, [onSendMedia, storeId, remoteJid]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Enviar presença de digitação (debounced)
  const sendPresence = useCallback((type: 'composing' | 'paused') => {
    if (!storeId || !remoteJid) return;
    supabase.functions.invoke('whatsapp-chat-send', {
      body: { storeId, remoteJid, messageType: 'presence', presence: type, presenceDelay: 15000 },
    }).catch(() => {});
  }, [storeId, remoteJid]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Enviar presença de digitação
    if (newText.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange?.(true);
      sendPresence('composing');
    }
    // Reset timer para parar presença após 10s sem digitar
    if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current);
    presenceTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingChange?.(false);
        sendPresence('paused');
      }
    }, 10000);
  }, [onTypingChange, sendPresence]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmit = useCallback(() => {
    if (sending) return;

    // Cancelar presença ao enviar
    if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange?.(false);
      sendPresence('paused');
    }

    if (selectedFile && onSendMedia) {
      onSendMedia(selectedFile, text.trim());
      clearFileSelection();
      setText('');
      return;
    }

    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }, [text, sending, onSend, onSendMedia, selectedFile, onTypingChange, sendPresence]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        if (textareaRef.current) wrapSelection(textareaRef.current, '*', '*');
      } else if (e.key === 'i') {
        e.preventDefault();
        if (textareaRef.current) wrapSelection(textareaRef.current, '_', '_');
      }
    }
  }, [handleSubmit]);

  const insertEmoji = useCallback((emoji: string) => {
    setText(prev => prev + emoji);
    setEmojiOpen(false);
    textareaRef.current?.focus();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo: 16MB');
      return;
    }

    setSelectedFile(file);
    setAttachOpen(false);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    e.target.value = '';
  }, []);

  const clearFileSelection = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
  }, []);

  const getReplyTypeIcon = (type?: string) => {
    switch (type) {
      case 'image': return '📷 ';
      case 'video': return '🎥 ';
      case 'audio': return '🎵 ';
      case 'document': return '📄 ';
      default: return '';
    }
  };

  // Recording UI
  if (isRecording) {
    return (
      <div className="border-t border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={cancelRecording}
              className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
              title="Cancelar gravação"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">
                {formatRecordingTime(recordingTime)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Gravando áudio...</span>
          </div>
          <Button
            onClick={stopRecording}
            size="sm"
            className="gap-1.5 rounded-lg"
          >
            <Square className="w-3 h-3" />
            Enviar
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-background">

      {/* Preview de resposta */}
      {replyingTo && (
        <div className="px-3 pt-2 flex items-start gap-2 bg-muted/30 border-b border-border/50">
          <Reply className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0 border-l-2 border-primary pl-2 py-1">
            <p className="text-xs font-semibold text-primary">
              {replyingTo.sender_name || (replyingTo.direction === 'outgoing' ? 'Você' : 'Cliente')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getReplyTypeIcon(replyingTo.message_type)}
              {replyingTo.content || '[mídia]'}
            </p>
          </div>
          <button onClick={onCancelReply} className="p-1 rounded-full hover:bg-muted flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview do arquivo selecionado */}
      {selectedFile && (
        <div className="px-3 pt-2 flex items-center gap-3 bg-muted/30">
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
          ) : (
            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selectedFile.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(0)} KB • {getMediaType(selectedFile.type)}
            </p>
          </div>
          <button onClick={clearFileSelection} className="p-1 rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de formatação */}
      <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 border-b border-border/50">
        <FormatButton
          active={false}
          onClick={() => textareaRef.current && wrapSelection(textareaRef.current, '*', '*')}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </FormatButton>
        <FormatButton
          active={false}
          onClick={() => textareaRef.current && wrapSelection(textareaRef.current, '_', '_')}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </FormatButton>
        <FormatButton
          active={false}
          onClick={() => textareaRef.current && wrapSelection(textareaRef.current, '```', '```')}
          title="Código"
        >
          <Code className="w-4 h-4" />
        </FormatButton>
      </div>

      {/* Textarea */}
      <div className="relative min-h-[40px]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem... ( / = Resposta Rápida)"
          className="w-full resize-none bg-transparent px-3 py-2 text-sm focus:outline-none min-h-[36px] max-h-[120px] overflow-y-auto"
          rows={1}
          autoCapitalize="sentences"
        />
      </div>

      {/* Barra inferior com ações e botão enviar */}
      <div className="flex items-center justify-between px-3 pb-2 pt-1">
        <div className="flex items-center gap-1">
          {/* Emoji picker */}
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Emoji"
                className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Smile className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-[320px] p-2 max-h-[280px] overflow-y-auto"
            >
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.name} className="mb-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 px-1">{cat.name}</p>
                  <div className="flex flex-wrap gap-0.5">
                    {cat.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </PopoverContent>
          </Popover>

          {/* Anexar mídia */}
          <Popover open={attachOpen} onOpenChange={setAttachOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Anexar arquivo"
                className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-48 p-1">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                onClick={() => {
                  imageInputRef.current?.click();
                  setAttachOpen(false);
                }}
              >
                <Image className="w-4 h-4 text-primary" />
                Foto / Imagem
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                onClick={() => {
                  fileInputRef.current?.click();
                  setAttachOpen(false);
                }}
              >
                <FileText className="w-4 h-4 text-primary" />
                Documento
              </button>
              {onSendLocation && (
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                  onClick={() => {
                    onSendLocation();
                    setAttachOpen(false);
                  }}
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  Localização da loja
                </button>
              )}
            </PopoverContent>
          </Popover>

          {/* Solicitar pagamento */}
          {onOpenPaymentRequest && (
            <button
              type="button"
              title="Solicitar pagamento"
              onClick={onOpenPaymentRequest}
              className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}

          {/* Buscar produto */}
          {onOpenProductSearch && (
            <button
              type="button"
              title="Buscar produto"
              onClick={onOpenProductSearch}
              className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Package className="w-4 h-4" />
            </button>
          )}

          {/* Carrinho */}
          {onOpenCart && (
            <button
              type="button"
              title="Carrinho de compras"
              onClick={onOpenCart}
              className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground relative flex items-center gap-1.5"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </div>
              {cartTotal > 0 && (
                <span className="text-xs font-semibold text-primary">
                  {formatPrice(cartTotal)}
                </span>
              )}
            </button>
          )}

          {/* Gravar áudio */}
          <button
            type="button"
            title="Gravar áudio"
            onClick={startRecording}
            disabled={sending}
            className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Inputs de arquivo ocultos */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={sending || (!text.trim() && !selectedFile)}
          size="sm"
          className="gap-1.5 rounded-lg"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Enviar
              <Send className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function FormatButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-colors hover:bg-muted',
        active && 'bg-muted text-primary'
      )}
    >
      {children}
    </button>
  );
}
