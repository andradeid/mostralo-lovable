import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportFilters } from '@/components/admin/reports/ReportFilters';
import { SalesKPICards } from '@/components/admin/reports/SalesKPICards';
import { SalesChart } from '@/components/admin/reports/SalesChart';
import { OrdersAnalysis } from '@/components/admin/reports/OrdersAnalysis';
import { SalesTrends } from '@/components/admin/reports/SalesTrends';
import { TopProducts } from '@/components/admin/reports/TopProducts';
import { CustomersAnalysis } from '@/components/admin/reports/CustomersAnalysis';
import { BarChart3, TrendingUp, Package, Users, ShoppingCart } from 'lucide-react';
import { subDays } from 'date-fns';

import { DateRange } from '@/components/admin/reports/types';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: subDays(new Date(), 30), 
    to: new Date() 
  });
  
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise completa de vendas e performance</p>
        </div>
        <ReportFilters dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>
      
      {/* KPIs no topo */}
      <SalesKPICards dateRange={dateRange} />
      
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
          <SalesChart dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrdersAnalysis dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="trends">
          <SalesTrends dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="products">
          <TopProducts dateRange={dateRange} />
        </TabsContent>
        
        <TabsContent value="customers">
          <CustomersAnalysis dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
