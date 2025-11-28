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
      <CardHeader>
        <CardTitle>Análise Competitiva</CardTitle>
        <CardDescription>
          Comparativo com principais concorrentes do mercado
        </CardDescription>
      </CardHeader>
      <CardContent>
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

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">🎯 Nosso Diferencial Competitivo</h4>
          <p className="text-sm text-muted-foreground">
            Mostralo é a ÚNICA plataforma no mercado brasileiro que oferece <strong>Delivery + Marketing Digital</strong> integrado no mesmo preço.
            Concorrentes cobram separadamente por gestão de redes sociais (R$ 800-2.000/mês), dando-nos uma vantagem competitiva significativa.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
