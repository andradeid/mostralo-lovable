import { useCallback, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlquimiaUploadStepProps {
  onFileSelect: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export function AlquimiaUploadStep({ onFileSelect, isLoading }: AlquimiaUploadStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    // Validar tipo de arquivo
    const validExtensions = ['.csv', '.txt'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      setError('Formato inválido. Use arquivos .csv (exporte do Alquimia como CSV)');
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    try {
      await onFileSelect(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isLoading) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile, isLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) {
      setIsDragging(true);
    }
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClick = () => {
    if (!isLoading) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Área de Upload */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input 
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div>
                <p className="text-lg font-medium">Processando arquivo...</p>
                <p className="text-sm text-muted-foreground">Aguarde enquanto analisamos a planilha</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-primary/10">
                <FileSpreadsheet className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste sua planilha do Alquimia'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou clique para selecionar
                </p>
              </div>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
              <p className="text-xs text-muted-foreground">
                Formato aceito: .csv (exporte do Alquimia como CSV, máx. 10MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Regras de Conversão */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Conversões Automáticas
          </h3>
          
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground font-mono text-xs bg-background px-2 py-1 rounded">1-9</span>
              <div>
                <p className="font-medium">Cabeçalho técnico ignorado</p>
                <p className="text-muted-foreground">As primeiras linhas de metadados serão puladas automaticamente</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground font-mono text-xs bg-background px-2 py-1 rounded">↵</span>
              <div>
                <p className="font-medium">Linhas em branco ignoradas</p>
                <p className="text-muted-foreground">Linhas vazias entre produtos serão filtradas</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground font-mono text-xs bg-background px-2 py-1 rounded">R$</span>
              <div>
                <p className="font-medium">Preços convertidos</p>
                <p className="text-muted-foreground">
                  <code className="bg-background px-1 rounded">1.050,00</code> → <code className="bg-background px-1 rounded">R$ 1.050,00</code>
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground font-mono text-xs bg-background px-2 py-1 rounded">Aa</span>
              <div>
                <p className="font-medium">Nomes formatados</p>
                <p className="text-muted-foreground">
                  <code className="bg-background px-1 rounded">AMBROXOL 30MG</code> → <code className="bg-background px-1 rounded">Ambroxol 30mg</code>
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground font-mono text-xs bg-background px-2 py-1 rounded">📁</span>
              <div>
                <p className="font-medium">Categorias mapeadas</p>
                <p className="text-muted-foreground">
                  <code className="bg-background px-1 rounded">PER</code> → Higiene e Beleza | 
                  <code className="bg-background px-1 rounded ml-1">GEN/MON/BON</code> → Medicamentos
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dica sobre exportação */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary">Como exportar do Alquimia</p>
              <p className="text-sm text-muted-foreground mt-1">
                No sistema Alquimia, exporte o relatório de produtos como <strong>CSV</strong> (separado por vírgula ou ponto-e-vírgula). 
                Se o arquivo for .xls ou .xlsx, abra no Excel e salve como CSV.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
