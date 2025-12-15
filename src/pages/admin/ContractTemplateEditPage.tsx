import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, Eye, ChevronDown, Info, FileText, Building2, RefreshCw, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContractViewer } from "@/components/contract/ContractViewer";

interface ContractTemplate {
  id: string;
  version: string;
  company_name: string;
  company_cnpj: string;
  company_address: string | null;
  company_city: string;
  company_state: string | null;
  contract_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PLACEHOLDERS = [
  { key: "{empresa}", description: "Nome da empresa contratante" },
  { key: "{cnpj}", description: "CNPJ da empresa contratante" },
  { key: "{cidade}", description: "Cidade do foro" },
  { key: "{estado}", description: "Estado do foro" },
  { key: "{vendedor_nome}", description: "Nome do vendedor" },
  { key: "{vendedor_cnpj}", description: "CNPJ do vendedor" },
  { key: "{comissao_percentual}", description: "Percentual de comissão" },
  { key: "{tabela_bonus}", description: "Tabela de bônus do banco" },
  { key: "{faixas_manutencao}", description: "Faixas de manutenção de carteira" },
  { key: "{data_aceite}", description: "Data/hora do aceite" },
  { key: "{ip_aceite}", description: "IP do aceite" },
  { key: "{hash_verificacao}", description: "Hash de verificação" },
];

export default function ContractTemplateEditPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingCnpj, setFetchingCnpj] = useState(false);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form fields
  const [version, setVersion] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyCnpj, setCompanyCnpj] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [contractText, setContractText] = useState("");

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("salesperson_contract_templates")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setTemplate(data);
        setVersion(data.version);
        setCompanyName(data.company_name);
        setCompanyCnpj(data.company_cnpj);
        setCompanyAddress(data.company_address || "");
        setCompanyCity(data.company_city);
        setCompanyState(data.company_state || "");
        setContractText(data.contract_text);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyName || !companyCnpj || !companyCity || !contractText) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      if (template) {
        // Update existing
        const { error } = await supabase
          .from("salesperson_contract_templates")
          .update({
            version,
            company_name: companyName,
            company_cnpj: companyCnpj,
            company_address: companyAddress || null,
            company_city: companyCity,
            company_state: companyState || null,
            contract_text: contractText,
          })
          .eq("id", template.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("salesperson_contract_templates")
          .insert({
            version: version || "1.0",
            company_name: companyName,
            company_cnpj: companyCnpj,
            company_address: companyAddress || null,
            company_city: companyCity,
            company_state: companyState || null,
            contract_text: contractText,
            is_active: true,
          });

        if (error) throw error;
      }

      toast({
        title: "Contrato salvo",
        description: "O template do contrato foi atualizado com sucesso",
      });

      fetchTemplate();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFetchCnpjData = async () => {
    const cleanCnpj = companyCnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos",
        variant: "destructive",
      });
      return;
    }

    setFetchingCnpj(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-cnpj', {
        body: { 
          cnpj: companyCnpj,
          skip_cnae_validation: true
        }
      });

      if (error) throw error;

      if (!data?.valid) {
        toast({
          title: "CNPJ não encontrado",
          description: data?.error || "Verifique o CNPJ e tente novamente",
          variant: "destructive",
        });
        return;
      }

      // Auto-preencher campos
      setCompanyName(data.data.razao_social || '');
      setCompanyCity(data.data.municipio || '');
      setCompanyState(data.data.uf || '');
      
      // Montar endereço completo
      const endereco = [
        data.data.logradouro,
        data.data.numero,
        data.data.complemento
      ].filter(Boolean).join(', ');
      
      if (endereco) setCompanyAddress(endereco);

      toast({
        title: "✅ Dados encontrados!",
        description: `Empresa: ${data.data.razao_social}`,
      });

    } catch (err: any) {
      toast({
        title: "Erro na consulta",
        description: err.message || "Não foi possível buscar os dados",
        variant: "destructive",
      });
    } finally {
      setFetchingCnpj(false);
    }
  };

  const getPreviewText = () => {
    return contractText
      .replace(/{empresa}/g, companyName)
      .replace(/{cnpj}/g, companyCnpj)
      .replace(/{cidade}/g, companyCity)
      .replace(/{estado}/g, companyState)
      .replace(/{vendedor_nome}/g, "NOME DO VENDEDOR")
      .replace(/{vendedor_cnpj}/g, "00.000.000/0001-00")
      .replace(/{comissao_percentual}/g, "10")
      .replace(/{tabela_bonus}/g, "Bronze (10 vendas): R$ 500,00\nPrata (20 vendas): R$ 1.000,00\nOuro (30 vendas): R$ 2.000,00\nDiamante (50 vendas): R$ 5.000,00")
      .replace(/{data_aceite}/g, new Date().toLocaleString("pt-BR"))
      .replace(/{ip_aceite}/g, "192.168.1.1")
      .replace(/{hash_verificacao}/g, "abc123def456...");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Editar Contrato de Vendedor</h1>
          <p className="text-muted-foreground">
            Configure os dados da empresa e o texto do contrato
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Editar" : "Prévia"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {showPreview ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Prévia do Contrato
            </CardTitle>
            <CardDescription>
              Como o contrato aparecerá para os vendedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContractViewer
              contractText={getPreviewText()}
              companyName={companyName}
              companyCnpj={companyCnpj}
              companyCity={companyCity}
              companyState={companyState}
              version={version}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company">
              <Building2 className="h-4 w-4 mr-2" />
              Dados da Empresa
            </TabsTrigger>
            <TabsTrigger value="contract">
              <FileText className="h-4 w-4 mr-2" />
              Texto do Contrato
            </TabsTrigger>
            <TabsTrigger value="help">
              <Info className="h-4 w-4 mr-2" />
              Placeholders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa Contratante</CardTitle>
                <CardDescription>
                  Informações que aparecerão no cabeçalho do contrato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Versão do Contrato</Label>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="1.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Razão Social *</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Mostralo Tecnologia LTDA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCnpj">CNPJ *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="companyCnpj"
                        value={companyCnpj}
                        onChange={(e) => setCompanyCnpj(e.target.value)}
                        placeholder="00.000.000/0001-00"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFetchCnpjData}
                        disabled={fetchingCnpj || companyCnpj.replace(/\D/g, '').length !== 14}
                      >
                        {fetchingCnpj ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Endereço</Label>
                    <Input
                      id="companyAddress"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Rua Exemplo, 123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">Cidade (Foro) *</Label>
                    <Input
                      id="companyCity"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyState">Estado</Label>
                    <Input
                      id="companyState"
                      value={companyState}
                      onChange={(e) => setCompanyState(e.target.value)}
                      placeholder="SP"
                    />
                  </div>
                </div>

                {template && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Template Existente</AlertTitle>
                    <AlertDescription>
                      Última atualização: {new Date(template.updated_at).toLocaleString("pt-BR")}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>Texto do Contrato</CardTitle>
                <CardDescription>
                  Use os placeholders para inserir dados dinâmicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Digite o texto completo do contrato..."
                  className="min-h-[600px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>Placeholders Disponíveis</CardTitle>
                <CardDescription>
                  Use estes códigos no texto do contrato para inserir dados dinâmicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PLACEHOLDERS.map((p) => (
                    <div
                      key={p.key}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <Badge variant="secondary" className="font-mono">
                          {p.key}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {p.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(p.key);
                          toast({ title: "Copiado!", description: p.key });
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  ))}
                </div>

                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Dica</AlertTitle>
                  <AlertDescription>
                    Os placeholders serão substituídos automaticamente quando o vendedor
                    visualizar ou aceitar o contrato. Os dados da empresa vêm dos campos
                    acima, e os dados do vendedor são preenchidos no momento do aceite.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
