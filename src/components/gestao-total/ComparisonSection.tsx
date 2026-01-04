import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonRow {
  feature: string;
  mostralo: 'yes' | 'no' | 'partial' | string;
  competitors: 'yes' | 'no' | 'partial' | string;
}

const comparisons: ComparisonRow[] = [
  { feature: "Taxa por pedido", mostralo: "0%", competitors: "25-30%" },
  { feature: "Dados dos clientes", mostralo: "100% seus", competitors: "Do marketplace" },
  { feature: "WhatsApp Marketing", mostralo: "yes", competitors: "Pago separado" },
  { feature: "Agendamentos Online", mostralo: "yes", competitors: "Outro sistema" },
  { feature: "Sistema Financeiro", mostralo: "yes", competitors: "Outro sistema" },
  { feature: "Dashboard BI", mostralo: "yes", competitors: "Limitado" },
  { feature: "Totem Autoatendimento", mostralo: "yes", competitors: "no" },
  { feature: "Cartão Digital", mostralo: "yes", competitors: "no" },
  { feature: "Multi-loja", mostralo: "yes", competitors: "Pago extra" },
  { feature: "Suporte humanizado", mostralo: "yes", competitors: "Bot/Email" },
];

function StatusCell({ value, variant }: { value: string; variant: 'mostralo' | 'competitors' }) {
  if (value === 'yes') {
    return (
      <span className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-full",
        variant === 'mostralo' ? "bg-green-500/20 text-green-500" : "bg-green-500/10 text-green-400"
      )}>
        <Check className="w-4 h-4" />
      </span>
    );
  }
  
  if (value === 'no') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/20 text-destructive">
        <X className="w-4 h-4" />
      </span>
    );
  }
  
  if (value === 'partial') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500">
        <Minus className="w-4 h-4" />
      </span>
    );
  }
  
  return (
    <span className={cn(
      "text-sm font-medium",
      variant === 'mostralo' ? "text-green-500" : "text-muted-foreground"
    )}>
      {value}
    </span>
  );
}

export function ComparisonSection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Badge variant="outline" className="mb-4">
            COMPARATIVO
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Por que Escolher o{" "}
            <span className="text-primary">Mostralo?</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Compare e veja a diferença de ter tudo integrado em uma só plataforma
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <div className="grid grid-cols-3 gap-4 items-center">
                <CardTitle className="text-base">Funcionalidade</CardTitle>
                <div className="text-center">
                  <Badge className="bg-primary hover:bg-primary">
                    Mostralo
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge variant="outline">
                    iFood + Outros
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {comparisons.map((row, index) => (
                <div
                  key={row.feature}
                  className={cn(
                    "grid grid-cols-3 gap-4 items-center px-6 py-4",
                    index % 2 === 0 ? "bg-background" : "bg-muted/30",
                    index !== comparisons.length - 1 && "border-b"
                  )}
                >
                  <span className="text-sm font-medium">{row.feature}</span>
                  <div className="text-center">
                    <StatusCell value={row.mostralo} variant="mostralo" />
                  </div>
                  <div className="text-center">
                    <StatusCell value={row.competitors} variant="competitors" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            * Valores baseados em comparação com iFood, Rappi, Agendor, ContaAzul e similares
          </p>
        </div>
      </div>
    </section>
  );
}
