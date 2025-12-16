import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const competitors = [
  {
    name: "Mostralo",
    price: "R$ 397,90",
    marketing: true,
    differentiator: "Marketing + Delivery integrado",
    highlight: true
  },
  {
    name: "Anota AI",
    price: "R$ 399+",
    marketing: false,
    differentiator: "Apenas delivery"
  },
  {
    name: "Goomer",
    price: "R$ 299+",
    marketing: false,
    differentiator: "Apenas cardápio digital"
  },
  {
    name: "Cardápio Web",
    price: "R$ 397+",
    marketing: false,
    differentiator: "Apenas delivery"
  }
];

export function CompetitorAnalysis() {
  return (
    <Card>
      <CardHeader className="p-3 pb-2 md:p-6 md:pb-4">
        <CardTitle className="text-sm md:text-base">Análise Competitiva</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Comparativo com principais concorrentes
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        {/* Mobile: Cards */}
        <div className="md:hidden space-y-2">
          {competitors.map((competitor) => (
            <div 
              key={competitor.name}
              className={`p-3 rounded-lg border ${competitor.highlight ? "bg-primary/5 border-primary" : ""}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm flex items-center gap-1.5">
                  {competitor.name}
                  {competitor.highlight && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Nós</Badge>
                  )}
                </span>
                <span className="font-semibold text-sm">{competitor.price}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {competitor.marketing ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  Marketing {competitor.marketing ? 'Incluso' : 'Não Incluso'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{competitor.differentiator}</p>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plataforma</TableHead>
                <TableHead>Preço Inicial</TableHead>
                <TableHead className="text-center">Marketing Incluso</TableHead>
                <TableHead>Diferencial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((competitor) => (
                <TableRow 
                  key={competitor.name}
                  className={competitor.highlight ? "bg-primary/5 border-l-4 border-l-primary" : ""}
                >
                  <TableCell className="font-medium">
                    {competitor.name}
                    {competitor.highlight && (
                      <Badge variant="default" className="ml-2">Nós</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{competitor.price}</TableCell>
                  <TableCell className="text-center">
                    {competitor.marketing ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {competitor.differentiator}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-xs md:text-sm mb-1 md:mb-2">🎯 Nosso Diferencial</h4>
          <p className="text-[10px] md:text-sm text-muted-foreground">
            Mostralo é a <strong>ÚNICA</strong> plataforma com Delivery + Marketing Digital integrado no mesmo preço.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
