import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UTMData {
  source: string;
  views: number;
  clicks: number;
  conversionRate: number;
}

interface UTMBreakdownTableProps {
  data: UTMData[];
  title: string;
  emptyMessage?: string;
}

export const UTMBreakdownTable = ({ data, title, emptyMessage = 'Sem dados' }: UTMBreakdownTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((item) => (
                <TableRow key={item.source}>
                  <TableCell className="font-medium">{item.source || '(direto)'}</TableCell>
                  <TableCell className="text-right">{item.views.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right text-green-600">{item.clicks.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-semibold">{item.conversionRate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
