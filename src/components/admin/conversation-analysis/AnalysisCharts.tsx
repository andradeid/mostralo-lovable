import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AnalysisRecord } from "@/hooks/useConversationAnalysis";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface AnalysisChartsProps {
  analyses: AnalysisRecord[];
}

const ATENDIMENTO_COLORS: Record<string, string> = {
  'ia': 'hsl(142, 71%, 45%)',
  'humano': 'hsl(221, 83%, 53%)',
  'misto': 'hsl(45, 93%, 47%)',
  'indefinido': 'hsl(0, 0%, 70%)'
};

const CANAL_COLORS: Record<string, string> = {
  'sistema': 'hsl(142, 71%, 45%)',
  'manual_whatsapp': 'hsl(0, 72%, 51%)',
  'indefinido': 'hsl(0, 0%, 70%)'
};

const ATENDIMENTO_LABELS: Record<string, string> = {
  'ia': 'IA',
  'humano': 'Humano',
  'misto': 'Misto',
  'indefinido': 'Indefinido'
};

const CANAL_LABELS: Record<string, string> = {
  'sistema': 'Sistema',
  'manual_whatsapp': 'WhatsApp Manual',
  'indefinido': 'Indefinido'
};

function groupBy(items: AnalysisRecord[], key: keyof AnalysisRecord, labels: Record<string, string>, colors: Record<string, string>) {
  const counts: Record<string, number> = {};
  items.forEach(item => {
    const val = String(item[key] || 'indefinido');
    counts[val] = (counts[val] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({
    name: labels[name] || name,
    value,
    fill: colors[name] || 'hsl(0, 0%, 70%)'
  }));
}

export function AnalysisCharts({ analyses }: AnalysisChartsProps) {
  const successAnalyses = analyses.filter(a => a.analysis_status === 'success');
  
  const atendimentoData = groupBy(successAnalyses, 'atendimento_predominante', ATENDIMENTO_LABELS, ATENDIMENTO_COLORS);
  const canalData = groupBy(
    successAnalyses.filter(a => a.houve_fechamento),
    'canal_fechamento',
    CANAL_LABELS,
    CANAL_COLORS
  );

  const tooltips: Record<string, string> = {
    'Tipo de Atendimento': 'Distribuição das conversas por tipo: IA (respondidas pelo bot), Humano (respondidas por atendente) ou Misto (ambos participaram).',
    'Canal de Fechamento': 'Onde a venda foi concluída: pelo sistema (pedido registrado) ou manualmente via WhatsApp (combinado por mensagem).',
  };

  const renderChart = (data: any[], title: string, emptyMsg: string) => (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          <InfoTooltip text={tooltips[title] || ''} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
            {emptyMsg}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Conversas']} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderChart(atendimentoData, 'Tipo de Atendimento', 'Sem dados')}
      {renderChart(canalData, 'Canal de Fechamento', 'Sem fechamentos')}
    </div>
  );
}
