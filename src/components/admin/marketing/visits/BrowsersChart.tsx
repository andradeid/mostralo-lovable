import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface BrowsersChartProps {
  data: { name: string; value: number }[];
  loading?: boolean;
}

export function BrowsersChart({ data, loading }: BrowsersChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Navegadores</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">Nenhum dado</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="vertical">
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="name" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="value" name="Visitas" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
