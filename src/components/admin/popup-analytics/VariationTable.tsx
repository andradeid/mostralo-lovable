import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface VariationData {
  variation: string;
  views: number;
  clicks: number;
  closed: number;
  conversionRate: number;
}

interface VariationTableProps {
  data: VariationData[];
  bestVariation: string | null;
}

export const VariationTable = ({ data, bestVariation }: VariationTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-sm md:text-base">Detalhamento por Variação</CardTitle>
      </CardHeader>
      <CardContent className="p-0 md:p-6 pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm whitespace-nowrap">Variação</TableHead>
                <TableHead className="text-xs md:text-sm text-right whitespace-nowrap">Views</TableHead>
                <TableHead className="text-xs md:text-sm text-right whitespace-nowrap">Cliques</TableHead>
                <TableHead className="text-xs md:text-sm text-right whitespace-nowrap hidden sm:table-cell">Fechados</TableHead>
                <TableHead className="text-xs md:text-sm text-right whitespace-nowrap">Conv.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.variation}>
                  <TableCell className="text-xs md:text-sm font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1 md:gap-2">
                      <span>Var. {item.variation}</span>
                      {item.variation === bestVariation && (
                        <Badge variant="secondary" className="gap-0.5 text-[10px] md:text-xs px-1 md:px-2 py-0">
                          <Trophy className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          <span className="hidden sm:inline">Melhor</span>
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs md:text-sm text-right">{item.views.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-xs md:text-sm text-right text-green-600">{item.clicks.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-xs md:text-sm text-right text-muted-foreground hidden sm:table-cell">{item.closed.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-xs md:text-sm text-right font-semibold">
                    {item.conversionRate.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
