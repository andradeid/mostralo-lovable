import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    const valuation = arr * 5; // Valuation simplificado (5x ARR)
    
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

const pessimisticScenario = calculateScenario(2); // 2 lojas/mês
const moderateScenario = calculateScenario(5); // 5 lojas/mês
const aggressiveScenario = calculateScenario(10); // 10 lojas/mês

export function GrowthScenarios() {
  const [selectedMonth, setSelectedMonth] = useState(12);

  const renderScenarioTable = (data: ScenarioData[], label: string, color: string) => {
    const finalMonth = data[selectedMonth - 1];
    
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border-2 ${color}`}>
          <h3 className="font-semibold text-lg mb-2">{label} - Mês {selectedMonth}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Lojas Ativas</p>
              <p className="text-2xl font-bold">{finalMonth.totalStores}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">MRR</p>
              <p className="text-2xl font-bold">
                R$ {finalMonth.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ARR</p>
              <p className="text-2xl font-bold">
                R$ {finalMonth.arr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valuation (5x)</p>
              <p className="text-2xl font-bold">
                R$ {finalMonth.valuation.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead>Novas Lojas</TableHead>
              <TableHead>Total Lojas</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>ARR</TableHead>
              <TableHead>Valuation (5x ARR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.month} className={row.month === selectedMonth ? "bg-muted/50" : ""}>
                <TableCell className="font-medium">Mês {row.month}</TableCell>
                <TableCell>+{row.newStores}</TableCell>
                <TableCell className="font-semibold">{row.totalStores}</TableCell>
                <TableCell>R$ {row.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</TableCell>
                <TableCell>R$ {row.arr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</TableCell>
                <TableCell className="font-semibold">
                  R$ {row.valuation.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cenários de Crescimento (12 meses)</CardTitle>
        <CardDescription>
          Projeções baseadas em diferentes taxas de aquisição mensal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="moderate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pessimistic">
              Pessimista
              <Badge variant="secondary" className="ml-2">2/mês</Badge>
            </TabsTrigger>
            <TabsTrigger value="moderate">
              Moderado
              <Badge variant="default" className="ml-2">5/mês</Badge>
            </TabsTrigger>
            <TabsTrigger value="aggressive">
              Agressivo
              <Badge variant="destructive" className="ml-2">10/mês</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pessimistic" className="mt-6">
            {renderScenarioTable(pessimisticScenario, "Cenário Pessimista", "border-yellow-500")}
          </TabsContent>

          <TabsContent value="moderate" className="mt-6">
            {renderScenarioTable(moderateScenario, "Cenário Moderado", "border-blue-500")}
          </TabsContent>

          <TabsContent value="aggressive" className="mt-6">
            {renderScenarioTable(aggressiveScenario, "Cenário Agressivo", "border-green-500")}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">📊 Premissas dos Cenários</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Pessimista:</strong> 2 novas lojas por mês (crescimento conservador)</li>
            <li>• <strong>Moderado:</strong> 5 novas lojas por mês (crescimento sustentável)</li>
            <li>• <strong>Agressivo:</strong> 10 novas lojas por mês (crescimento acelerado)</li>
            <li>• Ticket médio: R$ 397,90/mês (plano Essencial)</li>
            <li>• Valuation: 5x ARR (múltiplo conservador para SaaS early-stage)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
