import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { VisitsSummaryCards } from "./visits/VisitsSummaryCards";
import { VisitsChart } from "./visits/VisitsChart";
import { TopPagesTable } from "./visits/TopPagesTable";
import { TrafficSourcesChart } from "./visits/TrafficSourcesChart";
import { DevicesChart } from "./visits/DevicesChart";
import { BrowsersChart } from "./visits/BrowsersChart";
import { LocationsTable } from "./visits/LocationsTable";
import { UTMCampaignsTable } from "./visits/UTMCampaignsTable";

type PeriodKey = "today" | "7d" | "30d" | "90d" | "custom";

export function VisitsAnalytics() {
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "7d":
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case "30d":
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case "90d":
        return { from: startOfDay(subDays(now, 90)), to: endOfDay(now) };
      case "custom":
        return { from: startOfDay(customRange.from), to: endOfDay(customRange.to) };
    }
  }, [period, customRange]);

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["page-visits", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_visits")
        .select("*")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return data || [];
    },
  });

  // Métricas agregadas
  const totalVisits = visits.length;
  const uniqueSessions = new Set(visits.map((v: any) => v.session_id).filter(Boolean)).size;
  const sessionsMap = new Map<string, number>();
  visits.forEach((v: any) => {
    if (v.session_id) {
      sessionsMap.set(v.session_id, (sessionsMap.get(v.session_id) || 0) + 1);
    }
  });
  const pagesPerSession = uniqueSessions > 0 ? totalVisits / uniqueSessions : 0;
  const bounceSessions = Array.from(sessionsMap.values()).filter((c) => c === 1).length;
  const bounceRate = uniqueSessions > 0 ? (bounceSessions / uniqueSessions) * 100 : 0;

  // Visitas por dia
  const visitsByDay = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v: any) => {
      const day = format(new Date(v.created_at), "yyyy-MM-dd");
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, visits: count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [visits]);

  // Top páginas
  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v: any) => {
      map.set(v.page_url, (map.get(v.page_url) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([page_url, count]) => ({ page_url, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  // Origem do tráfego
  const trafficSources = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v: any) => {
      let source = "Direto";
      if (v.utm_source) source = v.utm_source;
      else if (v.referrer) {
        try {
          const host = new URL(v.referrer).hostname;
          if (host.includes("google")) source = "Google";
          else if (host.includes("facebook") || host.includes("instagram")) source = "Redes Sociais";
          else source = host;
        } catch {
          source = "Outros";
        }
      }
      map.set(source, (map.get(source) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [visits]);

  // Dispositivos
  const devices = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v: any) => {
      const dt = v.device_type || "desktop";
      const label = dt === "mobile" ? "Mobile" : dt === "tablet" ? "Tablet" : "Desktop";
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [visits]);

  // Navegadores
  const browsers = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v: any) => {
      map.set(v.browser || "Unknown", (map.get(v.browser || "Unknown") || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [visits]);

  // Localização
  const locations = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v: any) => {
      const loc = [v.city, v.region, v.country].filter(Boolean).join(", ") || "Desconhecido";
      map.set(loc, (map.get(loc) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  // Campanhas UTM
  const utmCampaigns = useMemo(() => {
    const key = (v: any) => `${v.utm_source || ""}|${v.utm_medium || ""}|${v.utm_campaign || ""}`;
    const map = new Map<string, number>();
    visits
      .filter((v: any) => v.utm_source || v.utm_medium || v.utm_campaign)
      .forEach((v: any) => {
        const k = key(v);
        map.set(k, (map.get(k) || 0) + 1);
      });
    return Array.from(map.entries())
      .map(([k, count]) => {
        const [source, medium, campaign] = k.split("|");
        return { source, medium, campaign, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [visits]);

  const periodButtons: { key: PeriodKey; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "90d", label: "90 dias" },
    { key: "custom", label: "Personalizado" },
  ];

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex flex-wrap items-center gap-2">
        {periodButtons.map((btn) => (
          <Button
            key={btn.key}
            variant={period === btn.key ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(btn.key)}
          >
            {btn.label}
          </Button>
        ))}
        {period === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(customRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(customRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: customRange.from, to: customRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setCustomRange({ from: range.from, to: range.to });
                  }
                }}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Cards de resumo */}
      <VisitsSummaryCards
        totalVisits={totalVisits}
        uniqueVisitors={uniqueSessions}
        pagesPerSession={pagesPerSession}
        bounceRate={bounceRate}
        loading={isLoading}
      />

      {/* Gráfico de visitas ao longo do tempo */}
      <VisitsChart data={visitsByDay} loading={isLoading} />

      {/* Grid 2 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopPagesTable data={topPages} loading={isLoading} />
        <TrafficSourcesChart data={trafficSources} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DevicesChart data={devices} loading={isLoading} />
        <BrowsersChart data={browsers} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationsTable data={locations} loading={isLoading} />
        <UTMCampaignsTable data={utmCampaigns} loading={isLoading} />
      </div>
    </div>
  );
}
