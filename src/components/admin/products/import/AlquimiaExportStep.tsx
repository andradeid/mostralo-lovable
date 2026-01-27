import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download, 
  Database, 
  Loader2, 
  CheckCircle2, 
  Package,
  Tags,
  AlertCircle,
  Search,
  Image,
  Info,
  DollarSign,
  Calculator,
  Lightbulb
} from 'lucide-react';
import { AlquimiaProduct, exportToMostraloCSV, downloadCSV } from '@/lib/parseAlquimia';
import { supabase } from '@/integrations/supabase/client';

// Custo por busca baseado no plano Production SerpAPI
const COST_PER_SEARCH_BRL = 0.055;
const USD_TO_BRL = 5.50;

interface AlquimiaExportStepProps {
  products: AlquimiaProduct[];
  categories: string[];
  fileName: string;
  onBack: () => void;
  onSaveToDatabase: (createCategories: boolean, searchImages: boolean, importLimit: number | 'all') => Promise<void>;
  isImporting: boolean;
  onlyWithStock: boolean;
}

export function AlquimiaExportStep({
  products,
  categories,
  fileName,
  onBack,
  onSaveToDatabase,
  isImporting,
  onlyWithStock,
}: AlquimiaExportStepProps) {
  const [createMissingCategories, setCreateMissingCategories] = useState(true);
  const [searchImagesEnabled, setSearchImagesEnabled] = useState(false);
  const [imageSearchConfigured, setImageSearchConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [importLimit, setImportLimit] = useState<number | 'all'>(500);

  // Filtrar produtos com base na opção de estoque
  const validProducts = useMemo(() => {
    const allValid = products.filter(p => p.isValid);
    return onlyWithStock 
      ? allValid.filter(p => p.quantidade_estoque > 0)
      : allValid;
  }, [products, onlyWithStock]);

  const invalidProducts = products.filter(p => !p.isValid);

  // Quantidade a ser importada
  const productsToImport = useMemo(() => {
    return importLimit === 'all' 
      ? validProducts.length 
      : Math.min(importLimit, validProducts.length);
  }, [importLimit, validProducts.length]);

  // Cálculo de custos
  const costEstimate = useMemo(() => {
    const cost = productsToImport * COST_PER_SEARCH_BRL;
    const costUSD = cost / USD_TO_BRL;
    const remainingProducts = validProducts.length - productsToImport;
    const remainingBatches = importLimit !== 'all' && typeof importLimit === 'number'
      ? Math.ceil(remainingProducts / importLimit)
      : 0;
    
    return {
      costBRL: cost,
      costUSD,
      remainingProducts,
      remainingBatches,
      totalCostBRL: validProducts.length * COST_PER_SEARCH_BRL,
      totalCostUSD: (validProducts.length * COST_PER_SEARCH_BRL) / USD_TO_BRL,
    };
  }, [productsToImport, validProducts.length, importLimit]);

  useEffect(() => {
    checkImageSearchConfig();
  }, []);

  const checkImageSearchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('image_search_config' as any)
        .select('is_active, provider, api_key, search_engine_id, serpapi_key')
        .eq('is_active', true)
        .single();

      if (!error && data) {
        const config = data as any;
        // Check based on provider: SerpAPI only needs serpapi_key, Google needs both keys
        const isConfigured = config.provider === 'serpapi' 
          ? !!config.serpapi_key 
          : !!(config.api_key && config.search_engine_id);
        setImageSearchConfigured(isConfigured);
      }
    } catch {
      setImageSearchConfigured(false);
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleDownloadCSV = () => {
    const csvContent = exportToMostraloCSV(products);
    const outputFileName = fileName.replace(/\.(xls|xlsx)$/i, '') + '_mostralo.csv';
    downloadCSV(csvContent, outputFileName);
  };

  const handleSaveToDatabase = async () => {
    await onSaveToDatabase(createMissingCategories, searchImagesEnabled, importLimit);
  };

  const presetQuantities = [100, 250, 500, 1000];

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Resumo da Importação
          </CardTitle>
          <CardDescription>
            Arquivo: {fileName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{validProducts.length}</p>
              <p className="text-xs text-muted-foreground">
                {onlyWithStock ? 'Com Estoque' : 'Produtos Válidos'}
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Tags className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Categorias</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">
                {Math.round((validProducts.length / products.length) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Calculator className="h-6 w-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold">{productsToImport}</p>
              <p className="text-xs text-muted-foreground">A Importar</p>
            </div>
          </div>

          {/* Lista de Categorias */}
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">Categorias identificadas:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <span
                  key={cat}
                  className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opções de Exportação */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Opção 1: Baixar CSV */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-blue-600" />
              Baixar CSV
            </CardTitle>
            <CardDescription>
              Exporte os dados convertidos para usar no importador padrão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleDownloadCSV}
              disabled={validProducts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Planilha Convertida
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Formato compatível com Mostralo
            </p>
          </CardContent>
        </Card>

        {/* Opção 2: Salvar no Banco */}
        <Card className="relative overflow-hidden border-primary">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              Salvar no Mostralo
            </CardTitle>
          <CardDescription>
            Importe diretamente para o banco de dados da sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de Quantidade */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Quantidade a importar
              </Label>
              <Select
                value={importLimit === 'all' ? 'all' : importLimit.toString()}
                onValueChange={(val) => setImportLimit(val === 'all' ? 'all' : parseInt(val))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presetQuantities.map(qty => (
                    <SelectItem key={qty} value={qty.toString()}>
                      {qty} produtos
                    </SelectItem>
                  ))}
                  <SelectItem value="all">Todos ({validProducts.length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {importLimit !== 'all' && validProducts.length > 0 && (
              <div className="space-y-2">
                <Slider
                  value={[typeof importLimit === 'number' ? importLimit : validProducts.length]}
                  onValueChange={(val) => setImportLimit(val[0])}
                  min={50}
                  max={Math.min(validProducts.length, 2000)}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50</span>
                  <span>{Math.min(validProducts.length, 2000)}</span>
                </div>
              </div>
            )}

            {costEstimate.remainingProducts > 0 && (
              <p className="text-xs text-muted-foreground">
                Restam {costEstimate.remainingProducts} produtos para próximas importações 
                ({costEstimate.remainingBatches} lote{costEstimate.remainingBatches > 1 ? 's' : ''})
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="create-categories">Criar categorias novas</Label>
              <p className="text-xs text-muted-foreground">
                Cria categorias que ainda não existem na loja
              </p>
            </div>
            <Switch
              id="create-categories"
              checked={createMissingCategories}
              onCheckedChange={setCreateMissingCategories}
            />
          </div>

          {/* Toggle de Busca de Imagens */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="search-images" className="flex items-center gap-2">
                  Buscar imagens automaticamente
                  {!imageSearchConfigured && !checkingConfig && (
                    <span className="text-xs text-amber-600">(não configurado)</span>
                  )}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Busca e salva imagens do Google para cada produto
                </p>
              </div>
            </div>
            <Switch
              id="search-images"
              checked={searchImagesEnabled}
              onCheckedChange={setSearchImagesEnabled}
              disabled={!imageSearchConfigured || checkingConfig}
            />
          </div>

          {/* Painel de Custo Estimado */}
          {searchImagesEnabled && imageSearchConfigured && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  Estimativa de Custo (SerpAPI)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Este lote</p>
                    <p className="font-bold text-lg">
                      R$ {costEstimate.costBRL.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ~${costEstimate.costUSD.toFixed(2)} USD
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total (todos)</p>
                    <p className="font-bold text-lg text-muted-foreground">
                      R$ {costEstimate.totalCostBRL.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ~${costEstimate.totalCostUSD.toFixed(2)} USD
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-2 rounded bg-amber-100/50 dark:bg-amber-900/20">
                  <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {validProducts.length > 5000 
                      ? 'Recomendado: Plano Production ($150/mês = 15.000 buscas)'
                      : validProducts.length > 1000
                        ? 'Recomendado: Plano Developer ($75/mês = 5.000 buscas)'
                        : 'Plano Starter ($25/mês) é suficiente para este volume'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {searchImagesEnabled && imageSearchConfigured && !costEstimate.costBRL && (
            <Alert className="border-blue-500/30 bg-blue-500/5">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-xs">
                A busca de imagens processa em lotes de 50 produtos. Para {productsToImport} produtos, 
                o tempo estimado é de ~{Math.ceil(productsToImport / 50)} minuto(s).
              </AlertDescription>
            </Alert>
          )}

          {!imageSearchConfigured && !checkingConfig && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                Configure a API de busca de imagens em <strong>Dashboard → Busca de Imagens</strong> para habilitar esta função.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            className="w-full"
            onClick={handleSaveToDatabase}
            disabled={validProducts.length === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {searchImagesEnabled ? 'Buscando imagens...' : 'Importando...'}
              </>
            ) : (
              <>
                {searchImagesEnabled ? (
                  <Image className="h-4 w-4 mr-2" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Importar {productsToImport} Produtos
                {searchImagesEnabled && ' com Imagens'}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {searchImagesEnabled 
              ? `Custo estimado: ~R$ ${costEstimate.costBRL.toFixed(2)} para ${productsToImport} produtos`
              : 'Recomendado para importação direta'}
          </p>
        </CardContent>
      </Card>
    </div>

      {/* Aviso sobre produtos inválidos */}
      {invalidProducts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">
                  {invalidProducts.length} produto(s) com erros serão ignorados
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Volte para a etapa anterior para corrigir os erros antes de importar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  );
}
