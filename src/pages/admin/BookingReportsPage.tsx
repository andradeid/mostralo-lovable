import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, Clock, Users, Tag } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { BookingKPICards } from "@/components/admin/booking-reports/BookingKPICards";
import { PeakHoursChart } from "@/components/admin/booking-reports/PeakHoursChart";
import { PopularServicesChart } from "@/components/admin/booking-reports/PopularServicesChart";
import { WeekdayAnalysis } from "@/components/admin/booking-reports/WeekdayAnalysis";
import { ProfessionalsRanking } from "@/components/admin/booking-reports/ProfessionalsRanking";
import { BookingStatusChart } from "@/components/admin/booking-reports/BookingStatusChart";
import { BookingTrendChart } from "@/components/admin/booking-reports/BookingTrendChart";

export default function BookingReportsPage() {
  const { storeId } = useStoreAccess();
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const quickFilters = [
    { label: "Hoje", from: new Date(), to: new Date() },
    { label: "Últimos 7 dias", from: subDays(new Date(), 7), to: new Date() },
    { label: "Últimos 30 dias", from: subDays(new Date(), 30), to: new Date() },
    { label: "Este mês", from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
  ];

  if (!storeId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Relatórios de Agendamentos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Análise de desempenho e métricas de agendamentos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.label}
              variant="outline"
              size="sm"
              onClick={() => setDateRange({ from: filter.from, to: filter.to })}
              className={cn(
                dateRange.from.toDateString() === filter.from.toDateString() &&
                dateRange.to.toDateString() === filter.to.toDateString()
                  ? "bg-primary text-primary-foreground"
                  : ""
              )}
            >
              {filter.label}
            </Button>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateRange.from, "dd/MM", { locale: ptBR })} -{" "}
                {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards */}
      <BookingKPICards storeId={storeId} dateRange={dateRange} />

      {/* Tabs com análises */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4 hidden sm:block" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Tag className="h-4 w-4 hidden sm:block" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Clock className="h-4 w-4 hidden sm:block" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="professionals" className="gap-2">
            <Users className="h-4 w-4 hidden sm:block" />
            Profissionais
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status dos Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingStatusChart storeId={storeId} dateRange={dateRange} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tendência de Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingTrendChart storeId={storeId} dateRange={dateRange} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Serviços */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Serviços Mais Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <PopularServicesChart storeId={storeId} dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Horários */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Horários de Pico</CardTitle>
              </CardHeader>
              <CardContent>
                <PeakHoursChart storeId={storeId} dateRange={dateRange} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análise por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <WeekdayAnalysis storeId={storeId} dateRange={dateRange} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profissionais */}
        <TabsContent value="professionals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking de Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfessionalsRanking storeId={storeId} dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
