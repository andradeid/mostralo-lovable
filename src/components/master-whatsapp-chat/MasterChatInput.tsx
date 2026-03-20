import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Smile, Paperclip, Image, FileText, Mic, Bold, Italic, Code, X, Reply, Square, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChatMessage } from '@/pages/admin/WhatsAppChatPage';

interface MasterChatInputProps {
  onSend: (content: string) => void;
  onSendMedia?: (file: File, caption: string) => void;
  onRequestPayment?: () => void;
  sending: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
  remoteJid?: string;
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

function FormatButton({ children, onClick, title, active }: { children: React.ReactNode; onClick: () => void; title: string; active: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

export function MasterChatInput({ onSend, onSendMedia, onRequestPayment, sending, replyingTo, onCancelReply, remoteJid }: MasterChatInputProps) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Audio recording
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

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
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
        if (onSendMedia) onSendMedia(file, '');
        setIsRecording(false);
        setRecordingTime(0);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch {
      toast.error('Não foi possível acessar o microfone.');
    }
  }, [onSendMedia]);

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

  const handleSubmit = useCallback(() => {
    if (sending) return;
    if (selectedFile && onSendMedia) {
      onSendMedia(selectedFile, text.trim());
      setSelectedFile(null);
      setFilePreview(null);
      setText('');
      return;
    }
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }, [text, sending, onSend, onSendMedia, selectedFile]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); if (textareaRef.current) wrapSelection(textareaRef.current, '*', '*'); }
      else if (e.key === 'i') { e.preventDefault(); if (textareaRef.current) wrapSelection(textareaRef.current, '_', '_'); }
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
    if (file.size > MAX_FILE_SIZE) { toast.error('Arquivo muito grande. Máximo: 16MB'); return; }
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

  const getMediaType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  useEffect(() => {
    if (replyingTo && textareaRef.current) textareaRef.current.focus();
  }, [replyingTo]);

  // Recording UI
  if (isRecording) {
    return (
      <div className="border-t border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={cancelRecording} className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors" title="Cancelar gravação">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">{formatRecordingTime(recordingTime)}</span>
            </div>
            <span className="text-xs text-muted-foreground">Gravando áudio...</span>
          </div>
          <Button onClick={stopRecording} size="sm" className="gap-1.5 rounded-lg">
            <Square className="w-3 h-3" /> Enviar <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border/60 bg-background/95 backdrop-blur-sm">

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
      <div className="relative min-h-[44px] px-3 py-1.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="w-full resize-none bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[40px] max-h-[120px] overflow-y-auto border border-border/40 transition-all duration-200 placeholder:text-muted-foreground/50"
          rows={1}
          autoCapitalize="sentences"
        />
      </div>

      {/* Barra inferior com ações e botão enviar */}
      <div className="flex items-center justify-between px-3 pb-2 pt-1">
        <div className="flex items-center gap-1">
          {/* Emoji */}
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <Smile className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-2" align="start" side="top">
              <div className="max-h-[250px] overflow-y-auto space-y-3">
                {EMOJI_CATEGORIES.map(category => (
                  <div key={category.name}>
                    <p className="text-xs font-medium text-muted-foreground mb-1 px-1">{category.name}</p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {category.emojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="p-1 text-lg hover:bg-muted rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Attach */}
          <Popover open={attachOpen} onOpenChange={setAttachOpen}>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start" side="top">
              <button onClick={() => { imageInputRef.current?.click(); setAttachOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded transition-colors">
                <Image className="w-4 h-4 text-primary" /> Imagem
              </button>
              <button onClick={() => { fileInputRef.current?.click(); setAttachOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded transition-colors">
                <FileText className="w-4 h-4 text-primary" /> Documento
              </button>
            </PopoverContent>
          </Popover>

          {/* Mic */}
          <button onClick={startRecording} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Gravar áudio">
            <Mic className="w-5 h-5" />
          </button>

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={handleFileSelect} />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={sending || (!text.trim() && !selectedFile)}
          size="sm"
          className="gap-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar
        </Button>
      </div>
    </div>
  );
}
