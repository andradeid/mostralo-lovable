import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TopPagesTableProps {
  data: { page_url: string; count: number }[];
  loading?: boolean;
}

export function TopPagesTable({ data, loading }: TopPagesTableProps) {
  const max = data[0]?.count || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Páginas Mais Visitadas</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum dado</p>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 10).map((item) => (
              <div key={item.page_url} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[70%]">{item.page_url}</span>
                  <span className="text-muted-foreground font-medium">
                    {item.count.toLocaleString("pt-BR")}
                  </span>
                </div>
                <Progress value={(item.count / max) * 100} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
