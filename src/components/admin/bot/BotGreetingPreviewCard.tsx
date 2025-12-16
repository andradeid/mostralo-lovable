import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Store } from 'lucide-react';
import { getPeriodFromHour, getRandomGreeting, periodInfo, type Period } from '@/lib/greetingTemplates';

interface BotGreetingPreviewCardProps {
  storeName: string;
  storeSlug: string;
  isOpen?: boolean;
}

export function BotGreetingPreviewCard({ storeName, storeSlug, isOpen = true }: BotGreetingPreviewCardProps) {
  const [greeting, setGreeting] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState<Period>('manha');
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const storeLink = `mostralo.com.br/loja/${storeSlug}`;

  const generateGreeting = () => {
    const hour = new Date().getHours();
    const period = getPeriodFromHour(hour);
    setCurrentHour(hour);
    setCurrentPeriod(period);
    
    const newGreeting = getRandomGreeting(
      period,
      isOpen,
      storeName || 'Sua Loja',
      storeLink,
      isOpen ? null : 'amanhã às 08:00'
    );
    setGreeting(newGreeting);
  };

  useEffect(() => {
    generateGreeting();
  }, [storeName, storeSlug, isOpen]);

  const info = periodInfo[currentPeriod];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              👋 Preview da Saudação
            </CardTitle>
            <CardDescription>
              Exemplo de como o bot vai cumprimentar seus clientes
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateGreeting}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sortear Outra
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicadores de contexto */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {info.emoji} {info.label} ({currentHour}h)
          </Badge>
          <Badge variant={isOpen ? 'default' : 'destructive'} className="gap-1">
            <Store className="h-3 w-3" />
            {isOpen ? '✅ Aberta' : '🔴 Fechada'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {info.hours}
          </Badge>
        </div>

        {/* Preview da mensagem */}
        <div className="bg-muted/50 rounded-lg p-4 border">
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {greeting}
          </p>
        </div>

        {/* Info adicional */}
        <p className="text-xs text-muted-foreground">
          💡 O bot seleciona aleatoriamente entre 5 variações diferentes para cada período do dia, 
          tornando as conversas mais naturais e humanizadas.
        </p>
      </CardContent>
    </Card>
  );
}
