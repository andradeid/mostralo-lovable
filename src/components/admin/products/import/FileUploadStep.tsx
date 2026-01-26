import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Download, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface FileUploadStepProps {
  onFileSelect: (file: File) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 1000;
const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls'];

const COLUMN_INSTRUCTIONS = [
  { name: 'nome', required: true, desc: 'Nome do produto (obrigatório)', example: 'Pizza Margherita' },
  { name: 'preco', required: true, desc: 'Preço de venda (obrigatório). Use vírgula ou ponto como decimal', example: '39,90 ou 39.90' },
  { name: 'categoria', required: true, desc: 'Categoria do produto (obrigatório). Se não existir, será criada', example: 'Pizzas' },
  { name: 'descricao', required: false, desc: 'Descrição detalhada do produto', example: 'Pizza tradicional com molho...' },
  { name: 'disponivel', required: false, desc: 'Se o produto está disponível para venda. Valores: sim/não, s/n, 1/0', example: 'sim' },
  { name: 'mostrar_menu', required: false, desc: 'Se aparece no cardápio digital', example: 'sim' },
  { name: 'controlar_estoque', required: false, desc: 'Ativar controle de estoque', example: 'sim' },
  { name: 'quantidade_estoque', required: false, desc: 'Quantidade inicial em estoque', example: '50' },
  { name: 'alerta_estoque', required: false, desc: 'Quantidade mínima para alerta', example: '10' },
  { name: 'preco_oferta', required: false, desc: 'Preço promocional (aparece riscado)', example: '35,90' },
  { name: 'imagem_url', required: false, desc: 'URL da imagem do produto', example: 'https://...' },
  { name: 'variante_nome', required: false, desc: 'Nome da variação (ex: tamanho)', example: 'Grande' },
  { name: 'variante_preco', required: false, desc: 'Preço específico da variação', example: '45,00' },
];

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
        className={`border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-colors ${
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

      {/* Template Download & Instructions */}
      <div className="border rounded-lg overflow-hidden">
        {/* Download Section */}
        <div className="p-4 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Modelo de Planilha
            </p>
            <p className="text-sm text-muted-foreground">
              Baixe o modelo pronto para preencher
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/templates/importacao-produtos-modelo.csv" download>
              <Download className="mr-2 h-4 w-4" />
              Baixar Modelo CSV
            </a>
          </Button>
        </div>

        {/* Instructions Accordion */}
        <Accordion type="single" collapsible className="border-t">
          <AccordionItem value="instructions" className="border-b-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                Como preencher a planilha
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {/* Quick Tips */}
                <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Dicas rápidas
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>A primeira linha deve conter os nomes das colunas</li>
                    <li>Apenas <strong>nome</strong>, <strong>preco</strong> e <strong>categoria</strong> são obrigatórios</li>
                    <li>Categorias inexistentes serão criadas automaticamente</li>
                    <li>Para variantes: repita o produto com diferentes valores em <code className="bg-muted px-1 rounded">variante_nome</code></li>
                  </ul>
                </div>

                {/* Columns Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Coluna</th>
                        <th className="text-left p-2 font-medium hidden sm:table-cell">Descrição</th>
                        <th className="text-left p-2 font-medium">Exemplo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {COLUMN_INSTRUCTIONS.map((col) => (
                        <tr key={col.name} className="hover:bg-muted/20">
                          <td className="p-2">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                              {col.name}
                            </code>
                            {col.required && (
                              <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">
                                obrigatório
                              </Badge>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground hidden sm:table-cell">
                            {col.desc}
                          </td>
                          <td className="p-2 text-muted-foreground font-mono text-xs">
                            {col.example}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Variants Example */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="font-medium text-sm mb-2">Exemplo de produto com variantes:</p>
                  <div className="overflow-x-auto">
                    <pre className="text-xs bg-background p-2 rounded border font-mono whitespace-pre">
{`nome,preco,categoria,variante_nome,variante_preco
Coca-Cola,8.00,Bebidas,,
Coca-Cola,12.00,Bebidas,600ml,12.00
Coca-Cola,15.00,Bebidas,1 Litro,15.00`}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    → Cria 1 produto "Coca-Cola" com 2 variantes (600ml e 1 Litro)
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}