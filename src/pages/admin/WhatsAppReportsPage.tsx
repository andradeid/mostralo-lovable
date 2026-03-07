import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppReportFilters } from '@/components/admin/whatsapp-reports/WhatsAppReportFilters';
import { WhatsAppKPICards } from '@/components/admin/whatsapp-reports/WhatsAppKPICards';
import { WhatsAppSalesAnalysis } from '@/components/admin/whatsapp-reports/WhatsAppSalesAnalysis';
import { ROIAnalysis } from '@/components/admin/whatsapp-reports/ROIAnalysis';
import { EfficiencyAnalysis } from '@/components/admin/whatsapp-reports/EfficiencyAnalysis';
import { MarketIntelligence } from '@/components/admin/whatsapp-reports/MarketIntelligence';

export default function WhatsAppReportsPage() {
  const { storeId } = useStoreAccess();
  const [dateFrom, setDateFrom] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Análise completa do atendimento, vendas e desempenho da IA
        </p>
      </div>

      <WhatsAppReportFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <WhatsAppKPICards
        storeId={storeId}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="efficiency">Eficiência</TabsTrigger>
          <TabsTrigger value="market">Mercado</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <WhatsAppSalesAnalysis storeId={storeId} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="roi">
          <ROIAnalysis storeId={storeId} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="efficiency">
          <EfficiencyAnalysis storeId={storeId} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="market">
          <MarketIntelligence storeId={storeId} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
