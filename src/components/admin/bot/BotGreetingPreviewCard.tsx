import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Package, Info } from 'lucide-react';

interface BotGreetingPreviewCardProps {
  storeName: string;
  storeSlug: string;
  isOpen?: boolean;
  productCount?: number;
  categoryCount?: number;
}

export function BotGreetingPreviewCard({ 
  storeName, 
  storeSlug, 
  isOpen = true,
  productCount = 0,
  categoryCount = 0
}: BotGreetingPreviewCardProps) {
  const storeLink = `mostralo.com.br/loja/${storeSlug}`;

  return (
    <Card>
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Bot className="h-4 w-4 shrink-0" />
              Comportamento do Bot
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words">
              Como a IA responde seus clientes
            </CardDescription>
          </div>
          <Badge variant={isOpen ? 'default' : 'secondary'} className="gap-1 text-xs shrink-0 w-fit">
            {isOpen ? '🟢 Loja Aberta' : '🔴 Loja Fechada'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        {/* Estatísticas da loja */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <Package className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-lg font-bold text-foreground">{productCount}</div>
              <div className="text-xs text-muted-foreground">Produtos cadastrados</div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <Package className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-lg font-bold text-foreground">{categoryCount}</div>
              <div className="text-xs text-muted-foreground">Categorias</div>
            </div>
          </div>
        </div>

        {/* Explicação do comportamento */}
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            O que o bot faz:
          </h4>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Responde perguntas sobre seus <strong>produtos e preços</strong></li>
            <li>Informa sobre <strong>horário de funcionamento</strong></li>
            <li>Apresenta o <strong>cardápio/catálogo</strong> da loja</li>
            <li>Direciona o cliente para o <strong>link da loja</strong></li>
          </ul>
        </div>

        {/* Link da loja */}
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Link compartilhado pelo bot:</p>
          <p className="text-sm font-medium text-primary break-all">{storeLink}</p>
        </div>

        {/* Dica */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 p-2.5 sm:p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          <span className="shrink-0">💡</span>
          <p>
            <strong>Dica:</strong> Quanto mais produtos você cadastrar, mais completas serão as respostas da IA. 
            Clique em <strong>"Sincronizar"</strong> após adicionar novos produtos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
