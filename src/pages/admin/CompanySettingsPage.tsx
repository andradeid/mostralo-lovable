import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileText, Code } from 'lucide-react';
import { CompanyInfoEditor, ContractorInfo } from '@/components/shared/CompanyInfoEditor';
import { supabase } from '@/integrations/supabase/client';

const CompanySettingsPage = () => {
  const [contractorInfo, setContractorInfo] = useState<ContractorInfo | null>(null);

  useEffect(() => {
    fetchContractorInfo();
  }, []);

  const fetchContractorInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('value')
        .eq('key', 'contractor_info')
        .single();

      if (!error && data) {
        setContractorInfo(data.value as unknown as ContractorInfo);
      }
    } catch (error) {
      console.error('Error fetching contractor info:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações da Empresa</h1>
        <p className="text-muted-foreground">
          Gerencie os dados oficiais usados em contratos de lojistas e vendedores
        </p>
      </div>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Dados da Empresa Contratada</CardTitle>
              <CardDescription>
                Informações oficiais da Mostralo para contratos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CompanyInfoEditor 
            mode="full"
            onDataLoaded={(data) => setContractorInfo(data)}
            onSaveSuccess={fetchContractorInfo}
          />
        </CardContent>
      </Card>

      {/* Preview dos Placeholders */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Code className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Placeholders nos Contratos</CardTitle>
              <CardDescription>
                Veja como os dados aparecem quando substituídos nos contratos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {'{cnpj_contratada}'}
                  </code>
                </div>
                <p className="font-medium text-sm">
                  {contractorInfo?.cnpj || 'Não configurado'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {'{razao_social_contratada}'}
                  </code>
                </div>
                <p className="font-medium text-sm">
                  {contractorInfo?.company_name || 'Não configurado'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {'{endereco_contratada}'}
                </code>
              </div>
              <p className="font-medium text-sm">
                {contractorInfo?.full_address || 'Não configurado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uso nos Contratos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Onde são usados</CardTitle>
              <CardDescription>
                Estes dados aparecem automaticamente nos seguintes locais
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full" />
              <span>Contrato de adesão para lojistas (cadastro de lojas)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full" />
              <span>Contrato de parceria para vendedores</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full" />
              <span>Propostas comerciais enviadas a clientes</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full" />
              <span>Termos de uso e política de privacidade</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettingsPage;
