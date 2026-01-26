import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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

export function parseCSV(file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          headers,
          data: results.data as Record<string, unknown>[],
        });
      },
      error: (error) => {
        reject(new Error(`Erro ao parsear CSV: ${error.message}`));
      },
    });
  });
}

export function parseXLSX(file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { 
          defval: '',
          raw: false,
        });
        
        // Get headers from first row
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        
        resolve({
          headers,
          data: jsonData,
        });
      } catch (error) {
        reject(new Error(`Erro ao parsear Excel: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export async function parseSpreadsheet(file: File): Promise<{ 
  headers: string[]; 
  data: Record<string, unknown>[]; 
  detectedMapping: Record<string, string>;
}> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  let result: { headers: string[]; data: Record<string, unknown>[] };
  
  if (extension === 'csv') {
    result = await parseCSV(file);
  } else if (['xlsx', 'xls'].includes(extension || '')) {
    result = await parseXLSX(file);
  } else {
    throw new Error('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)');
  }
  
  const detectedMapping = detectColumnMapping(result.headers);
  
  return {
    ...result,
    detectedMapping,
  };
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
        mappedRow[targetField] = value ? String(value).trim() : undefined;
        break;
        
      case 'preco':
      case 'quantidade_estoque':
      case 'alerta_estoque':
      case 'preco_oferta':
      case 'variante_preco':
        mappedRow[targetField] = parseNumber(value);
        break;
        
      case 'disponivel':
      case 'mostrar_menu':
      case 'controlar_estoque':
        mappedRow[targetField] = parseBoolean(value);
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
