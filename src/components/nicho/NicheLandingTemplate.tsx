import { useEffect } from 'react';
import { usePageSEO } from '@/hooks/useSEO';
import { NicheNodes } from './NicheRenderer';
import type { NicheContent } from './types';

/**
 * Template das páginas de nicho (/nicho-*), dos dois moldes:
 * - delivery (pizzarias, hamburguerias, açaiterias...): hero, problema, recursos, fluxo, calculadora,
 *   depoimentos, planos, FAQ e rodapé;
 * - agendamento (barbearias, nail designers, pet shops, arenas): hero, dores, pilares, clube de
 *   assinaturas, simuladores (trechos próprios em `custom/`), planos, FAQ e rodapé.
 * O conteúdo de cada página está em `src/content/nichos/<slug>.ts`.
 */
export const NicheLandingTemplate = ({ content }: { content: NicheContent }) => {
  usePageSEO(content.seo);

  useEffect(() => {
    if (content.scrollToTop) window.scrollTo(0, 0);
  }, [content.scrollToTop]);

  return (
    <div className={content.pageClassName}>
      <NicheNodes nodes={content.sections} />
    </div>
  );
};

export default NicheLandingTemplate;
