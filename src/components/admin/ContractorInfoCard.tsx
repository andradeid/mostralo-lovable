import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Search, Save, Loader2, Check, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContractorInfo {
  company_name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  full_address: string;
}

const ContractorInfoCard = () => {
  const [contractorInfo, setContractorInfo] = useState<ContractorInfo>({
    company_name: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    full_address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

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
    } finally {
      setLoading(false);
    }
  };

  // Formatar CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // Buscar dados do CNPJ
  const handleSearchCNPJ = async () => {
    const cleanCNPJ = contractorInfo.cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      toast({
        title: 'CNPJ incompleto',
        description: 'Digite os 14 dígitos do CNPJ.',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    try {
      const response = await supabase.functions.invoke('validate-cnpj', {
        body: { cnpj: cleanCNPJ, skip_cnae_validation: true }
      });

      if (response.error) throw response.error;
      
      const result = response.data;
      
      if (!result.valid) {
        toast({
          title: 'CNPJ não encontrado',
          description: result.error || 'Não foi possível validar este CNPJ.',
          variant: 'destructive',
        });
        return;
      }

      const data = result.data;
      const fullAddress = `${data.logradouro || ''}, ${data.numero || 's/n'}${data.complemento ? `, ${data.complemento}` : ''}, ${data.municipio} - ${data.uf}, CEP ${data.cep}`;
      
      setContractorInfo({
        company_name: data.razao_social || '',
        cnpj: formatCNPJ(cleanCNPJ),
        address: `${data.logradouro || ''}, ${data.numero || 's/n'}${data.complemento ? `, ${data.complemento}` : ''}`,
        city: data.municipio || '',
        state: data.uf || '',
        cep: data.cep || '',
        full_address: fullAddress,
      });
      setHasChanges(true);
      
      toast({
        title: '✅ Dados carregados!',
        description: 'Os dados da empresa foram preenchidos automaticamente.',
      });
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      toast({
        title: 'Erro ao buscar CNPJ',
        description: 'Não foi possível consultar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    setSaving(true);
    try {
      // Recalcular full_address
      const fullAddress = `${contractorInfo.address}, ${contractorInfo.city} - ${contractorInfo.state}, CEP ${contractorInfo.cep}`;
      const updatedInfo = { ...contractorInfo, full_address: fullAddress };

      // Primeiro verificar se o registro existe
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('key', 'contractor_info')
        .single();

      if (existing) {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('company_settings')
          .update({
            value: updatedInfo as any,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'contractor_info');

        if (updateError) throw updateError;
      } else {
        // Inserir novo registro - usar any para evitar conflito de tipos
        const { error: insertError } = await (supabase as any)
          .from('company_settings')
          .insert({
            key: 'contractor_info',
            value: updatedInfo,
          });

        if (insertError) throw insertError;
      }

      setContractorInfo(updatedInfo);
      setHasChanges(false);
      
      toast({
        title: '✅ Dados salvos!',
        description: 'Os dados da contratada foram atualizados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ContractorInfo, value: string) => {
    if (field === 'cnpj') {
      value = formatCNPJ(value);
    }
    setContractorInfo(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Dados da Contratada (Mostralo)</CardTitle>
            <CardDescription>
              Estes dados serão usados nos contratos de lojistas e vendedores
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
            Os placeholders <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">{'{cnpj_contratada}'}</code> e <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">{'{endereco_contratada}'}</code> nos contratos serão substituídos por estes dados.
          </AlertDescription>
        </Alert>

        {/* CNPJ com busca */}
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <div className="flex gap-2">
            <Input
              id="cnpj"
              value={contractorInfo.cnpj}
              onChange={(e) => updateField('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleSearchCNPJ}
              disabled={searching || contractorInfo.cnpj.replace(/\D/g, '').length !== 14}
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Razão Social */}
        <div className="space-y-2">
          <Label htmlFor="company_name">Razão Social</Label>
          <Input
            id="company_name"
            value={contractorInfo.company_name}
            onChange={(e) => updateField('company_name', e.target.value)}
            placeholder="Nome da empresa"
          />
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={contractorInfo.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Rua, número, complemento"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={contractorInfo.cep}
              onChange={(e) => updateField('cep', e.target.value)}
              placeholder="00000-000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={contractorInfo.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Cidade"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={contractorInfo.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>

        {/* Preview do endereço completo */}
        {contractorInfo.address && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Endereço nos contratos:</p>
            <p className="text-sm font-medium">
              {contractorInfo.address}, {contractorInfo.city} - {contractorInfo.state}, CEP {contractorInfo.cep}
            </p>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : hasChanges ? (
              <Save className="h-4 w-4 mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Salvando...' : hasChanges ? 'Salvar Alterações' : 'Salvo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorInfoCard;