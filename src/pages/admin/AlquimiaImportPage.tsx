import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Upload, Eye, Download as DownloadIcon, CheckCircle } from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useProductImport } from '@/hooks/useProductImport';
import { useImageSearch } from '@/hooks/useImageSearch';
import { useToast } from '@/hooks/use-toast';
import { AlquimiaUploadStep } from '@/components/admin/products/import/AlquimiaUploadStep';
import { AlquimiaPreviewStep } from '@/components/admin/products/import/AlquimiaPreviewStep';
import { AlquimiaExportStep } from '@/components/admin/products/import/AlquimiaExportStep';
import { ImportResultsDialog } from '@/components/admin/products/import/ImportResultsDialog';
import { ImageSearchProgress } from '@/components/admin/products/import/ImageSearchProgress';
import { 
  parseAlquimiaCSV, 
  AlquimiaProduct,
} from '@/lib/parseAlquimia';
import { ProductWithVariants } from '@/lib/parseSpreadsheet';

type ImportStep = 'upload' | 'preview' | 'export';

const STEPS: { key: ImportStep; label: string; icon: React.ElementType }[] = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'export', label: 'Exportar', icon: DownloadIcon },
];

export default function AlquimiaImportPage() {
  const navigate = useNavigate();
  const { storeId } = useStoreAccess();
  const { toast } = useToast();
  const { 
    isImporting, 
    importResult,
    importProducts,
    reset: resetImport,
  } = useProductImport(storeId);

  const {
    isSearching,
    progress: searchProgress,
    searchImages,
    cancelSearch,
  } = useImageSearch();

  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<AlquimiaProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [skipImageSearch, setSkipImageSearch] = useState(false);

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setIsProcessing(true);
    
    try {
      const result = await parseAlquimiaCSV(selectedFile);
      
      setFile(selectedFile);
      setProducts(result.products);
      setCategories(result.categories);
      
      toast({
        title: 'Arquivo processado!',
        description: `${result.validRows} produtos encontrados em ${result.categories.length} categorias.`,
      });
      
      setCurrentStep('preview');
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleProductsChange = useCallback((updatedProducts: AlquimiaProduct[]) => {
    setProducts(updatedProducts);
    // Atualizar lista de categorias
    const newCategories = [...new Set(updatedProducts.map(p => p.categoria))];
    setCategories(newCategories);
  }, []);

  const handleSaveToDatabase = useCallback(async (createMissingCategories: boolean, searchImagesEnabled: boolean) => {
    if (!file || !storeId) return;
    
    // Converter produtos Alquimia para o formato esperado pelo importador (ProductWithVariants)
    const validProducts = products.filter(p => p.isValid);
    
    let productsWithImages = validProducts;
    
    // Se busca de imagens está habilitada e não foi pulada
    if (searchImagesEnabled && !skipImageSearch) {
      // Buscar imagens para os produtos
      const imageResults = await searchImages(
        validProducts.map(p => ({ nome: p.nome, laboratorio: p.laboratorio })),
        storeId
      );
      
      // Aplicar URLs de imagem aos produtos
      productsWithImages = validProducts.map((p, index) => {
        const imageResult = imageResults.find(r => r.productIndex === index);
        return {
          ...p,
          imagem_url: imageResult?.imageUrl || undefined,
        };
      });
    }
    
    const productsForImport: ProductWithVariants[] = productsWithImages.map(p => ({
      nome: p.nome,
      preco: p.preco,
      categoria: p.categoria,
      disponivel: p.disponivel,
      mostrar_menu: p.mostrar_menu,
      controlar_estoque: p.controlar_estoque,
      quantidade_estoque: p.quantidade_estoque,
      alerta_estoque: p.alerta_estoque,
      imagem_url: (p as any).imagem_url,
      variantes: [], // Sem variantes na importação Alquimia
    }));
    
    const result = await importProducts(productsForImport, createMissingCategories, file.name);
    
    if (result) {
      setShowResults(true);
    }
  }, [file, products, importProducts, storeId, searchImages, skipImageSearch]);

  const handleSkipImageSearch = useCallback(() => {
    setSkipImageSearch(true);
    cancelSearch();
  }, [cancelSearch]);

  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setFile(null);
    setProducts([]);
    setCategories([]);
    setShowResults(false);
    setSkipImageSearch(false);
    resetImport();
  }, [resetImport]);

  const handleBack = useCallback(() => {
    const stepIndex = STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].key);
    }
  }, [currentStep]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/products')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Importar do Alquimia</h1>
          <p className="text-muted-foreground">
            Importe produtos do sistema Alquimia com conversão automática
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.key === currentStep;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-2 ${
                      isActive ? 'text-primary font-medium' : 
                      isCompleted ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-green-100 text-green-600' : 'bg-muted'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 'upload' && 'Selecione a Planilha do Alquimia'}
            {currentStep === 'preview' && 'Revise os Dados Convertidos'}
            {currentStep === 'export' && 'Exporte ou Salve os Produtos'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'upload' && 'Faça upload de um arquivo CSV exportado do sistema Alquimia'}
            {currentStep === 'preview' && 'Verifique os dados convertidos e faça ajustes se necessário'}
            {currentStep === 'export' && 'Escolha baixar o CSV convertido ou salvar diretamente no Mostralo'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'upload' && (
            <AlquimiaUploadStep 
              onFileSelect={handleFileSelect} 
              isLoading={isProcessing}
            />
          )}

          {currentStep === 'preview' && (
            <AlquimiaPreviewStep
              products={products}
              categories={categories}
              onProductsChange={handleProductsChange}
              onBack={handleBack}
              onNext={() => setCurrentStep('export')}
            />
          )}

          {currentStep === 'export' && !isSearching && (
            <AlquimiaExportStep
              products={products}
              categories={categories}
              fileName={file?.name || 'alquimia'}
              onBack={handleBack}
              onSaveToDatabase={handleSaveToDatabase}
              isImporting={isImporting || isSearching}
            />
          )}

          {isSearching && (
            <ImageSearchProgress
              progress={searchProgress}
              onCancel={cancelSearch}
              onSkip={handleSkipImageSearch}
            />
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <ImportResultsDialog
        open={showResults}
        onOpenChange={setShowResults}
        result={importResult}
        onReset={handleReset}
        onNavigateToProducts={() => navigate('/dashboard/products')}
      />
    </div>
  );
}
