import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Smile, Paperclip, FileUp, Mic, Bold, Italic, Code } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ChatInputProps {
  onSend: (content: string) => void;
  sending: boolean;
}

/**
 * Converte HTML do Tiptap para formatação WhatsApp:
 * <strong> → *texto*
 * <em> → _texto_
 * <code> → ```texto```
 */
function htmlToWhatsApp(html: string): string {
  let text = html;

  // Negrito
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '*$1*');
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '*$1*');

  // Itálico
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '_$1_');
  text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '_$1_');

  // Código
  text = text.replace(/<code>([\s\S]*?)<\/code>/gi, '```$1```');

  // Parágrafos e quebras de linha
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n');
  text = text.replace(/<\/?p[^>]*>/gi, '');

  // Remover tags restantes
  text = text.replace(/<[^>]+>/g, '');

  // Decodificar entidades HTML
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');

  return text.trim();
}

// Emojis populares organizados por categoria
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

export function ChatInput({ onSend, sending }: ChatInputProps) {
  const [isEmpty, setIsEmpty] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);

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

  const handleSubmit = useCallback(() => {
    if (!editor || sending) return;
    const html = editor.getHTML();
    const text = htmlToWhatsApp(html);
    if (!text.trim()) return;
    onSend(text);
    editor.commands.clearContent();
  }, [editor, sending, onSend]);

  const insertEmoji = useCallback((emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setEmojiOpen(false);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border-t border-border bg-background">
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
          <ActionButton title="Anexar arquivo" disabled>
            <Paperclip className="w-4 h-4" />
          </ActionButton>
          <ActionButton title="Enviar documento" disabled>
            <FileUp className="w-4 h-4" />
          </ActionButton>
          <ActionButton title="Gravar áudio" disabled>
            <Mic className="w-4 h-4" />
          </ActionButton>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={sending || isEmpty}
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

/** Botão de formatação da toolbar */
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

/** Botão de ação (anexo, etc.) */
function ActionButton({
  title,
  children,
  disabled,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
