import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductWithVariants } from '@/lib/parseSpreadsheet';

interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string | number | null;
}

interface ImportSummary {
  totalRows: number;
  productsCreated?: number;
  validProducts?: number;
  categoriesCreated?: number;
  variantsCreated?: number;
  errors: number;
  newCategories?: number;
}

interface ValidationResult {
  success: boolean;
  errors: ImportError[];
  missingCategories: string[];
  summary: ImportSummary;
}

interface ImportResult {
  success: boolean;
  importLogId?: string;
  summary: ImportSummary;
  errors: ImportError[];
  createdCategories?: string[];
}

export function useProductImport(storeId: string | null) {
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const validateProducts = async (
    products: ProductWithVariants[],
    createMissingCategories: boolean
  ): Promise<ValidationResult | null> => {
    if (!storeId) {
      toast({
        title: 'Erro',
        description: 'Loja não identificada',
        variant: 'destructive',
      });
      return null;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro',
          description: 'Sessão expirada. Faça login novamente.',
          variant: 'destructive',
        });
        return null;
      }

      const response = await supabase.functions.invoke('import-products', {
        body: {
          action: 'validate',
          storeId,
          createMissingCategories,
          products,
          fileName: 'validation',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ValidationResult;
      setValidationResult(result);
      return result;

    } catch (error: unknown) {
      console.error('Validation error:', error);
      toast({
        title: 'Erro na validação',
        description: error instanceof Error ? error.message : 'Erro ao validar produtos',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const importProducts = async (
    products: ProductWithVariants[],
    createMissingCategories: boolean,
    fileName: string
  ): Promise<ImportResult | null> => {
    if (!storeId) {
      toast({
        title: 'Erro',
        description: 'Loja não identificada',
        variant: 'destructive',
      });
      return null;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro',
          description: 'Sessão expirada. Faça login novamente.',
          variant: 'destructive',
        });
        return null;
      }

      const response = await supabase.functions.invoke('import-products', {
        body: {
          action: 'import',
          storeId,
          createMissingCategories,
          products,
          fileName,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ImportResult;
      setImportResult(result);

      if (result.success) {
        toast({
          title: 'Importação concluída!',
          description: `${result.summary.productsCreated} produtos importados com sucesso.`,
        });
      } else if (result.errors.length > 0) {
        toast({
          title: 'Importação parcial',
          description: `${result.summary.productsCreated} produtos importados, ${result.errors.length} erros.`,
          variant: 'destructive',
        });
      }

      return result;

    } catch (error: unknown) {
      console.error('Import error:', error);
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro ao importar produtos',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setValidationResult(null);
    setImportResult(null);
  };

  return {
    isValidating,
    isImporting,
    validationResult,
    importResult,
    validateProducts,
    importProducts,
    reset,
  };
}
