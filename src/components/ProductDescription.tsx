import { cn } from '@/lib/utils';

interface ProductDescriptionProps {
  description: string;
  className?: string;
}

/**
 * Renderiza a descrição do produto, suportando tanto texto simples quanto HTML formatado.
 * Detecta automaticamente se o conteúdo contém tags HTML.
 */
export function ProductDescription({ description, className }: ProductDescriptionProps) {
  const isHtml = /<[a-z][\s\S]*>/i.test(description);

  if (isHtml) {
    return (
      <div
        className={cn('prose prose-sm max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }

  return <p className={className}>{description}</p>;
}
