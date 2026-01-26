// Native CSV/XLSX parser without external dependencies

export interface ParsedRow {
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  disponivel?: boolean;
  mostrar_menu?: boolean;
  controlar_estoque?: boolean;
  quantidade_estoque?: number;
  alerta_estoque?: number;
  preco_oferta?: number | null;
  imagem_url?: string;
  variante_nome?: string;
  variante_preco?: number;
  _rowNumber: number;
}

export interface ProductWithVariants {
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  disponivel?: boolean;
  mostrar_menu?: boolean;
  controlar_estoque?: boolean;
  quantidade_estoque?: number;
  alerta_estoque?: number;
  preco_oferta?: number | null;
  imagem_url?: string;
  variantes?: { nome: string; preco: number; preco_oferta?: number | null; disponivel?: boolean }[];
}

// Common column mappings (Portuguese variations)
const COLUMN_MAPPINGS: Record<string, string> = {
  // nome
  'nome': 'nome',
  'name': 'nome',
  'produto': 'nome',
  'product': 'nome',
  'nome do produto': 'nome',
  'product name': 'nome',
  
  // preco
  'preco': 'preco',
  'preço': 'preco',
  'price': 'preco',
  'valor': 'preco',
  'preco de venda': 'preco',
  'preço de venda': 'preco',
  
  // categoria
  'categoria': 'categoria',
  'category': 'categoria',
  'cat': 'categoria',
  
  // descricao
  'descricao': 'descricao',
  'descrição': 'descricao',
  'description': 'descricao',
  'desc': 'descricao',
  
  // disponivel
  'disponivel': 'disponivel',
  'disponível': 'disponivel',
  'ativo': 'disponivel',
  'active': 'disponivel',
  'available': 'disponivel',
  
  // mostrar_menu
  'mostrar_menu': 'mostrar_menu',
  'mostrar no menu': 'mostrar_menu',
  'exibir': 'mostrar_menu',
  'show_in_menu': 'mostrar_menu',
  
  // controlar_estoque
  'controlar_estoque': 'controlar_estoque',
  'controlar estoque': 'controlar_estoque',
  'estoque': 'controlar_estoque',
  'track_stock': 'controlar_estoque',
  
  // quantidade_estoque
  'quantidade_estoque': 'quantidade_estoque',
  'quantidade': 'quantidade_estoque',
  'qtd': 'quantidade_estoque',
  'stock': 'quantidade_estoque',
  'stock_quantity': 'quantidade_estoque',
  
  // alerta_estoque
  'alerta_estoque': 'alerta_estoque',
  'alerta': 'alerta_estoque',
  'stock_alert': 'alerta_estoque',
  
  // preco_oferta
  'preco_oferta': 'preco_oferta',
  'preço_oferta': 'preco_oferta',
  'preco oferta': 'preco_oferta',
  'preço oferta': 'preco_oferta',
  'promocao': 'preco_oferta',
  'promoção': 'preco_oferta',
  'sale_price': 'preco_oferta',
  
  // imagem_url
  'imagem_url': 'imagem_url',
  'imagem': 'imagem_url',
  'image_url': 'imagem_url',
  'image': 'imagem_url',
  'foto': 'imagem_url',
  'url': 'imagem_url',
  
  // variante_nome
  'variante_nome': 'variante_nome',
  'variante': 'variante_nome',
  'variant_name': 'variante_nome',
  'variant': 'variante_nome',
  'tamanho': 'variante_nome',
  'size': 'variante_nome',
  
  // variante_preco
  'variante_preco': 'variante_preco',
  'variante_preço': 'variante_preco',
  'preco variante': 'variante_preco',
  'preço variante': 'variante_preco',
  'variant_price': 'variante_preco',
};

export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    const mappedField = COLUMN_MAPPINGS[normalizedHeader];
    
    if (mappedField) {
      mapping[header] = mappedField;
    }
  });
  
  return mapping;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  
  const strValue = String(value).toLowerCase().trim();
  if (['sim', 'yes', 'true', '1', 's', 'y'].includes(strValue)) return true;
  if (['nao', 'não', 'no', 'false', '0', 'n'].includes(strValue)) return false;
  
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  
  // Handle Brazilian format (1.234,56 -> 1234.56)
  let strValue = String(value).trim();
  
  // If contains both . and , assume Brazilian format
  if (strValue.includes('.') && strValue.includes(',')) {
    strValue = strValue.replace(/\./g, '').replace(',', '.');
  } else if (strValue.includes(',') && !strValue.includes('.')) {
    // Only comma, assume decimal separator
    strValue = strValue.replace(',', '.');
  }
  
  const num = parseFloat(strValue);
  return isNaN(num) ? undefined : num;
}

