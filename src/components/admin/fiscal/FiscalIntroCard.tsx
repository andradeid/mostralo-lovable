// Topo da tela fiscal: o que o lojista precisa, em linguagem simples, e o que ainda falta.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';
import type { ReadinessItem } from '@/lib/fiscal/settingsForm';
import { EnvironmentBadge } from './FiscalStatusBadge';

export function FiscalIntroCard({ items, environment }: { items: ReadinessItem[]; environment: 'homologacao' | 'producao' }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Nota fiscal</CardTitle>
          <EnvironmentBadge environment={environment} />
        </div>
        <CardDescription>
          Emita o cupom fiscal (NFC-e) no PDV e a NF-e dos pedidos direto pelo Mostralo, usando a Focus NFe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1">
          <p className="font-medium">O que você precisa ter (o contador ajuda):</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><b>CNPJ com inscrição estadual ativa (no DF, o CF/DF)</b> e credenciamento na SEFAZ para emitir NFC-e e/ou NF-e.</li>
            <li><b>Certificado digital A1</b> (arquivo .pfx da empresa, com a senha). Fica guardado na Focus, não no Mostralo.</li>
            <li><b>CSC da NFC-e</b>: um código que você gera no site da SEFAZ do seu estado (um de teste e um de produção).</li>
            <li><b>Dados fiscais dos produtos</b> (NCM, CFOP e impostos) conferidos pelo contador.</li>
          </ul>
        </div>
        <div className="space-y-1">
          <p className="font-medium">Situação</p>
          <ul className="space-y-1">
            {items.map((i) => (
              <li key={i.key} className="flex items-start gap-2">
                {i.done ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" /> : <Circle className="h-4 w-4 mt-0.5 text-muted-foreground" />}
                <span>
                  {i.label}
                  {!i.done && <span className="block text-xs text-muted-foreground">{i.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
