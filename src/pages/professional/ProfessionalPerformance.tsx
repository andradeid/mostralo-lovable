import { useState } from "react";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfessionalData } from "@/hooks/useProfessionalData";
import { PerformanceKPICards } from "@/components/professional/PerformanceKPICards";
import { MonthlyTrendChart } from "@/components/professional/MonthlyTrendChart";
import { RatingDistributionChart } from "@/components/professional/RatingDistributionChart";
import { TopServicesCard } from "@/components/professional/TopServicesCard";
import { RecentReviewsCard } from "@/components/professional/RecentReviewsCard";
import { Loader2 } from "lucide-react";

type PeriodOption = "1" | "3" | "6" | "12";

export default function ProfessionalPerformance() {
  const { data: professional, isLoading: loadingProfessional } = useProfessionalData();
  const [period, setPeriod] = useState<PeriodOption>("3");

  const endDate = endOfMonth(new Date());
  const startDate = startOfMonth(subMonths(new Date(), parseInt(period) - 1));

  if (loadingProfessional) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Profissional não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minha Performance</h1>
          <p className="text-muted-foreground">
            Acompanhe seus resultados e evolução
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Este mês</SelectItem>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <PerformanceKPICards
        professionalId={professional.id}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MonthlyTrendChart
              professionalId={professional.id}
              months={parseInt(period)}
            />
            <RatingDistributionChart professionalId={professional.id} />
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <TopServicesCard
            professionalId={professional.id}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <RecentReviewsCard professionalId={professional.id} />
        </TabsContent>
      </Tabs>

      {/* Period info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Período analisado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} até{" "}
            {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
