import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Search, Package, Tags, PackageCheck } from 'lucide-react';
import { AlquimiaProduct } from '@/lib/parseAlquimia';
import { cn } from '@/lib/utils';

interface AlquimiaPreviewStepProps {
  products: AlquimiaProduct[];
  categories: string[];
  onProductsChange: (products: AlquimiaProduct[]) => void;
  onBack: () => void;
  onNext: (onlyWithStock: boolean) => void;
}

// Categorias alinhadas com o mapeamento em parseAlquimia.ts
const AVAILABLE_CATEGORIES = [
  'Medicamentos',
  'Medicamentos Genéricos',
  'Medicamentos Controlados',
  'Higiene e Perfumaria',
  'Primeiros Socorros e Materiais',
  'Produtos Naturais',
  'Suplementos e Vitaminas',
  'Conveniência',
  'Dermocosméticos',
  'Bebês e Mamães',
  'Outros',
];

export function AlquimiaPreviewStep({
  products,
  categories,
  onProductsChange,
  onBack,
  onNext,
}: AlquimiaPreviewStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const validCount = products.filter(p => p.isValid).length;
  const invalidCount = products.filter(p => !p.isValid).length;
  const noStockCount = products.filter(p => p.quantidade_estoque <= 0).length;
  
  // Estatísticas de estoque - apenas produtos válidos com estoque > 0
  const stockStats = useMemo(() => {
    const withStock = products.filter(p => p.quantidade_estoque > 0 && p.errors.filter(e => e !== 'Sem estoque').length === 0);
    const withoutStock = products.filter(p => p.quantidade_estoque <= 0);
    return {
      withStock: withStock.length,
      withoutStock: withoutStock.length,
      percentage: products.length > 0 ? Math.round((withStock.length / products.length) * 100) : 0,
    };
  }, [products]);

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nomeOriginal.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.categoria === filterCategory;
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'valid' && product.isValid) ||
      (filterStatus === 'invalid' && !product.isValid);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Atualizar produto
  const handleProductUpdate = (index: number, field: keyof AlquimiaProduct, value: string | number) => {
    const globalIndex = products.findIndex(p => p.rowIndex === filteredProducts[index].rowIndex);
    if (globalIndex === -1) return;

    const updatedProducts = [...products];
    const product = { ...updatedProducts[globalIndex] };

    if (field === 'nome') {
      product.nome = value as string;
    } else if (field === 'preco') {
      product.preco = typeof value === 'number' ? value : parseFloat(value) || 0;
    } else if (field === 'categoria') {
      product.categoria = value as string;
    } else if (field === 'quantidade_estoque') {
      product.quantidade_estoque = typeof value === 'number' ? value : parseInt(value) || 0;
    }

    // Revalidar
    const errors: string[] = [];
    if (!product.nome) errors.push('Nome vazio');
    if (product.preco <= 0) errors.push('Preço inválido');
    product.errors = errors;
    product.isValid = errors.length === 0;

    updatedProducts[globalIndex] = product;
    onProductsChange(updatedProducts);
  };

  // Formatar preço para exibição
  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{validCount}</p>
                <p className="text-xs text-muted-foreground">Válidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <PackageCheck className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{stockStats.withStock}</p>
                <p className="text-xs text-muted-foreground">Com Estoque</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{invalidCount}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Tags className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-xs text-muted-foreground">Categorias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aviso sobre Estoque */}
      {noStockCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  {noStockCount} produto{noStockCount !== 1 ? 's' : ''} sem estoque detectado{noStockCount !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-amber-700">
                  Produtos com estoque = 0 não serão importados. Apenas produtos com estoque ≥ 1 serão processados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info sobre Estoque */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <PackageCheck className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-medium">
                {stockStats.withStock} produtos disponíveis para importação
              </p>
              <p className="text-xs text-muted-foreground">
                Apenas produtos com estoque ≥ 1 serão importados ({stockStats.percentage}% do total)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="valid">Válidos</SelectItem>
                <SelectItem value="invalid">Com Erros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Pré-visualização ({filteredProducts.length} produtos)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="min-w-[200px]">Nome Original → Convertido</TableHead>
                  <TableHead className="w-[120px]">Categoria</TableHead>
                  <TableHead className="w-[100px]">Preço</TableHead>
                  <TableHead className="w-[80px]">Qtde</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow 
                    key={product.rowIndex}
                    className={cn(!product.isValid && 'bg-destructive/5')}
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {product.rowIndex}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground line-through truncate max-w-[250px]">
                          {product.nomeOriginal}
                        </p>
                        <Input
                          value={product.nome}
                          onChange={(e) => handleProductUpdate(index, 'nome', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={product.categoria}
                        onValueChange={(value) => handleProductUpdate(index, 'categoria', value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {product.precoOriginal}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          {formatPrice(product.preco)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={product.quantidade_estoque}
                        onChange={(e) => handleProductUpdate(index, 'quantidade_estoque', e.target.value)}
                        className="h-8 w-16 text-sm"
                        min={0}
                      />
                    </TableCell>
                    <TableCell>
                      {product.isValid ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {product.errors.map((err, i) => (
                            <Badge 
                              key={i} 
                              variant={err === 'Sem estoque' ? 'secondary' : 'destructive'} 
                              className="text-xs"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {err}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={() => onNext(true)} 
          disabled={stockStats.withStock === 0}
        >
          Continuar ({stockStats.withStock} produtos com estoque)
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
