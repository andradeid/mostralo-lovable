import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DigitalCardEditor } from '@/components/digital-card/DigitalCardEditor';
import { DigitalCardStats } from '@/components/digital-card/DigitalCardStats';
import { useDigitalCard } from '@/hooks/useDigitalCard';
import { CreditCard, BarChart3 } from 'lucide-react';

export default function SalespersonDigitalCardPage() {
  const { card } = useDigitalCard();

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          Meu Cartão Digital
        </h1>
        <p className="text-muted-foreground">
          Crie seu cartão digital personalizado para compartilhar com clientes
        </p>
      </div>

      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2" disabled={!card}>
            <BarChart3 className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <DigitalCardEditor ownerType="salesperson" />
        </TabsContent>

        <TabsContent value="stats">
          {card ? (
            <DigitalCardStats cardId={card.id} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Crie seu cartão primeiro para ver as estatísticas
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
