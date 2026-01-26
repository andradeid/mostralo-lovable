import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface FileUploadStepProps {
  onFileSelect: (file: File) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 1000;
const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls'];

export function FileUploadStep({ onFileSelect }: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = useCallback((file: File): boolean => {
    setError(null);

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(extension)) {
      setError('Formato inválido. Use CSV ou Excel (.xlsx, .xls)');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. Máximo 10MB.');
      return false;
    }

    return true;
  }, []);

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      toast({ title: 'Arquivo carregado', description: file.name });
      onFileSelect(file);
    }
  }, [validateFile, onFileSelect, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium">Arraste sua planilha aqui</p>
            <p className="text-muted-foreground">ou clique para selecionar</p>
          </div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleInputChange}
            className="hidden"
            id="file-upload"
          />
          <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Selecionar Arquivo
            </label>
          </Button>
          <p className="text-xs text-muted-foreground">
            CSV ou Excel • Máx. 10MB • Até {MAX_ROWS} linhas
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Template Download */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Modelo de Planilha</p>
            <p className="text-sm text-muted-foreground">
              Baixe o modelo para ver o formato esperado
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/templates/importacao-produtos-modelo.csv" download>
              <Download className="mr-2 h-4 w-4" />
              Baixar Modelo
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
