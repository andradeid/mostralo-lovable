import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Smile, Paperclip, Image, FileText, Mic, Bold, Italic, Code, X, Reply } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChatMessage } from '@/pages/admin/WhatsAppChatPage';

interface ChatInputProps {
  onSend: (content: string) => void;
  onSendMedia?: (file: File, caption: string) => void;
  sending: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

function htmlToWhatsApp(html: string): string {
  let text = html;
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '*$1*');
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '*$1*');
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '_$1_');
  text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '_$1_');
  text = text.replace(/<code>([\s\S]*?)<\/code>/gi, '```$1```');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n');
  text = text.replace(/<\/?p[^>]*>/gi, '');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');
  return text.trim();
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

export function ChatInput({ onSend, onSendMedia, sending, replyingTo, onCancelReply }: ChatInputProps) {
  const [isEmpty, setIsEmpty] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Shift + enter para nova linha. Digite '/' para Resposta Rápida.",
      }),
    ],
    content: '',
    onUpdate: ({ editor: e }) => {
      setIsEmpty(e.isEmpty);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[36px] max-h-[120px] overflow-y-auto px-3 py-2 text-sm',
        autocapitalize: 'sentences',
      },
      handleTextInput: (view, from, _to, text) => {
        const { state } = view;
        const $pos = state.doc.resolve(from);
        const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
        if (textBefore.length === 0 || /[.!?]\s*$/.test(textBefore)) {
          if (text.length === 1 && text !== text.toUpperCase() && /[a-záàâãéèêíïóôõöúç]/i.test(text)) {
            const tr = state.tr.insertText(text.toUpperCase(), from, from);
            view.dispatch(tr);
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSubmit();
          return true;
        }
        return false;
      },
    },
  });

  // Focus editor when replying
  useEffect(() => {
    if (replyingTo && editor) {
      editor.commands.focus();
    }
  }, [replyingTo, editor]);

  const handleSubmit = useCallback(() => {
    if (sending) return;

    if (selectedFile && onSendMedia) {
      const caption = editor ? htmlToWhatsApp(editor.getHTML()) : '';
      onSendMedia(selectedFile, caption);
      clearFileSelection();
      editor?.commands.clearContent();
      return;
    }

    if (!editor) return;
    const html = editor.getHTML();
    const text = htmlToWhatsApp(html);
    if (!text.trim()) return;
    onSend(text);
    editor.commands.clearContent();
  }, [editor, sending, onSend, onSendMedia, selectedFile]);

  const insertEmoji = useCallback((emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setEmojiOpen(false);
  }, [editor]);

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

  if (!editor) return null;

  const getReplyTypeIcon = (type?: string) => {
    switch (type) {
      case 'image': return '📷 ';
      case 'video': return '🎥 ';
      case 'audio': return '🎵 ';
      case 'document': return '📄 ';
      default: return '';
    }
  };

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
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </FormatButton>
        <FormatButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </FormatButton>
        <FormatButton
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Código"
        >
          <Code className="w-4 h-4" />
        </FormatButton>
      </div>

      {/* Editor de texto */}
      <div className="relative min-h-[40px]">
        <EditorContent editor={editor} />
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
            </PopoverContent>
          </Popover>

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
          disabled={sending || (isEmpty && !selectedFile)}
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
