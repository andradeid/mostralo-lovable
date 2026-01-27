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
  productsUpdated?: number;
  productsSkipped?: number;
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

export interface DuplicateCheckResult {
  success: boolean;
  newProducts: number;
  existingProducts: number;
  duplicates: Array<{
    productName: string;
    category: string;
    existingId: string;
    existingPrice: number;
    newPrice: number;
  }>;
}

export type DuplicateAction = 'skip' | 'update' | 'create';

export interface ImageOptions {
  updateFromSpreadsheet: boolean;
  searchMissing: boolean;
  replaceAll: boolean;
}

export function useProductImport(storeId: string | null) {
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResult | null>(null);
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

  const checkDuplicates = async (
    products: ProductWithVariants[],
    createMissingCategories: boolean
  ): Promise<DuplicateCheckResult | null> => {
    if (!storeId) {
      toast({
        title: 'Erro',
        description: 'Loja não identificada',
        variant: 'destructive',
      });
      return null;
    }

    setIsCheckingDuplicates(true);
    setDuplicateCheckResult(null);

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
          action: 'check-duplicates',
          storeId,
          createMissingCategories,
          products,
          fileName: 'check-duplicates',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as DuplicateCheckResult;
      setDuplicateCheckResult(result);
      return result;

    } catch (error: unknown) {
      console.error('Duplicate check error:', error);
      toast({
        title: 'Erro na verificação',
        description: error instanceof Error ? error.message : 'Erro ao verificar duplicatas',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const importProducts = async (
    products: ProductWithVariants[],
    createMissingCategories: boolean,
    fileName: string,
    duplicateAction?: DuplicateAction,
    imageOptions?: ImageOptions
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
          duplicateAction: duplicateAction || 'create',
          imageOptions: imageOptions || {
            updateFromSpreadsheet: true,
            searchMissing: false,
            replaceAll: false,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ImportResult;
      setImportResult(result);

      if (result.success) {
        const created = result.summary.productsCreated || 0;
        const updated = result.summary.productsUpdated || 0;
        const skipped = result.summary.productsSkipped || 0;
        
        let description = '';
        if (created > 0) description += `${created} criados`;
        if (updated > 0) description += `${description ? ', ' : ''}${updated} atualizados`;
        if (skipped > 0) description += `${description ? ', ' : ''}${skipped} pulados`;
        
        toast({
          title: 'Importação concluída!',
          description: description || 'Importação realizada com sucesso.',
        });
      } else if (result.errors.length > 0) {
        toast({
          title: 'Importação parcial',
          description: `${result.summary.productsCreated} produtos criados, ${result.errors.length} erros.`,
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
    setDuplicateCheckResult(null);
    setImportResult(null);
  };

  return {
    isValidating,
    isCheckingDuplicates,
    isImporting,
    validationResult,
    duplicateCheckResult,
    importResult,
    validateProducts,
    checkDuplicates,
    importProducts,
    reset,
  };
}
