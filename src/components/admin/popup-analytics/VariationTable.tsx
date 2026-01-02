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
      <CardHeader>
        <CardTitle className="text-base">Detalhamento por Variação</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variação</TableHead>
              <TableHead className="text-right">Impressões</TableHead>
              <TableHead className="text-right">Cliques CTA</TableHead>
              <TableHead className="text-right">Fechados</TableHead>
              <TableHead className="text-right">Taxa Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.variation}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    Variação {item.variation}
                    {item.variation === bestVariation && (
                      <Badge variant="secondary" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        Melhor
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.views.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-right text-green-600">{item.clicks.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-right text-muted-foreground">{item.closed.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-right font-semibold">
                  {item.conversionRate.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
