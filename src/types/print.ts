export type DocumentType = 'complete' | 'kitchen' | 'delivery';
export type PrintType = 'thermal_58mm' | 'thermal_80mm' | 'a4';
export type FontSize = 'small' | 'medium' | 'large';
export type FontFamily = 'monospace' | 'sans-serif' | 'serif';
export type TextAlign = 'left' | 'center' | 'right';

export interface PrintSections {
  header: boolean;
  orderInfo: boolean;
  customerInfo: boolean;
  items: boolean;
  totals: boolean;
  payment: boolean;
  footer: boolean;
}

export interface PrintStyles {
  fontSize: FontSize;
  fontFamily: FontFamily;
  headerAlign: TextAlign;
  itemsAlign: TextAlign;
  boldTitles: boolean;
  showSeparators: boolean;
}

export interface PrintCustomTexts {
  headerText: string;
  footerText: string;
}

export interface PrintCopies {
  complete: boolean;
  kitchen: boolean;
  delivery: boolean;
}

export interface PrintConfiguration {
  id?: string;
  store_id: string;
  document_type: DocumentType;
  print_type: PrintType;
  sections: PrintSections;
  styles: PrintStyles;
  custom_texts: PrintCustomTexts;
  print_copies: PrintCopies;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PrintTemplate {
  name: string;
  description: string;
  document_type: DocumentType;
  print_type: PrintType;
  sections: PrintSections;
  styles: PrintStyles;
  custom_texts: PrintCustomTexts;
}
