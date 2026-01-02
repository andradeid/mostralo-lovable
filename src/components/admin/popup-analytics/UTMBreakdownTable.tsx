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
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-sm md:text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 md:p-6 pt-0">
        {data.length === 0 ? (
          <p className="text-xs md:text-sm text-muted-foreground text-center py-4 px-3">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm whitespace-nowrap">Origem</TableHead>
                  <TableHead className="text-xs md:text-sm text-right whitespace-nowrap">Views</TableHead>
                  <TableHead className="text-xs md:text-sm text-right whitespace-nowrap hidden sm:table-cell">Cliques</TableHead>
                  <TableHead className="text-xs md:text-sm text-right whitespace-nowrap">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 5).map((item) => (
                  <TableRow key={item.source}>
                    <TableCell className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-[120px]">
                      {item.source || '(direto)'}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm text-right">{item.views.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-xs md:text-sm text-right text-green-600 hidden sm:table-cell">{item.clicks.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-xs md:text-sm text-right font-semibold">{item.conversionRate.toFixed(0)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
