import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Database, 
  Activity, 
  MessageSquare, 
  Users,
  BookOpen,
  Zap,
  Clock,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface PromptCardProps {
  title: string;
  prompt: string;
  description: string;
}

const PromptCard = ({ title, prompt, description }: PromptCardProps) => {
  const copy = () => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copiado!");
  };
  
  return (
    <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
          <Copy className="h-3.5 w-3.5 mr-1" />
          Copiar
        </Button>
      </div>
      <pre className="text-xs bg-background border rounded p-2 whitespace-pre-wrap font-mono">{prompt}</pre>
    </div>
  );
};

export const DiagnosticGuideCard = () => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <strong>Como usar este guia:</strong> Quando o sistema travar ou ficar lento, 
          identifique o sintoma abaixo e copie o prompt correspondente para me enviar no chat. 
          Quanto mais informação você incluir, mais rápido eu diagnostico.
        </AlertDescription>
      </Alert>

      {/* Sintomas Comuns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Sintomas Comuns e O Que Significam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="travamento">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Crítico</Badge>
                  Sistema travado / páginas não carregam
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><strong>Causa provável:</strong> Pool de conexões Postgres saturado.</p>
                <p><strong>Verifique no monitoramento:</strong> Aba "Monitoramento" → card "Conexões Postgres". Se estiver acima de 80%, é isso.</p>
                <p><strong>Ação imediata:</strong> Feche abas duplicadas do dashboard. Aguarde 30s.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lento">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500">Atenção</Badge>
                  Sistema lento mas funcionando
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><strong>Causa provável:</strong> Queries lentas ou alto volume de webhooks.</p>
                <p><strong>Verifique:</strong> Card "Top Tables" e "Webhooks UaZapi" no monitoramento.</p>
                <p><strong>Ação:</strong> Use o prompt "Análise de queries lentas" abaixo.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="whatsapp">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">Específico</Badge>
                  WhatsApp não recebe/envia mensagens
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><strong>Causa provável:</strong> Webhook UaZapi pausado, instância desconectada ou módulo desativado.</p>
                <p><strong>Verifique:</strong> Tela WhatsApp → status da instância. Logs da edge function uazapi-webhook.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="realtime">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500">Realtime</Badge>
                  Pedidos novos não aparecem automaticamente
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><strong>Causa provável:</strong> Conexão Realtime caiu ou subscriptions órfãs.</p>
                <p><strong>Verifique:</strong> Card "Realtime" no monitoramento. Recarregue a página.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Prompts Prontos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Prompts Prontos para o Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PromptCard
            title="🚨 Sistema Travou Agora"
            description="Use quando o sistema está travado ou muito lento neste momento."
            prompt={`Lovable, o sistema está travado AGORA.

Sintomas:
- [descreva: ex. dashboard não abre, demora 30s]
- Quando começou: [ex. há 10 min]
- Quantas abas estavam abertas: [número]
- Quais telas eu estava usando: [ex. Pedidos + WhatsApp]

Por favor:
1. Verifique conexões Postgres ativas
2. Liste queries em execução agora
3. Veja últimos logs do uazapi-webhook
4. Sugira ação imediata para destravar`}
          />

          <PromptCard
            title="🐌 Análise de Queries Lentas"
            description="Para investigar lentidão sem travamento."
            prompt={`Lovable, o sistema está lento (não travado).

Por favor faça uma análise de:
1. Top 10 queries mais lentas das últimas 2h (pg_stat_statements)
2. Tabelas com mais sequential scans
3. Índices que poderiam ser criados
4. Edge functions com timeout ou erro recente

Não faça mudanças ainda, só me mostre o diagnóstico.`}
          />

          <PromptCard
            title="📊 Auditoria Semanal de Saúde"
            description="Rotina preventiva — rodar 1x por semana."
            prompt={`Lovable, faça uma auditoria preventiva de saúde do sistema:

1. Conexões Postgres: pico da semana, média, atual
2. Tamanho do banco: crescimento últimos 7 dias
3. Tabelas que mais cresceram
4. Edge functions com mais erros
5. Webhooks UaZapi: total recebido, % processado vs filtrado
6. Realtime: subscriptions ativas vs lojas online

Me dê um resumo executivo + recomendações de otimização.`}
          />

          <PromptCard
            title="🔌 WhatsApp Não Funciona"
            description="Quando mensagens não chegam ou não são enviadas."
            prompt={`Lovable, WhatsApp parou de funcionar.

Loja afetada: [slug ou nome]
Instância UaZapi: [se souber]
Sintoma: [não recebe / não envia / ambos]
Última mensagem que funcionou: [horário aproximado]

Por favor:
1. Status da instância no banco (whatsapp_instances)
2. Últimos 50 logs do uazapi-webhook desta instância
3. Verificar se módulo whatsapp_chat está ativo
4. Testar envio manual via API`}
          />

          <PromptCard
            title="📈 Pico Suspeito de Tráfego"
            description="Quando você nota muito acesso de uma vez ou suspeita de bot."
            prompt={`Lovable, suspeito de pico anormal de tráfego.

Quando notei: [horário]
O que vi: [ex. dashboard piscando, contador subindo rápido]

Por favor verifique:
1. Requests por minuto nas edge functions (últimas 2h)
2. IPs únicos atingindo /api e /webhook
3. Inserts em tabelas de log/analytics nas últimas 2h
4. Possíveis loops em código frontend (polling exagerado)`}
          />
        </CardContent>
      </Card>

      {/* Métricas Importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Métricas Importantes — Valores de Referência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Database className="h-4 w-4" />
                  Conexões Postgres
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>✅ Saudável:</span><Badge variant="outline" className="text-green-600">&lt; 50%</Badge></div>
                  <div className="flex justify-between"><span>⚠️ Atenção:</span><Badge variant="outline" className="text-yellow-600">50-80%</Badge></div>
                  <div className="flex justify-between"><span>🚨 Crítico:</span><Badge variant="outline" className="text-red-600">&gt; 80%</Badge></div>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Zap className="h-4 w-4" />
                  Webhooks UaZapi/min
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>✅ Normal:</span><Badge variant="outline" className="text-green-600">&lt; 100</Badge></div>
                  <div className="flex justify-between"><span>⚠️ Alto:</span><Badge variant="outline" className="text-yellow-600">100-500</Badge></div>
                  <div className="flex justify-between"><span>🚨 Suspeito:</span><Badge variant="outline" className="text-red-600">&gt; 500</Badge></div>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Clock className="h-4 w-4" />
                  Query Time (avg)
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>✅ Rápido:</span><Badge variant="outline" className="text-green-600">&lt; 200ms</Badge></div>
                  <div className="flex justify-between"><span>⚠️ Lento:</span><Badge variant="outline" className="text-yellow-600">200-1000ms</Badge></div>
                  <div className="flex justify-between"><span>🚨 Crítico:</span><Badge variant="outline" className="text-red-600">&gt; 1s</Badge></div>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Users className="h-4 w-4" />
                  Abas simultâneas / loja
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>✅ Ideal:</span><Badge variant="outline" className="text-green-600">1-2</Badge></div>
                  <div className="flex justify-between"><span>⚠️ Aceitável:</span><Badge variant="outline" className="text-yellow-600">3-4</Badge></div>
                  <div className="flex justify-between"><span>🚨 Risco:</span><Badge variant="outline" className="text-red-600">5+</Badge></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boas Práticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Boas Práticas Para Evitar Travamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><span className="text-green-500">✓</span> Evite manter mais de 2 abas do dashboard abertas simultaneamente.</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Telas pesadas (Pedidos, KDS, WhatsApp) consomem mais — feche quando não usar.</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Desative módulos não usados em cada loja para reduzir webhooks inúteis.</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Faça uma auditoria semanal usando o prompt acima.</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Em horário de pico (almoço/jantar), evite tarefas pesadas (importação, relatórios grandes).</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Logout completo libera conexões Realtime — não só feche a aba.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Como me pedir corretamente */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            🎯 Regra de Ouro: Como Me Pedir Corretamente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Sempre inclua no seu pedido:</strong></p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li><strong>O sintoma exato:</strong> "lento", "travado", "erro X" — não só "não funciona".</li>
            <li><strong>Quando começou:</strong> "agora", "há 10 min", "desde ontem".</li>
            <li><strong>O que estava fazendo:</strong> "abri 3 abas de pedidos", "rodei relatório".</li>
            <li><strong>Loja/usuário afetado:</strong> nome ou slug, ajuda a filtrar logs.</li>
            <li><strong>Print ou mensagem de erro:</strong> se houver, anexe.</li>
          </ol>
          <Alert className="mt-3">
            <AlertDescription className="text-xs">
              <strong>❌ Ruim:</strong> "tá travando, vê aí"<br/>
              <strong>✅ Bom:</strong> "Sistema lento desde 14h. Loja Jeferson. Tinha 3 abas abertas (Pedidos, KDS, WhatsApp). Print anexo. Roda diagnóstico de conexões e webhooks."
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
