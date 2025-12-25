import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReportFilters } from '@/components/admin/reports/ReportFilters';
import { SalesKPICards } from '@/components/admin/reports/SalesKPICards';
import { SalesChart } from '@/components/admin/reports/SalesChart';
import { OrdersAnalysis } from '@/components/admin/reports/OrdersAnalysis';
import { SalesTrends } from '@/components/admin/reports/SalesTrends';
import { TopProducts } from '@/components/admin/reports/TopProducts';
import { CustomersAnalysis } from '@/components/admin/reports/CustomersAnalysis';
import { BarChart3, TrendingUp, Package, Users, ShoppingCart, Info } from 'lucide-react';
import { subDays } from 'date-fns';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { useStoreAccess } from '@/hooks/useStoreAccess';

import { DateRange } from '@/components/admin/reports/types';

export default function ReportsPage() {
  const { storeId } = useStoreAccess();
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: subDays(new Date(), 30), 
    to: new Date() 
  });
  
  return (
    <ModuleGate moduleKey="reports" storeId={storeId}>
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise completa de vendas e performance</p>
        </div>
        <ReportFilters dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>
      
      {/* Instrução geral */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
          <strong>Dica:</strong> Use as abas abaixo para navegar entre diferentes visões. 
          <strong> Vendas</strong> mostra o gráfico de faturamento, <strong>Pedidos</strong> traz 
          análise detalhada de todas as vendas (online + PDV), <strong>Tendências</strong> mostra 
          padrões de venda por período, <strong>Produtos</strong> lista os mais vendidos e 
          <strong> Clientes</strong> analisa o perfil de compradores.
        </AlertDescription>
      </Alert>

      {/* KPIs no topo */}
      <SalesKPICards dateRange={dateRange} storeId={storeId} />
      
      {/* Tabs para organizar conteúdo */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="w-full md:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Vendas</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Tendências</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Clientes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <SalesChart dateRange={dateRange} storeId={storeId} />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrdersAnalysis dateRange={dateRange} storeId={storeId} />
        </TabsContent>
        
        <TabsContent value="trends">
          <SalesTrends dateRange={dateRange} storeId={storeId} />
        </TabsContent>
        
        <TabsContent value="products">
          <TopProducts dateRange={dateRange} storeId={storeId} />
        </TabsContent>
        
        <TabsContent value="customers">
          <CustomersAnalysis dateRange={dateRange} storeId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
    </ModuleGate>
  );
}
