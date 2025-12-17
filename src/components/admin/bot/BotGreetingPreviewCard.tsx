import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Store, Calendar, Sparkles } from 'lucide-react';
import { 
  getPeriodFromHour, 
  getRandomGreeting, 
  periodInfo, 
  nicheInfo,
  detectNiche,
  getHolidayInfo,
  getWeekdayInfo,
  type Period,
  type StoreNiche
} from '@/lib/greetingTemplates';

interface BotGreetingPreviewCardProps {
  storeName: string;
  storeSlug: string;
  isOpen?: boolean;
  storeSegment?: string | null;
  nextOpeningTime?: string | null;
}

export function BotGreetingPreviewCard({ 
  storeName, 
  storeSlug, 
  isOpen = true,
  storeSegment,
  nextOpeningTime
}: BotGreetingPreviewCardProps) {
  const [greeting, setGreeting] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState<Period>('manha');
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [niche, setNiche] = useState<StoreNiche>('default');

  const storeLink = `mostralo.com.br/loja/${storeSlug}`;

  const generateGreeting = () => {
    const hour = new Date().getHours();
    const period = getPeriodFromHour(hour);
    const detectedNiche = detectNiche(storeSegment, storeName);
    
    setCurrentHour(hour);
    setCurrentPeriod(period);
    setNiche(detectedNiche);
    
    const newGreeting = getRandomGreeting(
      period,
      isOpen,
      storeName || 'Sua Loja',
      storeLink,
      isOpen ? null : (nextOpeningTime || 'amanhã às 08:00'),
      storeSegment
    );
    setGreeting(newGreeting);
  };

  useEffect(() => {
    generateGreeting();
  }, [storeName, storeSlug, isOpen, storeSegment, nextOpeningTime]);

  const info = periodInfo[currentPeriod];
  const holiday = getHolidayInfo();
  const weekdayInfo = getWeekdayInfo();
  const nicheData = nicheInfo[niche];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              👋 Preview da Saudação Inteligente
            </CardTitle>
            <CardDescription>
              Sistema unificado com 141+ variações de templates
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
          {/* Período do dia */}
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {info.emoji} {info.label} ({currentHour}h)
          </Badge>
          
          {/* Status da loja */}
          <Badge variant={isOpen ? 'default' : 'destructive'} className="gap-1">
            <Store className="h-3 w-3" />
            {isOpen ? '✅ Aberta' : '🔴 Fechada'}
          </Badge>

          {/* Feriado (se aplicável) */}
          {holiday && (
            <Badge variant="outline" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 gap-1">
              <Calendar className="h-3 w-3" />
              🎉 {holiday.name}
            </Badge>
          )}

          {/* Dia da semana especial */}
          {weekdayInfo.isSpecial && !holiday && (
            <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 gap-1">
              <Sparkles className="h-3 w-3" />
              🎊 {weekdayInfo.name}
            </Badge>
          )}

          {/* Nicho da loja */}
          {niche !== 'default' && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 gap-1">
              {nicheData.emoji} {nicheData.label}
            </Badge>
          )}
        </div>

        {/* Próximo horário de abertura (se fechada) */}
        {!isOpen && (
          <div className="text-sm text-muted-foreground bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
            <span className="font-medium">🕐 Próxima abertura:</span>{' '}
            <strong>{nextOpeningTime || 'amanhã às 08:00'}</strong>
          </div>
        )}

        {/* Preview da mensagem */}
        <div className="bg-muted/50 rounded-lg p-4 border">
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {greeting}
          </p>
        </div>

        {/* Estatísticas do sistema */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div className="bg-muted/30 rounded p-2">
            <div className="text-lg font-bold text-primary">6</div>
            <div className="text-xs text-muted-foreground">Períodos</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-lg font-bold text-primary">14</div>
            <div className="text-xs text-muted-foreground">Feriados</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-lg font-bold text-primary">17</div>
            <div className="text-xs text-muted-foreground">Nichos</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-lg font-bold text-primary">141+</div>
            <div className="text-xs text-muted-foreground">Variações</div>
          </div>
        </div>

        {/* Info adicional */}
        <p className="text-xs text-muted-foreground">
          💡 O sistema seleciona automaticamente o melhor template baseado em: 
          <strong> feriados</strong> → <strong>dia da semana</strong> → <strong>nicho da loja</strong> → <strong>período do dia</strong>.
          Mensagens nunca se repetem!
        </p>
      </CardContent>
    </Card>
  );
}
