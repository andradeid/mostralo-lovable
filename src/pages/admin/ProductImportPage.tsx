import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Upload, Columns, CheckCircle, Download as DownloadIcon } from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useProductImport } from '@/hooks/useProductImport';
import { FileUploadStep } from '@/components/admin/products/import/FileUploadStep';
import { ColumnMappingStep } from '@/components/admin/products/import/ColumnMappingStep';
import { PreviewValidationStep } from '@/components/admin/products/import/PreviewValidationStep';
import { ImportConfirmationStep } from '@/components/admin/products/import/ImportConfirmationStep';
import { ImportResultsDialog } from '@/components/admin/products/import/ImportResultsDialog';
import { 
  parseSpreadsheet, 
  mapRowToProduct, 
  groupProductsWithVariants,
  validateMapping,
  ParsedRow,
  ProductWithVariants,
} from '@/lib/parseSpreadsheet';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'confirmation';

const STEPS: { key: ImportStep; label: string; icon: React.ElementType }[] = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'mapping', label: 'Mapeamento', icon: Columns },
  { key: 'preview', label: 'Validação', icon: CheckCircle },
  { key: 'confirmation', label: 'Importar', icon: DownloadIcon },
];

export default function ProductImportPage() {
  const navigate = useNavigate();
  const { storeId } = useStoreAccess();
  const { 
    isValidating, 
    isImporting, 
    validationResult, 
    importResult,
    validateProducts, 
    importProducts,
    reset: resetImport,
  } = useProductImport(storeId);

  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [createMissingCategories, setCreateMissingCategories] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    try {
      const result = await parseSpreadsheet(selectedFile);
      
      setFile(selectedFile);
      setHeaders(result.headers);
      setRawData(result.data);
      setColumnMapping(result.detectedMapping);
      setCurrentStep('mapping');
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  }, []);

  const handleMappingComplete = useCallback(() => {
    const validation = validateMapping(columnMapping);
    
    if (!validation.isValid) {
      return;
    }

    // Map raw data to parsed rows
    const mapped = rawData.map((row, index) => 
      mapRowToProduct(row, columnMapping, index + 2)
    );
    setParsedRows(mapped);

    // Group by product name to handle variants
    const grouped = groupProductsWithVariants(mapped);
    setProducts(grouped);

    setCurrentStep('preview');
  }, [columnMapping, rawData]);

  const handleValidate = useCallback(async () => {
    await validateProducts(products, createMissingCategories);
  }, [products, createMissingCategories, validateProducts]);

  const handleImport = useCallback(async () => {
    if (!file) return;
    
    const result = await importProducts(products, createMissingCategories, file.name);
    
    if (result) {
      setShowResults(true);
    }
  }, [file, products, createMissingCategories, importProducts]);

  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setFile(null);
    setHeaders([]);
    setRawData([]);
    setColumnMapping({});
    setParsedRows([]);
    setProducts([]);
    setCreateMissingCategories(true);
    setShowResults(false);
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
          <h1 className="text-2xl font-bold">Importar Produtos</h1>
          <p className="text-muted-foreground">
            Importe produtos em massa a partir de uma planilha CSV ou Excel
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
                      <StepIcon className="h-4 w-4" />
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
            {currentStep === 'upload' && 'Selecione a Planilha'}
            {currentStep === 'mapping' && 'Mapeie as Colunas'}
            {currentStep === 'preview' && 'Valide os Dados'}
            {currentStep === 'confirmation' && 'Confirme a Importação'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'upload' && 'Faça upload de um arquivo CSV ou Excel (.xlsx, .xls)'}
            {currentStep === 'mapping' && 'Verifique se as colunas estão mapeadas corretamente'}
            {currentStep === 'preview' && 'Revise os produtos e corrija erros antes de importar'}
            {currentStep === 'confirmation' && 'Confirme os dados e inicie a importação'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'upload' && (
            <FileUploadStep onFileSelect={handleFileSelect} />
          )}

          {currentStep === 'mapping' && (
            <ColumnMappingStep
              headers={headers}
              mapping={columnMapping}
              onMappingChange={setColumnMapping}
              previewData={rawData.slice(0, 3)}
              onBack={handleBack}
              onNext={handleMappingComplete}
            />
          )}

          {currentStep === 'preview' && (
            <PreviewValidationStep
              products={products}
              validationResult={validationResult}
              isValidating={isValidating}
              createMissingCategories={createMissingCategories}
              onCreateMissingCategoriesChange={setCreateMissingCategories}
              onValidate={handleValidate}
              onBack={handleBack}
              onNext={() => setCurrentStep('confirmation')}
            />
          )}

          {currentStep === 'confirmation' && (
            <ImportConfirmationStep
              products={products}
              validationResult={validationResult}
              createMissingCategories={createMissingCategories}
              fileName={file?.name || ''}
              isImporting={isImporting}
              onBack={handleBack}
              onImport={handleImport}
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