// Native CSV parser
function parseCSVContent(content: string): { headers: string[]; data: Record<string, unknown>[] } {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], data: [] };

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const data: Record<string, unknown>[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => !v.trim())) continue;

    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return { headers, data };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === ';') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());

  return result;
}

export function parseCSV(file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = parseCSVContent(content);
        resolve(result);
      } catch (error) {
        reject(new Error(`Erro ao parsear CSV: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

export async function parseSpreadsheet(file: File): Promise<{ 
  headers: string[]; 
  data: Record<string, unknown>[]; 
  detectedMapping: Record<string, string>;
}> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    const result = await parseCSV(file);
    const detectedMapping = detectColumnMapping(result.headers);
    return { ...result, detectedMapping };
  }
  
  if (['xlsx', 'xls'].includes(extension || '')) {
    throw new Error('Arquivos Excel (.xlsx, .xls) não são suportados ainda. Por favor, salve como CSV.');
  }
  
  throw new Error('Formato de arquivo não suportado. Use CSV.');
}

export function mapRowToProduct(
  row: Record<string, unknown>, 
  mapping: Record<string, string>,
  rowNumber: number
): ParsedRow {
  const mappedRow: Partial<ParsedRow> = { _rowNumber: rowNumber };
  
  Object.entries(mapping).forEach(([originalColumn, targetField]) => {
    const value = row[originalColumn];
    
    switch (targetField) {
      case 'nome':
      case 'categoria':
      case 'descricao':
      case 'imagem_url':
      case 'variante_nome':
        (mappedRow as Record<string, unknown>)[targetField] = value ? String(value).trim() : undefined;
        break;
        
      case 'preco':
      case 'quantidade_estoque':
      case 'alerta_estoque':
      case 'preco_oferta':
      case 'variante_preco':
        (mappedRow as Record<string, unknown>)[targetField] = parseNumber(value);
        break;
        
      case 'disponivel':
      case 'mostrar_menu':
      case 'controlar_estoque':
        (mappedRow as Record<string, unknown>)[targetField] = parseBoolean(value);
        break;
    }
  });
  
  return mappedRow as ParsedRow;
}

export function groupProductsWithVariants(rows: ParsedRow[]): ProductWithVariants[] {
  const productMap = new Map<string, ProductWithVariants>();
  
  rows.forEach(row => {
    const productKey = `${row.nome?.toLowerCase()?.trim()}|${row.categoria?.toLowerCase()?.trim()}`;
    
    if (!row.nome || !row.categoria) return;
    
    if (!productMap.has(productKey)) {
      // First occurrence - create base product
      productMap.set(productKey, {
        nome: row.nome,
        preco: row.preco,
        categoria: row.categoria,
        descricao: row.descricao,
        disponivel: row.disponivel,
        mostrar_menu: row.mostrar_menu,
        controlar_estoque: row.controlar_estoque,
        quantidade_estoque: row.quantidade_estoque,
        alerta_estoque: row.alerta_estoque,
        preco_oferta: row.preco_oferta,
        imagem_url: row.imagem_url,
        variantes: [],
      });
    }
    
    // Add variant if present
    if (row.variante_nome && row.variante_preco !== undefined) {
      const product = productMap.get(productKey)!;
      product.variantes = product.variantes || [];
      product.variantes.push({
        nome: row.variante_nome,
        preco: row.variante_preco,
        preco_oferta: row.preco_oferta,
        disponivel: row.disponivel,
      });
    }
  });
  
  return Array.from(productMap.values());
}

export const REQUIRED_COLUMNS = ['nome', 'preco', 'categoria'];
export const OPTIONAL_COLUMNS = [
  'descricao', 
  'disponivel', 
  'mostrar_menu', 
  'controlar_estoque', 
  'quantidade_estoque', 
  'alerta_estoque', 
  'preco_oferta', 
  'imagem_url',
  'variante_nome',
  'variante_preco',
];

export function validateMapping(mapping: Record<string, string>): { 
  isValid: boolean; 
  missingRequired: string[];
} {
  const mappedFields = new Set(Object.values(mapping));
  const missingRequired = REQUIRED_COLUMNS.filter(col => !mappedFields.has(col));
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
  };
}
