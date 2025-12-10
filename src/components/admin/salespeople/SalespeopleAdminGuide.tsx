import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  HelpCircle,
  ChevronDown,
  Copy,
  Info,
  ExternalLink,
  FileText,
  Wallet,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  FileCheck,
  Building2,
} from "lucide-react";

export function SalespeopleAdminGuide() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const baseUrl = window.location.origin;

  // Buscar estatísticas de vendedores
  const { data: stats } = useQuery({
    queryKey: ["salespeople-stats"],
    queryFn: async () => {
      const { data: salespeople } = await supabase
        .from("salespeople")
        .select("status, created_at, contract_accepted_at");

      const { data: sales } = await supabase
        .from("salesperson_sales")
        .select("sale_amount, commission_amount");

      const { data: payouts } = await supabase
        .from("salesperson_payouts")
        .select("grand_total, status");

      return {
        totalSalespeople: salespeople?.length || 0,
        activeCount: salespeople?.filter((s) => s.status === "active").length || 0,
        pendingCount: salespeople?.filter((s) => s.status === "pending_approval").length || 0,
        pendingContractCount: salespeople?.filter((s) => s.status === "pending_contract").length || 0,
        totalSales: sales?.length || 0,
        totalRevenue: sales?.reduce((sum, s) => sum + (Number(s.sale_amount) || 0), 0) || 0,
        totalCommissions: sales?.reduce((sum, s) => sum + (Number(s.commission_amount) || 0), 0) || 0,
        paidCommissions: payouts?.filter((p) => p.status === "paid").reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0) || 0,
      };
    },
  });

  // Buscar tiers de bônus
  const { data: bonusTiers } = useQuery({
    queryKey: ["bonus-tiers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("salesperson_bonus_tiers")
        .select("*")
        .eq("is_active", true)
        .order("min_sales", { ascending: true });
      return data || [];
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const testCnpjs = [
    {
      cnpj: "11.111.111/0001-11",
      raw: "11111111000111",
      empresa: "EMPRESA TESTE LTDA",
      cnae: "7319002 - Promoção de vendas",
    },
    {
      cnpj: "00.000.000/0001-91",
      raw: "00000000000191",
      empresa: "DESENVOLVEDOR MOSTRALO MEI",
      cnae: "4619200 - Representantes comerciais",
    },
  ];

  const acceptedCnaes = [
    { code: "7319-0/02", description: "Promoção de vendas" },
    { code: "7319-0/99", description: "Outras atividades de publicidade" },
    { code: "4619-2/00", description: "Representantes comerciais e agentes" },
    { code: "7311-4/00", description: "Agências de publicidade" },
    { code: "8299-7/99", description: "Outras atividades de serviços prestados" },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors mb-6">
        <HelpCircle className="h-5 w-5 text-primary" />
        <span className="font-semibold">📚 Instruções e Guia do Administrador</span>
        <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-6">
        {/* Estatísticas em tempo real */}
        {stats && stats.totalSalespeople > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalSalespeople}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Ativos</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.activeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Vendas</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalSales}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && stats.totalRevenue > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Receita Total</span>
                </div>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Comissões Devidas</span>
                </div>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalCommissions)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Comissões Pagas</span>
                </div>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.paidCommissions)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Links de Cadastro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Links de Cadastro
              </CardTitle>
              <CardDescription>Compartilhe para recrutar novos vendedores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Landing Page (Recomendado)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={`${baseUrl}/seja-vendedor`} readOnly className="font-mono text-sm" />
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(`${baseUrl}/seja-vendedor`, "Link da landing page")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Mostra benefícios antes do cadastro</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Cadastro Direto</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={`${baseUrl}/cadastro-vendedor`} readOnly className="font-mono text-sm" />
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(`${baseUrl}/cadastro-vendedor`, "Link de cadastro")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CNPJs de Teste */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                CNPJs de Teste
              </CardTitle>
              <CardDescription>Use para testar sem consultar a Receita Federal</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testCnpjs.map((item) => (
                    <TableRow key={item.raw}>
                      <TableCell className="font-mono text-xs">{item.cnpj}</TableCell>
                      <TableCell className="text-xs">{item.empresa}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.raw, "CNPJ")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Em produção, o sistema consulta a BrasilAPI para validar CNPJs reais.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Guia de Gestão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guia de Gestão por Status
              </CardTitle>
              <CardDescription>Boas práticas para gerenciar vendedores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pendente de Aprovação
                </h4>
                <p className="text-sm text-muted-foreground">
                  Analise em até 48h. Verifique CNPJ ativo e CNAE compatível. Após aprovar → status muda para "Pendente de Contrato".
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Pendente de Contrato
                </h4>
                <p className="text-sm text-muted-foreground">
                  Vendedor precisa aceitar o contrato digital. Sistema registra IP, data/hora e navegador. Após aceitar → fica "Ativo".
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Vendedor Ativo
                </h4>
                <p className="text-sm text-muted-foreground">
                  Acompanhe desempenho no painel individual. Forneça materiais de divulgação. Pague comissões até o dia 5 de cada mês.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Rejeitado/Inativo
                </h4>
                <p className="text-sm text-muted-foreground">
                  Sempre forneça motivo claro. Motivos comuns: CNPJ inativo, CNAE incompatível. Candidato pode corrigir e tentar novamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contrato Digital */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Contrato Digital
              </CardTitle>
              <CardDescription>O que é registrado no aceite</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">📝 Dados registrados:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Data e hora exatas do aceite</li>
                  <li>• Endereço IP do vendedor</li>
                  <li>• Navegador/dispositivo utilizado</li>
                  <li>• Versão do contrato aceito</li>
                  <li>• Termos de comissão vigentes</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">📋 Cláusulas principais:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Relação PJ sem vínculo empregatício</li>
                  <li>• Obrigatoriedade de CNPJ com CNAE compatível</li>
                  <li>• Responsabilidade fiscal (emissão de NF)</li>
                  <li>• Ciclo mensal de pagamentos via PIX</li>
                  <li>• Bônus trimestrais cumulativos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Fluxo de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Fluxo de Pagamento
              </CardTitle>
              <CardDescription>Ciclo mensal de comissões</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">1</Badge>
                  <p className="text-sm">📅 Dia 1 do mês: Vendedor solicita pagamento</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">2</Badge>
                  <p className="text-sm">📎 Vendedor anexa Nota Fiscal (NF)</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">3</Badge>
                  <p className="text-sm">🔍 Admin revisa solicitação</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">4</Badge>
                  <p className="text-sm">✅ Aprova ou ❌ Rejeita (com motivo)</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">5</Badge>
                  <p className="text-sm">💳 Pagamento via PIX em até 5 dias úteis</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <p className="text-sm font-medium">📊 Status possíveis:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">pending</Badge>
                  <Badge variant="secondary">requested</Badge>
                  <Badge variant="secondary">reviewing</Badge>
                  <Badge variant="secondary">approved</Badge>
                  <Badge variant="secondary">paid</Badge>
                  <Badge variant="secondary">rejected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Bônus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sistema de Bônus Trimestrais
              </CardTitle>
              <CardDescription>Valores configurados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {bonusTiers && bonusTiers.length > 0 ? (
                  bonusTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className={`text-center p-3 rounded-lg ${
                        tier.tier_name === "Bronze"
                          ? "bg-amber-700/10"
                          : tier.tier_name === "Prata"
                          ? "bg-gray-400/10"
                          : tier.tier_name === "Ouro"
                          ? "bg-yellow-500/10"
                          : "bg-blue-500/10"
                      }`}
                    >
                      <p className="text-2xl">
                        {tier.tier_name === "Bronze"
                          ? "🥉"
                          : tier.tier_name === "Prata"
                          ? "🥈"
                          : tier.tier_name === "Ouro"
                          ? "🥇"
                          : "💎"}
                      </p>
                      <p className="font-bold">{tier.tier_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tier.min_sales} vendas = {formatCurrency(Number(tier.bonus_amount))}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground col-span-2">Nenhum tier configurado</p>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Cumulativo:</strong> Se fizer 30 vendas no trimestre, ganha Bronze + Prata + Ouro = R$ 3.500!
                </AlertDescription>
              </Alert>

              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/dashboard/salespeople/commissions">
                  ⚙️ Editar Valores de Bônus
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* CNAEs Aceitos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CNAEs Aceitos
              </CardTitle>
              <CardDescription>Atividades econômicas compatíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {acceptedCnaes.map((cnae) => (
                  <li key={cnae.code} className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">{cnae.code}</code>
                    <span className="text-sm text-muted-foreground">{cnae.description}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
