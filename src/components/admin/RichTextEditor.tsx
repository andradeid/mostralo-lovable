import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Palette, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRef, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const COLORS = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html === '<br>' || html === '<div><br></div>' ? '' : html);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html === '<br>' || html === '<div><br></div>' ? '' : html);
    }
  }, [onChange]);

  const isActive = useCallback((command: string) => {
    return document.queryCommandState(command);
  }, []);

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      className="h-7 w-7 p-0"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-muted/30 flex-wrap">
        <ToolbarButton
          onClick={() => execCommand('bold')}
          isActive={isActive('bold')}
          title="Negrito"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('italic')}
          isActive={isActive('italic')}
          title="Itálico"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('underline')}
          isActive={isActive('underline')}
          title="Sublinhado"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => execCommand('insertUnorderedList')}
          isActive={isActive('insertUnorderedList')}
          title="Lista com marcadores"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('insertOrderedList')}
          isActive={isActive('insertOrderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Cor do texto"
            >
              <Palette className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-6 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => execCommand('foreColor', color)}
                  title={color}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-xs h-6"
              onClick={() => execCommand('removeFormat')}
            >
              Remover cor
            </Button>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => execCommand('undo')}
          title="Desfazer"
        >
          <Undo className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('redo')}
          title="Refazer"
        >
          <Redo className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2 text-sm"
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
    </div>
  );
}
