import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Smile, Paperclip, FileUp, Mic, Bold, Italic, Link, Code, List, ListOrdered } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string) => void;
  sending: boolean;
}

/**
 * Converte HTML do Tiptap para formatação WhatsApp:
 * <strong> → *texto*
 * <em> → _texto_
 * <code> → ```texto```
 * <a href> → link
 * <li> → • item
 */
function htmlToWhatsApp(html: string): string {
  let text = html;

  // Listas ordenadas
  let olCounter = 0;
  text = text.replace(/<ol[^>]*>/gi, () => { olCounter = 0; return ''; });
  text = text.replace(/<\/ol>/gi, '');
  text = text.replace(/<li>([\s\S]*?)<\/li>/gi, (_, content) => {
    olCounter++;
    // Verificar se está dentro de ol ou ul pelo contexto
    return `${content.trim()}\n`;
  });

  // Listas não ordenadas
  text = text.replace(/<ul[^>]*>/gi, '');
  text = text.replace(/<\/ul>/gi, '');

  // Negrito
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '*$1*');
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '*$1*');

  // Itálico
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '_$1_');
  text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '_$1_');

  // Código
  text = text.replace(/<code>([\s\S]*?)<\/code>/gi, '```$1```');

  // Links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$1');

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

export function ChatInput({ onSend, sending }: ChatInputProps) {
  const [isEmpty, setIsEmpty] = useState(true);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
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
        style: 'text-transform: capitalize-first;',
        autocapitalize: 'sentences',
      },
      handleTextInput: (view, from, _to, text) => {
        // Auto-capitalizar primeira letra de cada frase
        const { state } = view;
        const $pos = state.doc.resolve(from);
        const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
        
        // Se é o início do parágrafo ou após ponto/exclamação/interrogação + espaço
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

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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
          active={editor.isActive('link')}
          onClick={setLink}
          title="Inserir link"
        >
          <Link className="w-4 h-4" />
        </FormatButton>
        <FormatButton
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Código"
        >
          <Code className="w-4 h-4" />
        </FormatButton>
        <FormatButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </FormatButton>
        <FormatButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </FormatButton>
      </div>

      {/* Editor de texto */}
      <div className="relative min-h-[40px]">
        <EditorContent editor={editor} />
      </div>

      {/* Barra inferior com ações e botão enviar */}
      <div className="flex items-center justify-between px-3 pb-2 pt-1">
        <div className="flex items-center gap-1">
          <ActionButton title="Emoji" disabled>
            <Smile className="w-4 h-4" />
          </ActionButton>
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
          disabled={sending || (editor?.isEmpty ?? true)}
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

/** Botão de ação (emoji, anexo, etc.) */
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
