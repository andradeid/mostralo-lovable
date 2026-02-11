import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface LocationsTableProps {
  data: { location: string; count: number }[];
  loading?: boolean;
}

export function LocationsTable({ data, loading }: LocationsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Localização
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum dado</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 10).map((item, i) => (
              <div key={item.location} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                  {item.location}
                </span>
                <span className="font-medium">{item.count.toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
