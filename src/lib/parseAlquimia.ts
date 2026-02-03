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
  codigo?: string;
  ean?: string;
}

export interface AlquimiaProduct {
  nome: string;
  nomeOriginal: string;
  preco: number;
  precoOriginal: string;
  categoria: string;
  categoriaOriginal: string;
  laboratorio: string;
  quantidade_estoque: number;
  disponivel: boolean;
  mostrar_menu: boolean;
  controlar_estoque: boolean;
  alerta_estoque: number;
  isValid: boolean;
  errors: string[];
  rowIndex: number;
  codigo?: string;
  ean?: string;
}

export interface AlquimiaParseResult {
  products: AlquimiaProduct[];
  rawProducts: AlquimiaRawProduct[];
  headers: string[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
  categories: string[];
  formatDetected: 'novo' | 'legado';
}

/**
 * Detecta o formato do CSV Alquimia baseado nos headers
 * Novo formato: CODIGO;EAN;DESCRICAO;APRESENTACAO;PRO_NOMELABORATORIO;CLASSE;CUSTO;VENDA;ESTOQUE
 * Formato legado: Nome do Produto, Apresentação, Laboratório, Cla., Qtde, Custo, Total Custo, Venda, Total Venda
 */
function detectAlquimiaFormat(headers: string[]): 'novo' | 'legado' {
  const headersLower = headers.map(h => h.toLowerCase().trim());
  
  // Novo formato tem CODIGO, EAN, DESCRICAO
  if (headersLower.includes('codigo') || headersLower.includes('ean') || headersLower.includes('descricao')) {
    return 'novo';
  }
  
  // Formato legado tem "Nome do Produto" ou usa compactação
  if (headersLower.some(h => h.includes('nome do produto') || h === 'nome')) {
    return 'legado';
  }
  
  // Default para novo formato se tem estrutura simples de 9 colunas
  if (headers.length >= 7 && headers.length <= 12) {
    return 'novo';
  }
  
  return 'legado';
}

/**
 * Converte preço brasileiro (1.050,00 ou 17,49 ou 0,3) para número
 * Trata diferentes formatos: brasileiro (vírgula decimal), inglês (ponto decimal)
 * Suporta valores muito baixos como "0,3" (30 centavos)
 */
export function parseBrazilianPrice(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  if (!str) return 0;
  
  // Remove "R$" se existir e espaços extras
  let cleaned = str.replace(/R\$\s*/gi, '').replace(/\s+/g, '').trim();
  
  if (!cleaned) return 0;
  
  // Detectar o formato baseado nos separadores presentes
  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');
  
  if (hasComma && hasDot) {
    // Formato brasileiro com milhar e decimal: "1.234,56"
    // Ponto é separador de milhar, vírgula é decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    // Apenas vírgula: "17,49" ou "0,3" - formato brasileiro sem milhar
    // Vírgula é o separador decimal
    cleaned = cleaned.replace(',', '.');
  } else if (hasDot && !hasComma) {
    // Apenas ponto: pode ser "17.49" (decimal inglês) ou "1.234" (milhar brasileiro)
    // Se há mais de um ponto, são milhares; senão, é decimal
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Múltiplos pontos = separadores de milhar
      cleaned = cleaned.replace(/\./g, '');
    }
    // Se apenas um ponto, assumir que é decimal (formato inglês)
  }
  // Se não tem ponto nem vírgula, é um número inteiro
  
  const num = parseFloat(cleaned);
  
  // Log para debug de preços muito baixos
  if (!isNaN(num) && num > 0 && num < 1) {
    console.log(`[Alquimia] Preço baixo detectado: "${str}" -> ${num}`);
  }
  
  return isNaN(num) ? 0 : num;
}

/**
 * Mapeia código de classificação Alquimia para categoria Mostralo
 * Baseado no padrão do sistema Alquimia para farmácias
 */
