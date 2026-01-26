// Tipos para dados Alquimia
export interface AlquimiaRawProduct {
  nomeOriginal: string;
  apresentacao: string;
  laboratorio: string;
  classificacao: string;
  quantidade: number;
  custo: number;
  totalCusto: number;
  venda: number;
  totalVenda: number;
  rowIndex: number;
}

export interface AlquimiaProduct {
  nome: string;
  nomeOriginal: string;
  preco: number;
  precoOriginal: string;
  categoria: string;
  categoriaOriginal: string;
  quantidade_estoque: number;
  disponivel: boolean;
  mostrar_menu: boolean;
  controlar_estoque: boolean;
  alerta_estoque: number;
  isValid: boolean;
  errors: string[];
  rowIndex: number;
}

export interface AlquimiaParseResult {
  products: AlquimiaProduct[];
  rawProducts: AlquimiaRawProduct[];
  headers: string[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
  categories: string[];
}

/**
 * Encontra a linha onde começam os dados reais (após cabeçalho técnico)
 * Procura pela linha que contém "Nome do Produto" ou "Nome"
 */
export function findDataStartRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    
    const hasNomeColumn = row.some(cell => {
      const cellStr = String(cell || '').toLowerCase().trim();
      return cellStr.includes('nome do produto') || 
             cellStr === 'nome' ||
             cellStr.includes('produto');
    });
    
    if (hasNomeColumn) {
      return i;
    }
  }
  
  // Fallback: assumir linha 9 (índice 9) como padrão do Alquimia
  return 9;
}

/**
 * Converte preço brasileiro (1.050,00) para número (1050.00)
 */
