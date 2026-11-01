// Exibição de comprovantes guardados em bucket privado (link assinado gerado na hora).
import { forwardRef, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, FileText, Loader2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { isImageFile } from '@/lib/privateFiles';
import { openPrivateFile, useSignedUrl } from '@/hooks/useSignedUrl';
import { cn } from '@/lib/utils';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  value: string | null | undefined;
  bucket: string;
};

/**
 * Link "ver comprovante": só gera o link assinado no clique (listas grandes não disparam
 * dezenas de pedidos). Funciona com <Button asChild>.
 */
export const PrivateFileLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ value, bucket, children, onClick, className, ...rest }, ref) => {
    const [opening, setOpening] = useState(false);

    const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      onClick?.(e);
      if (opening) return;
      setOpening(true);
      const ok = await openPrivateFile(value, bucket);
      setOpening(false);
      if (!ok) toast.error('Não foi possível abrir o comprovante. Tente de novo.');
    };

    return (
      <a
        ref={ref}
        href="#"
        role="button"
        aria-busy={opening}
        onClick={handleClick}
        className={cn(opening && 'pointer-events-none opacity-70', className)}
        {...rest}
      >
        {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
      </a>
    );
  },
);
PrivateFileLink.displayName = 'PrivateFileLink';

interface PreviewProps {
  value: string | null | undefined;
  bucket: string;
  alt?: string;
  imageClassName?: string;
  /** Texto do arquivo que não é imagem (PDF etc.). */
  documentLabel?: string;
  /** Botão de abrir: só para documento (padrão), sempre (abaixo da prévia) ou nunca. */
  openButton?: 'document' | 'always' | 'none';
}

/** Prévia do comprovante: imagem, ícone de documento com link, ou o texto gravado (ex.: PIX confirmado). */
export function PrivateFilePreview({
  value,
  bucket,
  alt = 'Comprovante',
  imageClassName = 'max-w-full h-auto rounded-lg',
  documentLabel = 'Arquivo PDF ou documento',
  openButton = 'document',
}: PreviewProps) {
  const { url, loading, error, isFile, retry } = useSignedUrl(value, bucket);

  if (!value) return null;

  if (!isFile) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <p className="text-sm text-muted-foreground max-w-md">{value}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Carregando comprovante...
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar o comprovante.</p>
        <Button variant="outline" size="sm" onClick={retry} className="gap-2">
          <RotateCw className="w-4 h-4" />
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {isImageFile(value) ? (
        <img src={url} alt={alt} className={imageClassName} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <FileText className="w-16 h-16 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{documentLabel}</p>
          {openButton === 'document' && (
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Abrir
              </a>
            </Button>
          )}
        </div>
      )}
      {openButton === 'always' && (
        <Button variant="outline" size="sm" asChild className="gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            Abrir em nova aba
          </a>
        </Button>
      )}
    </div>
  );
}