export function mapAlquimiaCategory(cla: string | null | undefined): string {
  if (!cla) return 'Outros';
  
  const code = String(cla).toUpperCase().trim();
  
  // Se estiver vazio após trim, retorna Outros
  if (!code) return 'Outros';
  
  const categoryMap: Record<string, string> = {
    // Medicamentos Genéricos
    'GEN': 'Medicamentos Genéricos',
    'GE': 'Medicamentos Genéricos',
    'GENERICO': 'Medicamentos Genéricos',
    
    // Medicamentos (referência/similares)
    'MON': 'Medicamentos',
    'MO': 'Medicamentos',
    'BON': 'Medicamentos',
    'BO': 'Medicamentos',
    'MUL': 'Medicamentos',
    'SIM': 'Medicamentos',
    'REF': 'Medicamentos',
    'ETI': 'Medicamentos',
    'ETICOS / MARCA': 'Medicamentos',
    'ETICOS': 'Medicamentos',
    
    // Higiene e Perfumaria
    'PER': 'Higiene e Perfumaria',
    'PE': 'Higiene e Perfumaria',
    'HIG': 'Higiene e Perfumaria',
    'PERFUMARIA': 'Higiene e Perfumaria',
    
    // Primeiros Socorros
    'HOS': 'Primeiros Socorros e Materiais',
    'HO': 'Primeiros Socorros e Materiais',
    'MAT': 'Primeiros Socorros e Materiais',
    
    // Produtos Naturais
    'NAT': 'Produtos Naturais',
    'NA': 'Produtos Naturais',
    
    // Suplementos
    'SUP': 'Suplementos e Vitaminas',
    'SU': 'Suplementos e Vitaminas',
    'VIT': 'Suplementos e Vitaminas',
    
    // Conveniência
    'VAR': 'Conveniência',
    'VA': 'Conveniência',
    'DIV': 'Conveniência',
    
    // Controlados
    'PSI': 'Medicamentos Controlados',
    'PS': 'Medicamentos Controlados',
    'CON': 'Medicamentos Controlados',
    'CTR': 'Medicamentos Controlados',
    
    // Dermocosméticos
    'DER': 'Dermocosméticos',
    'DE': 'Dermocosméticos',
    'COS': 'Dermocosméticos',
    
    // Bebês e Mamães  
    'BEB': 'Bebês e Mamães',
    'BE': 'Bebês e Mamães',
    'INF': 'Bebês e Mamães',
  };
  
  // Busca exata primeiro
  if (categoryMap[code]) {
    return categoryMap[code];
  }
  
  // Busca por prefixo (primeiros 2-3 caracteres)
  const prefix3 = code.substring(0, 3);
  const prefix2 = code.substring(0, 2);
  
  if (categoryMap[prefix3]) {
    return categoryMap[prefix3];
  }
  
  if (categoryMap[prefix2]) {
    return categoryMap[prefix2];
  }
  
  // Se é um texto descritivo, tentar mapear
  const codeUpper = code.toUpperCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (codeUpper.includes(key) || key.includes(codeUpper)) {
      return value;
    }
  }
  
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
 * Parse CSV content into rows - suporta múltiplos separadores
 */
