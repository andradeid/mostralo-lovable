import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScenarioData {
  month: number;
  newStores: number;
  totalStores: number;
  mrr: number;
  arr: number;
  valuation: number;
}

const calculateScenario = (newStoresPerMonth: number, avgTicket: number = 397.90, currentStores: number = 4): ScenarioData[] => {
  const data: ScenarioData[] = [];
  
  for (let month = 1; month <= 12; month++) {
    const totalStores = currentStores + (newStoresPerMonth * month);
    const mrr = totalStores * avgTicket;
    const arr = mrr * 12;
    const valuation = arr * 5;
    
    data.push({
      month,
      newStores: newStoresPerMonth,
      totalStores,
      mrr,
      arr,
      valuation
    });
  }
  
  return data;
};

const pessimisticScenario = calculateScenario(2);
const moderateScenario = calculateScenario(5);
const aggressiveScenario = calculateScenario(10);

export function GrowthScenarios() {
  const [selectedMonth] = useState(12);

  const renderScenarioContent = (data: ScenarioData[], label: string, color: string) => {
    const finalMonth = data[selectedMonth - 1];
    
    return (
      <div className="space-y-3 md:space-y-4">
        {/* Summary Cards */}
        <div className={`p-3 md:p-4 rounded-lg border-2 ${color}`}>
          <h3 className="font-semibold text-xs md:text-base mb-2">{label} - Mês 12</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="text-center p-1.5 md:p-2 bg-background/50 rounded">
              <p className="text-[10px] md:text-xs text-muted-foreground">Lojas</p>
              <p className="text-lg md:text-2xl font-bold">{finalMonth.totalStores}</p>
            </div>
            <div className="text-center p-1.5 md:p-2 bg-background/50 rounded">
              <p className="text-[10px] md:text-xs text-muted-foreground">MRR</p>
              <p className="text-lg md:text-2xl font-bold">
                R$ {(finalMonth.mrr / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="text-center p-1.5 md:p-2 bg-background/50 rounded">
              <p className="text-[10px] md:text-xs text-muted-foreground">ARR</p>
              <p className="text-lg md:text-2xl font-bold">
                R$ {(finalMonth.arr / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="text-center p-1.5 md:p-2 bg-background/50 rounded">
              <p className="text-[10px] md:text-xs text-muted-foreground">Valuation</p>
              <p className="text-lg md:text-2xl font-bold">
                R$ {(finalMonth.valuation / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <ScrollArea className="h-[280px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>+Lojas</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>MRR</TableHead>
                  <TableHead>ARR</TableHead>
                  <TableHead>Valuation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.month} className={row.month === 12 ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium text-xs">M{row.month}</TableCell>
                    <TableCell className="text-xs">+{row.newStores}</TableCell>
                    <TableCell className="font-semibold text-xs">{row.totalStores}</TableCell>
                    <TableCell className="text-xs">R$ {row.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-xs">R$ {row.arr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</TableCell>
                    <TableCell className="font-semibold text-xs">
                      R$ {row.valuation.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Mobile: Only show key months */}
        <div className="md:hidden">
          <div className="space-y-1.5">
            {[3, 6, 9, 12].map((monthIndex) => {
              const row = data[monthIndex - 1];
              return (
                <div key={row.month} className="flex justify-between items-center p-2 bg-muted/30 rounded text-xs">
                  <span className="font-medium">Mês {row.month}</span>
                  <span>{row.totalStores} lojas</span>
                  <span className="font-semibold">R$ {(row.mrr / 1000).toFixed(1)}k/mês</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="p-3 pb-2 md:p-6 md:pb-4">
        <CardTitle className="text-sm md:text-base">Cenários de Crescimento</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Projeções baseadas em diferentes taxas de aquisição
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <Tabs defaultValue="moderate" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8 md:h-10">
            <TabsTrigger value="pessimistic" className="text-[10px] md:text-sm px-1 md:px-3">
              <span className="hidden sm:inline">Pessimista</span>
              <span className="sm:hidden">📉</span>
              <Badge variant="secondary" className="ml-1 text-[8px] md:text-xs px-1">2/m</Badge>
            </TabsTrigger>
            <TabsTrigger value="moderate" className="text-[10px] md:text-sm px-1 md:px-3">
              <span className="hidden sm:inline">Moderado</span>
              <span className="sm:hidden">📊</span>
              <Badge variant="default" className="ml-1 text-[8px] md:text-xs px-1">5/m</Badge>
            </TabsTrigger>
            <TabsTrigger value="aggressive" className="text-[10px] md:text-sm px-1 md:px-3">
              <span className="hidden sm:inline">Agressivo</span>
              <span className="sm:hidden">🚀</span>
              <Badge variant="destructive" className="ml-1 text-[8px] md:text-xs px-1">10/m</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pessimistic" className="mt-3 md:mt-4">
            {renderScenarioContent(pessimisticScenario, "Cenário Pessimista", "border-yellow-500")}
          </TabsContent>

          <TabsContent value="moderate" className="mt-3 md:mt-4">
            {renderScenarioContent(moderateScenario, "Cenário Moderado", "border-blue-500")}
          </TabsContent>

          <TabsContent value="aggressive" className="mt-3 md:mt-4">
            {renderScenarioContent(aggressiveScenario, "Cenário Agressivo", "border-green-500")}
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-semibold text-xs md:text-sm mb-1">📊 Premissas</h4>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            Ticket médio R$ 397,90 • Valuation 5x ARR
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
