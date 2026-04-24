import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface BookingEmbedSnippetProps {
  storeSlug: string;
}

export function BookingEmbedSnippet({ storeSlug }: BookingEmbedSnippetProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://mostralo.me';

  const publicUrl = `${baseUrl}/agendar/${storeSlug || 'SEU-SLUG'}`;
  const embedUrl = `${publicUrl}?embed=1`;

  const snippet = `<iframe
  src="${embedUrl}"
  width="100%"
  height="900"
  frameborder="0"
  style="border:0;border-radius:12px;max-width:900px;display:block;margin:0 auto"
  title="Agendamento online"
></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold">Embed no seu site</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Copie e cole o código abaixo no HTML do seu site para integrar a página de agendamento.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Link público</Label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-background border rounded px-2 py-1.5 truncate">
            {publicUrl}
          </code>
          <Button asChild variant="outline" size="sm">
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Código HTML (iframe)</Label>
        <Textarea
          readOnly
          value={snippet}
          className="font-mono text-xs h-32 resize-none"
        />
        <Button onClick={handleCopy} size="sm" variant="secondary" className="w-full">
          {copied ? <Check className="h-3.5 w-3.5 mr-2" /> : <Copy className="h-3.5 w-3.5 mr-2" />}
          {copied ? 'Copiado!' : 'Copiar código'}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        💡 O parâmetro <code>?embed=1</code> esconde o cabeçalho da loja para um encaixe limpo no seu site.
      </p>
    </div>
  );
}
