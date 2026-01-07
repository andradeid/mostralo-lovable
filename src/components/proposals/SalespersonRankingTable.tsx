import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";

interface SalespersonData {
  id: string;
  name: string;
  sent: number;
  accepted: number;
  rejected: number;
  conversionRate: number;
  totalValue: number;
}

interface SalespersonRankingTableProps {
  data: SalespersonData[];
  isLoading?: boolean;
}

export function SalespersonRankingTable({ data, isLoading }: SalespersonRankingTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-xs text-muted-foreground">{index + 1}º</span>;
    }
  };

  const getConversionBadge = (rate: number) => {
    if (rate >= 50) return <Badge className="bg-success/20 text-success hover:bg-success/30">{rate.toFixed(0)}%</Badge>;
    if (rate >= 30) return <Badge className="bg-warning/20 text-warning hover:bg-warning/30">{rate.toFixed(0)}%</Badge>;
    return <Badge variant="secondary">{rate.toFixed(0)}%</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum vendedor com propostas encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ranking de Vendedores</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-center">Enviadas</TableHead>
              <TableHead className="text-center">Aceitas</TableHead>
              <TableHead className="text-center">Conversão</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((salesperson, index) => (
              <TableRow key={salesperson.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center justify-center w-6">
                    {getRankIcon(index)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{salesperson.name}</TableCell>
                <TableCell className="text-center">{salesperson.sent}</TableCell>
                <TableCell className="text-center text-success">{salesperson.accepted}</TableCell>
                <TableCell className="text-center">{getConversionBadge(salesperson.conversionRate)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(salesperson.totalValue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
