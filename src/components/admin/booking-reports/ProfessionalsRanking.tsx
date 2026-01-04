import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface ProfessionalsRankingProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

export function ProfessionalsRanking({ storeId, dateRange }: ProfessionalsRankingProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["booking-professionals-ranking", storeId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          professional_id,
          price,
          status,
          professionals!inner(name, photo_url)
        `)
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;

      // Agrupar por profissional
      const professionalStats: Record<string, { 
        id: string;
        name: string; 
        photoUrl: string | null;
        total: number; 
        completed: number;
        cancelled: number;
        noShow: number;
        revenue: number;
      }> = {};

      bookings?.forEach(b => {
        const prof = b.professionals as any;
        const profId = b.professional_id;
        const profName = prof?.name || "Profissional desconhecido";
        const photoUrl = prof?.photo_url || null;

        if (!professionalStats[profId]) {
          professionalStats[profId] = { 
            id: profId,
            name: profName, 
            photoUrl,
            total: 0, 
            completed: 0,
            cancelled: 0,
            noShow: 0,
            revenue: 0 
          };
        }
        professionalStats[profId].total++;
        
        if (b.status === "completed") {
          professionalStats[profId].completed++;
          professionalStats[profId].revenue += b.price || 0;
        } else if (b.status === "cancelled") {
          professionalStats[profId].cancelled++;
        } else if (b.status === "no_show") {
          professionalStats[profId].noShow++;
        }
      });

      return Object.values(professionalStats)
        .map(p => ({
          ...p,
          attendanceRate: p.total > 0 ? (p.completed / p.total) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);
    }
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm text-muted-foreground w-5 text-center">#{index + 1}</span>;
    }
  };

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge variant="default" className="bg-green-600">Excelente</Badge>;
    if (rate >= 70) return <Badge variant="secondary">Bom</Badge>;
    return <Badge variant="outline">Regular</Badge>;
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhum agendamento com profissional no período
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Profissional</TableHead>
          <TableHead className="text-center">Total</TableHead>
          <TableHead className="text-center">Realizados</TableHead>
          <TableHead className="text-center">Cancelados</TableHead>
          <TableHead className="text-center">No-Show</TableHead>
          <TableHead className="text-center">Taxa Comparec.</TableHead>
          <TableHead className="text-right">Receita</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((professional, index) => (
          <TableRow key={professional.id}>
            <TableCell className="text-center">
              {getRankIcon(index)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={professional.photoUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {professional.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{professional.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-center font-medium">{professional.total}</TableCell>
            <TableCell className="text-center text-green-600">{professional.completed}</TableCell>
            <TableCell className="text-center text-red-600">{professional.cancelled}</TableCell>
            <TableCell className="text-center text-amber-600">{professional.noShow}</TableCell>
            <TableCell className="text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium">{professional.attendanceRate.toFixed(1)}%</span>
                {getAttendanceBadge(professional.attendanceRate)}
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">
              R$ {professional.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
