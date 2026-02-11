import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DevicesChartProps {
  data: { name: string; value: number }[];
  loading?: boolean;
}

const COLORS = ["#f97316", "#06b6d4", "#8b5cf6"];

export function DevicesChart({ data, loading }: DevicesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dispositivos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">Nenhum dado</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
