import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const competitors = [
  {
    name: "Mostralo",
    price: "R$ 397,90",
    marketing: true,
    financialAuto: true,
    waiterApp: true,
    tablePedidos: true,
    totem: true,
    differentiator: "Delivery + Marketing + Financeiro + Mesa + Totem + Garçom",
    highlight: true
  },
  {
    name: "Anota AI",
    price: "R$ 399+",
    marketing: false,
    financialAuto: false,
    waiterApp: true,
    tablePedidos: true,
    totem: false,
    differentiator: "Delivery + IA WhatsApp"
  },
  {
    name: "Goomer",
    price: "R$ 299+",
    marketing: false,
    financialAuto: false,
    waiterApp: true,
    tablePedidos: true,
    totem: true,
    differentiator: "Cardápio digital + Totem (pago)"
  },
  {
    name: "Cardápio Web",
    price: "R$ 397+",
    marketing: false,
    financialAuto: false,
    waiterApp: false,
    tablePedidos: true,
    totem: false,
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
              <div className="grid grid-cols-2 gap-1 mt-2">
                <div className="flex items-center gap-1">
                  {competitor.marketing ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-[9px] text-muted-foreground">Marketing</span>
                </div>
                <div className="flex items-center gap-1">
                  {competitor.financialAuto ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-[9px] text-muted-foreground">Financeiro Auto</span>
                </div>
                <div className="flex items-center gap-1">
                  {competitor.waiterApp ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-[9px] text-muted-foreground">App Garçom</span>
                </div>
                <div className="flex items-center gap-1">
                  {competitor.tablePedidos ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-[9px] text-muted-foreground">Mesa QR</span>
                </div>
                <div className="flex items-center gap-1">
                  {competitor.totem ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-[9px] text-muted-foreground">Totem</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">{competitor.differentiator}</p>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plataforma</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-center">Marketing</TableHead>
                <TableHead className="text-center">Financeiro</TableHead>
                <TableHead className="text-center">App Garçom</TableHead>
                <TableHead className="text-center">Mesa QR</TableHead>
                <TableHead className="text-center">Totem</TableHead>
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
                  <TableCell className="font-semibold text-xs">{competitor.price}</TableCell>
                  <TableCell className="text-center">
                    {competitor.marketing ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {competitor.financialAuto ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {competitor.waiterApp ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {competitor.tablePedidos ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {competitor.totem ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
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
            Mostralo é a <strong>ÚNICA</strong> plataforma com Delivery + Marketing Digital + Gestão Financeira + App Garçom + Pedidos na Mesa + <strong>Totem de Autoatendimento</strong> - TUDO integrado no mesmo preço.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
