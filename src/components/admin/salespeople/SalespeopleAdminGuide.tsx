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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  User,
  ArrowUpCircle,
  Shield,
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
        .select("status, created_at, contract_accepted_at, salesperson_type");

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
        affiliateCount: salespeople?.filter((s) => s.salesperson_type === "affiliate").length || 0,
        partnerCount: salespeople?.filter((s) => s.salesperson_type === "partner").length || 0,
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

  const testCpfs = [
    { cpf: "123.456.789-09", raw: "12345678909", nome: "João Teste Silva" },
    { cpf: "987.654.321-00", raw: "98765432100", nome: "Maria Exemplo Santos" },
    { cpf: "111.444.777-35", raw: "11144477735", nome: "Pedro Afiliado Souza" },
  ];

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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Afiliados</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.affiliateCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Parceiros PJ</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{stats.partnerCount}</p>
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
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Vendas</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{stats.totalSales}</p>
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

        {/* Tipos de Vendedor - NOVA SEÇÃO */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Tipos de Vendedor
            </CardTitle>
            <CardDescription>Comparativo entre Afiliado (CPF) e Parceiro PJ (CNPJ)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Afiliado */}
              <div className="border rounded-lg p-4 bg-blue-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Afiliado (CPF)</h3>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">Pessoa Física</Badge>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Cadastro simplificado (só CPF)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Comissão: <strong>5-7%</strong> por venda</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>Limite: <strong>R$ 1.900/mês</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">Sem bônus trimestrais</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Sem necessidade de NF</span>
                  </li>
                </ul>
                <Alert className="mt-4 bg-blue-500/10 border-blue-500/30">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs">
                    Ideal para quem está começando ou quer indicar de forma casual. Limite de R$ 1.900 está dentro do permitido para não caracterizar atividade habitual.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Parceiro PJ */}
              <div className="border rounded-lg p-4 bg-purple-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Parceiro PJ (CNPJ)</h3>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-700">Pessoa Jurídica</Badge>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Requer CNPJ ativo + CNAE válido</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Comissão: <strong>10%</strong> por venda</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Ganhos: <strong>Ilimitados</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Bônus trimestrais cumulativos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>Obrigatório emitir NF</span>
                  </li>
                </ul>
                <Alert className="mt-4 bg-purple-500/10 border-purple-500/30">
                  <Info className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-xs">
                    Ideal para vendedores profissionais. MEI pode ser aberto gratuitamente em gov.br/mei em 15 minutos.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Tabela Comparativa */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Característica</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <User className="h-4 w-4 text-blue-500" />
                      Afiliado
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Building2 className="h-4 w-4 text-purple-500" />
                      Parceiro PJ
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Documento</TableCell>
                  <TableCell className="text-center">CPF</TableCell>
                  <TableCell className="text-center">CNPJ + CNAE</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Comissão</TableCell>
                  <TableCell className="text-center text-blue-600 font-semibold">5-7%</TableCell>
                  <TableCell className="text-center text-purple-600 font-semibold">10%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Limite Mensal</TableCell>
                  <TableCell className="text-center text-yellow-600">R$ 1.900</TableCell>
                  <TableCell className="text-center text-green-600">Ilimitado</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bônus Trimestral</TableCell>
                  <TableCell className="text-center text-red-500">❌ Não</TableCell>
                  <TableCell className="text-center text-green-500">✅ Sim</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Nota Fiscal</TableCell>
                  <TableCell className="text-center text-green-500">Não precisa</TableCell>
                  <TableCell className="text-center text-yellow-600">Obrigatória</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Contrato</TableCell>
                  <TableCell className="text-center">Termos de Indicação</TableCell>
                  <TableCell className="text-center">Contrato PJ Completo</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                <p className="text-xs text-muted-foreground mt-1">Mostra benefícios e permite escolher tipo (Afiliado ou PJ)</p>
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

          {/* Documentos de Teste */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos de Teste
              </CardTitle>
              <CardDescription>Use para testar os fluxos de cadastro</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cpf" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cpf" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    CPFs (Afiliado)
                  </TabsTrigger>
                  <TabsTrigger value="cnpj" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    CNPJs (Parceiro)
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="cpf">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CPF</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testCpfs.map((item) => (
                        <TableRow key={item.raw}>
                          <TableCell className="font-mono text-xs">{item.cpf}</TableCell>
                          <TableCell className="text-xs">{item.nome}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.raw, "CPF")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Alert className="mt-3 bg-blue-500/10 border-blue-500/30">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs">
                      CPFs de teste passam na validação de dígitos mas não consultam a Receita.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="cnpj">
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
                  <Alert className="mt-3 bg-purple-500/10 border-purple-500/30">
                    <Info className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-xs">
                      Em produção, CNPJs são validados via BrasilAPI (situação cadastral + CNAE).
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Guia de Gestão por Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guia de Gestão por Status
              </CardTitle>
              <CardDescription>Boas práticas diferenciadas por tipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pendente de Aprovação
                </h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <User className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Afiliado:</strong> Verificar CPF válido. Aprovar em até 24h.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Parceiro PJ:</strong> Verificar CNPJ ativo + CNAE compatível. Aprovar em até 48h.
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Pendente de Contrato/Termos
                </h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <User className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Afiliado:</strong> Aceita Termos de Indicação simplificados.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Parceiro PJ:</strong> Aceita Contrato completo com cláusulas fiscais.
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Vendedor Ativo
                </h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <User className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Afiliado:</strong> Monitorar limite de R$ 1.900/mês. Incentivar upgrade.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Parceiro PJ:</strong> Acompanhar metas trimestrais. Fornecer materiais.
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Rejeitado/Inativo
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Sempre forneça motivo claro. Afiliados podem corrigir CPF. Parceiros podem regularizar CNPJ/CNAE.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termos e Contratos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Termos e Contratos
              </CardTitle>
              <CardDescription>Documentos por tipo de vendedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Afiliado */}
              <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Termos de Indicação (Afiliado)</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Natureza eventual de indicações</li>
                  <li>• Limite de R$ 1.900/mês (sem habitualidade)</li>
                  <li>• Sem vínculo empregatício</li>
                  <li>• Comissão de 5-7% por venda convertida</li>
                  <li>• Pagamento via PIX sem NF</li>
                </ul>
              </div>

              {/* Parceiro PJ */}
              <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Contrato PJ Completo (Parceiro)</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Relação PJ sem vínculo empregatício</li>
                  <li>• Obrigatoriedade de CNPJ com CNAE compatível</li>
                  <li>• Responsabilidade fiscal (emissão de NF)</li>
                  <li>• Comissão de 10% por venda convertida</li>
                  <li>• Bônus trimestrais cumulativos</li>
                  <li>• Ciclo mensal de pagamentos via PIX</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">📝 Dados registrados no aceite:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Data e hora exatas</li>
                  <li>• Endereço IP</li>
                  <li>• Navegador/dispositivo</li>
                  <li>• Versão do documento</li>
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
              <CardDescription>Ciclos diferenciados por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="affiliate" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="affiliate" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Afiliado
                  </TabsTrigger>
                  <TabsTrigger value="partner" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Parceiro PJ
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="affiliate" className="mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10">1</Badge>
                      <p className="text-sm">📅 Dia 1: Afiliado solicita pagamento</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10">2</Badge>
                      <p className="text-sm">✅ <strong>Sem NF necessária</strong></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10">3</Badge>
                      <p className="text-sm">🔍 Admin aprova solicitação</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10">4</Badge>
                      <p className="text-sm">💳 Pagamento via PIX direto</p>
                    </div>
                  </div>
                  <Alert className="mt-4 bg-yellow-500/10 border-yellow-500/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-xs">
                      <strong>Limite:</strong> Máximo R$ 1.900/mês para não caracterizar atividade habitual.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="partner" className="mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10">1</Badge>
                      <p className="text-sm">📅 Dia 1: Parceiro solicita pagamento</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10">2</Badge>
                      <p className="text-sm">📎 <strong>Anexa Nota Fiscal (NF)</strong></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10">3</Badge>
                      <p className="text-sm">🔍 Admin revisa NF e solicitação</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10">4</Badge>
                      <p className="text-sm">✅ Aprova ou ❌ Rejeita (com motivo)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10">5</Badge>
                      <p className="text-sm">💳 PIX em até 5 dias úteis</p>
                    </div>
                  </div>
                  <Alert className="mt-4 bg-green-500/10 border-green-500/30">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs">
                      <strong>Sem limite!</strong> Ganhos ilimitados + bônus trimestrais incluídos no pagamento.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>

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
              <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/30">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <strong>⚠️ IMPORTANTE:</strong> Apenas <strong>Parceiros PJ</strong> são elegíveis para bônus trimestrais. 
                  Afiliados (CPF) podem fazer upgrade abrindo um MEI para se qualificar.
                </AlertDescription>
              </Alert>

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

          {/* Upgrade de Afiliado para Parceiro */}
          <Card className="border-2 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                Upgrade: Afiliado → Parceiro PJ
              </CardTitle>
              <CardDescription>Incentive afiliados a evoluírem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Por que incentivar o upgrade?</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Comissão sobe de 5-7% para <strong>10%</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Ganhos passam de R$ 1.900/mês para <strong>ilimitados</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Acesso a <strong>bônus trimestrais</strong> (até R$ 8.500!)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Materiais de divulgação exclusivos
                  </li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Como funciona o upgrade?
                </h4>
                <ol className="text-sm space-y-2 text-muted-foreground">
                  <li>1. Afiliado acessa <strong>/vendedor/upgrade</strong> no painel</li>
                  <li>2. Informa CNPJ (pode abrir MEI em 15 min no gov.br)</li>
                  <li>3. Sistema valida CNPJ ativo + CNAE compatível</li>
                  <li>4. Upgrade é aplicado automaticamente</li>
                  <li>5. Novo contrato PJ é apresentado para aceite</li>
                </ol>
              </div>

              <Alert className="bg-green-500/10 border-green-500/30">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs">
                  <strong>MEI Gratuito:</strong> Abertura em <a href="https://gov.br/mei" target="_blank" rel="noopener noreferrer" className="underline font-medium">gov.br/mei</a> leva 15 minutos e não tem custo. 
                  Atividades recomendadas: Promotor de Vendas, Agenciador de Propaganda ou Representante Comercial.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* CNAEs Aceitos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CNAEs Aceitos (Parceiro PJ)
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
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  CNAE pode estar como atividade principal ou secundária. MEIs geralmente usam 7319-0/02 (Promoção de vendas).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
