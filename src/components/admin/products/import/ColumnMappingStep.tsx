import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { REQUIRED_COLUMNS, OPTIONAL_COLUMNS, validateMapping } from '@/lib/parseSpreadsheet';

interface ColumnMappingStepProps {
  headers: string[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  previewData: Record<string, unknown>[];
  onBack: () => void;
  onNext: () => void;
}

const ALL_FIELDS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome do Produto',
  preco: 'Preço',
  categoria: 'Categoria',
  descricao: 'Descrição',
  disponivel: 'Disponível',
  mostrar_menu: 'Mostrar no Menu',
  controlar_estoque: 'Controlar Estoque',
  quantidade_estoque: 'Quantidade',
  alerta_estoque: 'Alerta Estoque',
  preco_oferta: 'Preço Oferta',
  imagem_url: 'URL da Imagem',
  variante_nome: 'Nome Variante',
  variante_preco: 'Preço Variante',
};

export function ColumnMappingStep({
  headers,
  mapping,
  onMappingChange,
  previewData,
  onBack,
  onNext,
}: ColumnMappingStepProps) {
  const validation = validateMapping(mapping);

  const handleMappingChange = (header: string, field: string) => {
    const newMapping = { ...mapping };
    if (field === 'none') {
      delete newMapping[header];
    } else {
      // Remove any existing mapping to this field
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === field) delete newMapping[key];
      });
      newMapping[header] = field;
    }
    onMappingChange(newMapping);
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex flex-wrap gap-2">
        {REQUIRED_COLUMNS.map(col => {
          const isMapped = Object.values(mapping).includes(col);
          return (
            <Badge key={col} variant={isMapped ? 'default' : 'destructive'}>
              {isMapped && <Check className="mr-1 h-3 w-3" />}
              {FIELD_LABELS[col]}
            </Badge>
          );
        })}
      </div>

      {/* Mapping Table */}
      <div className="border rounded-lg overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Coluna do Arquivo</TableHead>
              <TableHead className="w-[200px]">Mapear para</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map(header => (
              <TableRow key={header}>
                <TableCell className="font-medium">{header}</TableCell>
                <TableCell>
                  <Select
                    value={mapping[header] || 'none'}
                    onValueChange={(value) => handleMappingChange(header, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ignorar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Ignorar —</SelectItem>
                      {ALL_FIELDS.map(field => (
                        <SelectItem key={field} value={field}>
                          {FIELD_LABELS[field]}
                          {REQUIRED_COLUMNS.includes(field) && ' *'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {previewData.slice(0, 2).map((row, i) => (
                    <span key={i}>
                      {String(row[header] || '—').slice(0, 30)}
                      {i < 1 && ', '}
                    </span>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!validation.isValid}>
          Próximo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