function parseCSVContent(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  return lines.map(line => {
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
 * Compacta array removendo células vazias consecutivas (formato legado)
 */
function compactAlquimiaRow(row: string[]): string[] {
  return row.filter(cell => cell !== null && cell !== undefined && cell.trim() !== '');
}

/**
 * Limpa header removendo caracteres especiais, BOM e acentos
 */
function cleanHeader(header: string): string {
  return header
    .replace(/[\u0000-\u001F\u007F-\u009F\uFEFF]/g, '') // Remove control chars e BOM
    .replace(/['"]/g, '') // Remove aspas
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim();
}

/**
 * Encontra índices das colunas no novo formato
 * IMPORTANTE: CODIGO e EAN NÃO devem ser usados como nome do produto
 */
function findColumnIndices(headers: string[]): Record<string, number> {
  const indices: Record<string, number> = {
    codigo: -1,
    ean: -1,
    nome: -1,
    apresentacao: -1,
    laboratorio: -1,
    classe: -1,
    custo: -1,
    venda: -1,
    estoque: -1,
  };
  
  // Limpar todos os headers
  const cleanedHeaders = headers.map(h => cleanHeader(h || ''));
  
  console.log('[Alquimia] Headers originais:', headers);
  console.log('[Alquimia] Headers limpos:', cleanedHeaders);
  
  cleanedHeaders.forEach((h, index) => {
    // CODIGO e EAN são identificadores, NÃO nome do produto
    if (h === 'codigo' || h === 'cod' || h === 'cod.') {
      indices.codigo = index;
    } else if (h === 'ean' || h === 'ean13' || h === 'gtin' || h === 'barras' || h === 'codigo_barras') {
      indices.ean = index;
    } else if (h === 'descricao' || h === 'nome' || h === 'nome do produto' || h === 'produto' || h === 'desc') {
      if (indices.nome === -1) {
        indices.nome = index;
      }
    } else if (h === 'apresentacao' || h === 'apres' || h === 'unidade') {
      indices.apresentacao = index;
    } else if (h === 'pro_nomelaboratorio' || h === 'laboratorio' || h === 'fabricante' || h === 'lab') {
      indices.laboratorio = index;
    } else if (h === 'classe' || h === 'cla' || h === 'cla.' || h === 'classificacao' || h === 'categoria' || h === 'grupo') {
      indices.classe = index;
    } else if (h === 'custo' || h === 'preco_custo' || h === 'p_custo' || h === 'vlr_custo') {
      indices.custo = index;
    } else if (h === 'venda' || h === 'preco' || h === 'preco_venda' || h === 'p_venda' || h === 'vlr_venda' || h === 'valor') {
      indices.venda = index;
    } else if (h === 'estoque' || h === 'qtde' || h === 'quantidade' || h === 'qtd' || h === 'saldo' || h === 'qt') {
      indices.estoque = index;
    }
  });
  
  // FALLBACK: Se não encontrou colunas essenciais, usar posição padrão Alquimia
  // Formato: CODIGO;EAN;DESCRICAO;APRESENTACAO;PRO_NOMELABORATORIO;CLASSE;CUSTO;VENDA;ESTOQUE
  const essentialsMissing = indices.nome === -1 || indices.venda === -1;
  
  if (essentialsMissing && headers.length >= 9) {
    console.log('[Alquimia] Colunas essenciais não encontradas, usando fallback por posição');
    
    // Verificar se parece formato Alquimia padrão (9 colunas)
    if (indices.codigo === -1) indices.codigo = 0;
    if (indices.ean === -1) indices.ean = 1;
    if (indices.nome === -1) indices.nome = 2;
    if (indices.apresentacao === -1) indices.apresentacao = 3;
    if (indices.laboratorio === -1) indices.laboratorio = 4;
    if (indices.classe === -1) indices.classe = 5;
    if (indices.custo === -1) indices.custo = 6;
    if (indices.venda === -1) indices.venda = 7;
    if (indices.estoque === -1) indices.estoque = 8;
  }
  
  console.log('[Alquimia] Mapeamento final de colunas:', {
    codigo: `${indices.codigo} (${headers[indices.codigo] || 'N/A'})`,
    ean: `${indices.ean} (${headers[indices.ean] || 'N/A'})`,
    nome: `${indices.nome} (${headers[indices.nome] || 'N/A'})`,
    venda: `${indices.venda} (${headers[indices.venda] || 'N/A'})`,
    estoque: `${indices.estoque} (${headers[indices.estoque] || 'N/A'})`,
  });
  
  return indices;
}

/**
 * Processa arquivo CSV no NOVO formato Alquimia
 * CODIGO;EAN;DESCRICAO;APRESENTACAO;PRO_NOMELABORATORIO;CLASSE;CUSTO;VENDA;ESTOQUE
 */
function parseNewFormat(rows: string[][], headerRowIndex: number): AlquimiaParseResult {
  const headers = rows[headerRowIndex];
  const cols = findColumnIndices(headers);
  
  console.log('[Alquimia NOVO] Headers:', headers);
  console.log('[Alquimia NOVO] Índices detectados:', cols);
  
  const rawProducts: AlquimiaRawProduct[] = [];
  const products: AlquimiaProduct[] = [];
  const categoriesSet = new Set<string>();
  let skippedRows = 0;
  
  // Processar linhas de dados
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Pular linhas vazias
    if (!row || row.length === 0 || row.every(cell => !cell.trim())) {
      skippedRows++;
      continue;
    }
    
    const nomeOriginal = cols.nome >= 0 ? String(row[cols.nome] || '').trim() : '';
    
    // Pular linhas sem nome ou com cabeçalhos repetidos
    if (!nomeOriginal || 
        nomeOriginal.toLowerCase() === 'descricao' ||
        nomeOriginal.toLowerCase() === 'nome' ||
        nomeOriginal.toLowerCase().includes('total')) {
      skippedRows++;
      continue;
    }
    
    const codigo = cols.codigo >= 0 ? String(row[cols.codigo] || '').trim() : '';
    const ean = cols.ean >= 0 ? String(row[cols.ean] || '').trim() : '';
    const apresentacao = cols.apresentacao >= 0 ? String(row[cols.apresentacao] || '').trim() : '';
    const laboratorio = cols.laboratorio >= 0 ? String(row[cols.laboratorio] || '').trim() : '';
    const classeOriginal = cols.classe >= 0 ? String(row[cols.classe] || '').trim() : '';
    const custoStr = cols.custo >= 0 ? String(row[cols.custo] || '0') : '0';
    const vendaStr = cols.venda >= 0 ? String(row[cols.venda] || '0') : '0';
    const estoqueStr = cols.estoque >= 0 ? String(row[cols.estoque] || '0') : '0';
    
    const custo = parseBrazilianPrice(custoStr);
    const venda = parseBrazilianPrice(vendaStr);
    const estoque = parseInt(estoqueStr.replace(/\D/g, '')) || 0;
    
    // Produto raw
    const rawProduct: AlquimiaRawProduct = {
      nomeOriginal,
      apresentacao,
      laboratorio,
      classificacao: classeOriginal,
      quantidade: estoque,
      custo,
      totalCusto: custo * estoque,
      venda,
      totalVenda: venda * estoque,
      rowIndex: i + 1,
      codigo,
      ean,
    };
    rawProducts.push(rawProduct);
    
    // Produto convertido
    // Nome: combinar descrição + apresentação para nome completo
    const nomeFinal = apresentacao 
      ? `${toTitleCase(nomeOriginal)} ${apresentacao}` 
      : toTitleCase(nomeOriginal);
    
    const categoria = mapAlquimiaCategory(classeOriginal);
    
    const errors: string[] = [];
    if (!nomeFinal) errors.push('Nome vazio');
    // Aceitar preços muito baixos (ex: R$ 0,30 = 30 centavos)
    // Apenas rejeitar preços zerados ou negativos
    if (venda <= 0) {
      console.log(`[Alquimia] Preço rejeitado na linha ${i + 1}: "${vendaStr}" -> ${venda}`);
      errors.push('Preço inválido');
    }
    if (estoque <= 0) errors.push('Sem estoque');
    
    categoriesSet.add(categoria);
    
    const product: AlquimiaProduct = {
      nome: nomeFinal.trim(),
      nomeOriginal,
      preco: venda,
      precoOriginal: vendaStr,
      categoria,
      categoriaOriginal: classeOriginal,
      laboratorio: toTitleCase(laboratorio),
      quantidade_estoque: estoque,
      disponivel: true,
      mostrar_menu: true,
      controlar_estoque: true,
      alerta_estoque: 5,
      isValid: errors.length === 0,
      errors,
      rowIndex: i + 1,
      codigo,
      ean,
    };
    products.push(product);
  }
  
  return {
    products,
    rawProducts,
    headers,
    totalRows: rows.length,
    validRows: products.filter(p => p.isValid).length,
    skippedRows,
    categories: Array.from(categoriesSet),
    formatDetected: 'novo',
  };
}

/**
 * Processa arquivo CSV no formato LEGADO Alquimia
 */
function parseLegacyFormat(rows: string[][], compactedRows: string[][], headerRowIndex: number): AlquimiaParseResult {
  const headers = compactedRows[headerRowIndex] || [];
  console.log('[Alquimia LEGADO] Header encontrado na linha', headerRowIndex, ':', headers.join(' | '));
  
  // Índices APÓS compactação (formato padrão Alquimia legado)
  const cols = {
    nome: 0,
    apresentacao: 1,
    laboratorio: 2,
    cla: 3,
    qtde: 4,
    custo: 5,
    totalCusto: 6,
    venda: 7,
    totalVenda: 8,
  };
  
  const dataRows = compactedRows.slice(headerRowIndex + 1);
  
  let skippedRows = 0;
  const rawProducts: AlquimiaRawProduct[] = [];
  const products: AlquimiaProduct[] = [];
  const categoriesSet = new Set<string>();
  
  dataRows.forEach((row, index) => {
    const actualRowIndex = headerRowIndex + 2 + index;
    
    if (!row || row.length === 0) {
      skippedRows++;
      return;
    }
    
    if (row.length < 5) {
      skippedRows++;
      return;
    }
    
    const nomeOriginal = String(row[cols.nome] || '').trim();
    
    if (!nomeOriginal || 
        nomeOriginal.toLowerCase().includes('total') ||
        nomeOriginal.toLowerCase().includes('subtotal') ||
        nomeOriginal.toLowerCase() === 'nome do produto') {
      skippedRows++;
      return;
    }
    
    const claOriginal = String(row[cols.cla] || '').trim();
    const qtde = parseInt(String(row[cols.qtde] || '0')) || 0;
    const vendaStr = String(row[cols.venda] || '0');
    const custoStr = String(row[cols.custo] || '0');
    
    const rawProduct: AlquimiaRawProduct = {
      nomeOriginal,
      apresentacao: String(row[cols.apresentacao] || '').trim(),
      laboratorio: String(row[cols.laboratorio] || '').trim(),
      classificacao: claOriginal,
      quantidade: qtde,
      custo: parseBrazilianPrice(custoStr),
      totalCusto: parseBrazilianPrice(String(row[cols.totalCusto] || '0')),
      venda: parseBrazilianPrice(vendaStr),
      totalVenda: parseBrazilianPrice(String(row[cols.totalVenda] || '0')),
      rowIndex: actualRowIndex,
    };
    rawProducts.push(rawProduct);
    
    const nome = toTitleCase(nomeOriginal);
    const preco = parseBrazilianPrice(vendaStr);
    const categoria = mapAlquimiaCategory(claOriginal);
    const laboratorio = toTitleCase(String(row[cols.laboratorio] || '').trim());
    
    const errors: string[] = [];
    if (!nome) errors.push('Nome vazio');
    // Aceitar preços muito baixos (ex: R$ 0,30 = 30 centavos)
    if (preco <= 0) {
      console.log(`[Alquimia LEGADO] Preço rejeitado na linha ${actualRowIndex}: "${vendaStr}" -> ${preco}`);
      errors.push('Preço inválido');
    }
    if (qtde <= 0) errors.push('Sem estoque');
    
    categoriesSet.add(categoria);
    
    const product: AlquimiaProduct = {
      nome,
      nomeOriginal,
      preco,
      precoOriginal: vendaStr,
      categoria,
      categoriaOriginal: claOriginal,
      laboratorio,
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
    totalRows: rows.length,
    validRows: products.filter(p => p.isValid).length,
    skippedRows,
    categories: Array.from(categoriesSet),
    formatDetected: 'legado',
  };
}

/**
 * Processa arquivo CSV e retorna produtos formatados
 * DETECTA AUTOMATICAMENTE o formato (novo ou legado)
 */
export async function parseAlquimiaCSV(file: File): Promise<AlquimiaParseResult> {
  const content = await file.text();
  const rawRows = parseCSVContent(content);
  
  // Encontrar a primeira linha não vazia para detectar formato
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    
    // Verificar se parece um cabeçalho
    const firstCell = (row[0] || '').toLowerCase().trim();
    const hasDataColumns = row.some(cell => {
      const c = (cell || '').toLowerCase().trim();
      return c === 'codigo' || c === 'ean' || c === 'descricao' || 
             c === 'nome' || c === 'nome do produto' || c === 'venda';
    });
    
    if (hasDataColumns) {
      headerRowIndex = i;
      break;
    }
  }
  
  const headers = rawRows[headerRowIndex] || [];
  const format = detectAlquimiaFormat(headers);
  
  console.log(`[Alquimia] Formato detectado: ${format}`);
  console.log(`[Alquimia] Header na linha ${headerRowIndex}:`, headers);
  
  if (format === 'novo') {
    return parseNewFormat(rawRows, headerRowIndex);
  }
  
  // Formato legado - usar compactação
  const compactedRows = rawRows.map(row => compactAlquimiaRow(row));
  
  // Encontrar cabeçalho nas linhas compactadas
  let legacyHeaderIndex = -1;
  for (let i = 0; i < Math.min(compactedRows.length, 30); i++) {
    const row = compactedRows[i];
    if (!row || row.length < 3) continue;
    
    const joinedRow = row.join(' ').toLowerCase();
    const hasNomeColumn = row.some(cell => {
      const cellStr = String(cell || '').toLowerCase().trim();
      return cellStr.includes('nome do produto') || 
             (cellStr === 'nome' && joinedRow.includes('venda'));
    });
    
    if (hasNomeColumn) {
      legacyHeaderIndex = i;
      break;
    }
  }
  
  if (legacyHeaderIndex === -1) {
    legacyHeaderIndex = 9; // Fallback padrão
  }
  
  return parseLegacyFormat(rawRows, compactedRows, legacyHeaderIndex);
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

// Funções legadas exportadas para compatibilidade
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
  
  return 9;
}

export function filterEmptyRows(rows: string[][]): string[][] {
  return rows.filter(row => {
    if (!row || !Array.isArray(row)) return false;
    return row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
  });
}
