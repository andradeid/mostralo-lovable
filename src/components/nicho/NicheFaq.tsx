import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { renderRich } from './RichText';
import type { FaqNode } from './types';

/** Perguntas frequentes: acordeão (molde delivery) ou cards clicáveis (molde agendamento). */
export const NicheFaq = ({ node }: { node: FaqNode }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (index: number) => setOpenIndex(openIndex === index ? null : index);

  if (node.variant === 'accordion') {
    const prefix = node.valuePrefix ?? 'item-';
    const start = node.valueStart ?? 0;
    const inner = node.triggerInner;
    return (
      <Accordion type="single" collapsible {...(node.className !== undefined ? { className: node.className } : {})}>
        {node.items.map((item, index) => {
          const Icon = item.icon;
          return (
            <AccordionItem key={index} value={`${prefix}${index + start}`} className={node.itemClassName}>
              <AccordionTrigger className={node.triggerClassName}>
                {inner?.as === 'div' ? (
                  <div className={inner.className}>
                    {Icon && <Icon className={inner.iconClassName} />}
                    {renderRich(item.q)}
                  </div>
                ) : inner?.as === 'span' ? (
                  <span className={inner.className}>{renderRich(item.q)}</span>
                ) : (
                  renderRich(item.q)
                )}
              </AccordionTrigger>
              <AccordionContent className={node.contentClassName}>{renderRich(item.a)}</AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  }

  if (node.variant === 'toggle-button') {
    return (
      <div className={node.className}>
        {node.items.map((item, index) => (
          <Card key={index} className={node.cardClassName}>
            <button onClick={() => toggle(index)} className={node.buttonClassName}>
              <span className={node.questionClassName}>{renderRich(item.q)}</span>
              {openIndex === index ? (
                <ChevronUp className={node.openIconClassName} />
              ) : (
                <ChevronDown className={node.closedIconClassName} />
              )}
            </button>
            {openIndex === index && (
              <div className={node.answerWrapClassName}>
                <p className={node.answerClassName}>{renderRich(item.a)}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={node.className}>
      {node.items.map((item, index) => (
        <Card key={index} className={node.cardClassName} onClick={() => toggle(index)}>
          <CardContent className={node.contentClassName}>
            <div className={node.rowClassName}>
              <h3 className={node.questionClassName}>{renderRich(item.q)}</h3>
              {openIndex === index ? (
                <ChevronUp className={node.openIconClassName} />
              ) : (
                <ChevronDown className={node.closedIconClassName} />
              )}
            </div>
            {openIndex === index && <p className={node.answerClassName}>{renderRich(item.a)}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
