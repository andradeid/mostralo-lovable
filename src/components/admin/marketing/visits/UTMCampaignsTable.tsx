import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

interface UTMCampaignsTableProps {
  data: { source: string; medium: string; campaign: string; count: number }[];
  loading?: boolean;
}

export function UTMCampaignsTable({ data, loading }: UTMCampaignsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="h-4 w-4" /> Campanhas UTM
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma campanha detectada no período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Source</th>
                  <th className="text-left py-2 font-medium">Medium</th>
                  <th className="text-left py-2 font-medium">Campaign</th>
                  <th className="text-right py-2 font-medium">Visitas</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{row.source || "-"}</td>
                    <td className="py-2">{row.medium || "-"}</td>
                    <td className="py-2">{row.campaign || "-"}</td>
                    <td className="py-2 text-right font-medium">{row.count.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
