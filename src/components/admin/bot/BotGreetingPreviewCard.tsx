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
    <Card className="overflow-hidden">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              👋 Preview da Saudação
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words">
              Sistema unificado com 141+ variações de templates
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateGreeting}
            className="gap-1.5 h-8 text-xs sm:text-sm w-full sm:w-auto shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sortear Outra
          </Button>
        </div>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        {/* Indicadores de contexto */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {/* Período do dia */}
          <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs">
            <Clock className="h-3 w-3 shrink-0" />
            {info.emoji} {info.label} ({currentHour}h)
          </Badge>
          
          {/* Status da loja */}
          <Badge variant={isOpen ? 'default' : 'destructive'} className="gap-1 text-[10px] sm:text-xs">
            <Store className="h-3 w-3 shrink-0" />
            {isOpen ? '✅ Aberta' : '🔴 Fechada'}
          </Badge>

          {/* Feriado (se aplicável) */}
          {holiday && (
            <Badge variant="outline" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 gap-1 text-[10px] sm:text-xs">
              <Calendar className="h-3 w-3 shrink-0" />
              🎉 {holiday.name}
            </Badge>
          )}

          {/* Dia da semana especial */}
          {weekdayInfo.isSpecial && !holiday && (
            <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 gap-1 text-[10px] sm:text-xs">
              <Sparkles className="h-3 w-3 shrink-0" />
              🎊 {weekdayInfo.name}
            </Badge>
          )}

          {/* Nicho da loja */}
          {niche !== 'default' && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 gap-1 text-[10px] sm:text-xs">
              {nicheData.emoji} {nicheData.label}
            </Badge>
          )}
        </div>

        {/* Próximo horário de abertura (se fechada) */}
        {!isOpen && (
          <div className="text-xs sm:text-sm text-muted-foreground bg-orange-50 dark:bg-orange-900/20 p-2.5 sm:p-3 rounded-lg border border-orange-200 dark:border-orange-800">
            <span className="font-medium">🕐 Próxima abertura:</span>{' '}
            <strong>{nextOpeningTime || 'amanhã às 08:00'}</strong>
          </div>
        )}

        {/* Preview da mensagem */}
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
          <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed break-words">
            {greeting}
          </p>
        </div>

        {/* Estatísticas do sistema */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
          <div className="bg-muted/30 rounded p-1.5 sm:p-2">
            <div className="text-sm sm:text-lg font-bold text-primary">6</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">Períodos</div>
          </div>
          <div className="bg-muted/30 rounded p-1.5 sm:p-2">
            <div className="text-sm sm:text-lg font-bold text-primary">14</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">Feriados</div>
          </div>
          <div className="bg-muted/30 rounded p-1.5 sm:p-2">
            <div className="text-sm sm:text-lg font-bold text-primary">17</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">Nichos</div>
          </div>
          <div className="bg-muted/30 rounded p-1.5 sm:p-2">
            <div className="text-sm sm:text-lg font-bold text-primary">141+</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">Variações</div>
          </div>
        </div>

        {/* Info adicional */}
        <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
          💡 O sistema seleciona automaticamente o melhor template baseado em: 
          <strong> feriados</strong> → <strong>dia da semana</strong> → <strong>nicho da loja</strong> → <strong>período do dia</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