export function parseBrazilianPrice(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  if (!str) return 0;
  
  // Remove "R$" se existir
  let cleaned = str.replace(/R\$\s*/gi, '');
  
  // Remove pontos de milhar (.) e troca vírgula por ponto
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Mapeia código de classificação Alquimia para categoria Mostralo
 */
export function mapAlquimiaCategory(cla: string | null | undefined): string {
  if (!cla) return 'Outros';
  
  const code = String(cla).toUpperCase().trim();
  
  if (code === 'PER') return 'Higiene e Beleza';
  if (['GEN', 'MON', 'BON'].includes(code)) return 'Medicamentos';
  
  return 'Outros';
}

/**
 * Converte texto CAIXA ALTA para Título
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';
  
  return String(text)
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      // Mantém siglas de 2-3 letras em maiúsculo (ex: "MG", "ML", "CPR")
      if (word.length <= 3 && /^[a-z]+$/.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

/**
 * Filtra linhas completamente vazias
 */
export function filterEmptyRows(rows: string[][]): string[][] {
  return rows.filter(row => {
    if (!row || !Array.isArray(row)) return false;
    return row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
  });
}

/**
 * Verifica se uma linha tem dados válidos de produto
 */
function isValidProductRow(row: string[], nomeIndex: number): boolean {
  if (!row || !Array.isArray(row)) return false;
  
  const nome = row[nomeIndex];
  if (!nome) return false;
  
  const nomeStr = String(nome).trim();
  // Ignora linhas que parecem ser cabeçalhos ou totais
  if (nomeStr.toLowerCase().includes('total') ||
      nomeStr.toLowerCase().includes('subtotal') ||
      nomeStr.toLowerCase() === 'nome do produto' ||
      nomeStr.toLowerCase() === 'nome') {
    return false;
  }
  
  return nomeStr.length > 0;
}

/**
 * Parse CSV content into rows
 */
function parseCSVContent(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  return lines.map(line => {
    // Simple CSV parsing (handles basic cases)
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    
    return cells;
  });
}

/**
 * Processa arquivo CSV e retorna produtos formatados
 */
export async function parseAlquimiaCSV(file: File): Promise<AlquimiaParseResult> {
  const content = await file.text();
  const rawRows = parseCSVContent(content);
  
  // Encontrar linha de cabeçalho
  const headerRowIndex = findDataStartRow(rawRows);
  const headers = rawRows[headerRowIndex] || [];
  
  // Identificar índices das colunas (pode variar ligeiramente)
  const nomeIndex = headers.findIndex(h => 
    h.toLowerCase().includes('nome') || h.toLowerCase().includes('produto')
  );
  const claIndex = headers.findIndex(h => 
    h.toLowerCase() === 'cla' || h.toLowerCase().includes('classif')
  );
  const qtdeIndex = headers.findIndex(h => 
    h.toLowerCase().includes('qtde') || h.toLowerCase().includes('quantidade')
  );
  const vendaIndex = headers.findIndex(h => 
    h.toLowerCase() === 'venda' || h.toLowerCase().includes('preço venda')
  );
  const custoIndex = headers.findIndex(h => 
    h.toLowerCase() === 'custo' || h.toLowerCase().includes('preço custo')
  );
  
  // Usar índices padrão se não encontrar
  const cols = {
    nome: nomeIndex >= 0 ? nomeIndex : 0,
    cla: claIndex >= 0 ? claIndex : 3,
    qtde: qtdeIndex >= 0 ? qtdeIndex : 4,
    venda: vendaIndex >= 0 ? vendaIndex : 7,
    custo: custoIndex >= 0 ? custoIndex : 5,
  };
  
  // Extrair dados (pulando cabeçalho)
  const dataRows = rawRows.slice(headerRowIndex + 1);
  
  // Filtrar linhas vazias (CRÍTICO - dica do Gemini)
  const validDataRows = filterEmptyRows(dataRows);
  
  let skippedRows = 0;
  const rawProducts: AlquimiaRawProduct[] = [];
  const products: AlquimiaProduct[] = [];
  const categoriesSet = new Set<string>();
  
  validDataRows.forEach((row, index) => {
    const actualRowIndex = headerRowIndex + 2 + index; // +2 para 1-indexed e pular header
    
    if (!isValidProductRow(row, cols.nome)) {
      skippedRows++;
      return;
    }
    
    const nomeOriginal = String(row[cols.nome] || '').trim();
    const claOriginal = String(row[cols.cla] || '').trim();
    const qtde = parseInt(String(row[cols.qtde] || '0')) || 0;
    const vendaStr = String(row[cols.venda] || '0');
    const custoStr = String(row[cols.custo] || '0');
    
    // Produto raw (dados originais)
    const rawProduct: AlquimiaRawProduct = {
      nomeOriginal,
      apresentacao: String(row[1] || '').trim(),
      laboratorio: String(row[2] || '').trim(),
      classificacao: claOriginal,
      quantidade: qtde,
      custo: parseBrazilianPrice(custoStr),
      totalCusto: parseBrazilianPrice(String(row[6] || '0')),
      venda: parseBrazilianPrice(vendaStr),
      totalVenda: parseBrazilianPrice(String(row[8] || '0')),
      rowIndex: actualRowIndex,
    };
    rawProducts.push(rawProduct);
    
    // Produto convertido
    const nome = toTitleCase(nomeOriginal);
    const preco = parseBrazilianPrice(vendaStr);
    const categoria = mapAlquimiaCategory(claOriginal);
    
    const errors: string[] = [];
    if (!nome) errors.push('Nome vazio');
    if (preco <= 0) errors.push('Preço inválido');
    
    categoriesSet.add(categoria);
    
    const product: AlquimiaProduct = {
      nome,
      nomeOriginal,
      preco,
      precoOriginal: vendaStr,
      categoria,
      categoriaOriginal: claOriginal,
      quantidade_estoque: qtde,
      disponivel: true,
      mostrar_menu: true,
      controlar_estoque: true,
      alerta_estoque: 5,
      isValid: errors.length === 0,
      errors,
      rowIndex: actualRowIndex,
    };
    products.push(product);
  });
  
  return {
    products,
    rawProducts,
    headers,
    totalRows: rawRows.length,
    validRows: products.length,
    skippedRows,
    categories: Array.from(categoriesSet),
  };
}

/**
 * Exporta produtos para CSV no formato Mostralo
 */
export function exportToMostraloCSV(products: AlquimiaProduct[]): string {
  const headers = [
    'nome',
    'preco',
    'categoria',
    'disponivel',
    'mostrar_menu',
    'controlar_estoque',
    'quantidade_estoque',
    'alerta_estoque'
  ];
  
  const rows = products
    .filter(p => p.isValid)
    .map(p => [
      `"${p.nome.replace(/"/g, '""')}"`,
      p.preco.toFixed(2),
      `"${p.categoria}"`,
      'sim',
      'sim',
      'sim',
      p.quantidade_estoque.toString(),
      p.alerta_estoque.toString()
    ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Gera download do arquivo CSV
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
