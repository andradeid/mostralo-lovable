// Configuração fiscal da loja (tela /dashboard/fiscal): formulário ↔ linha de store_fiscal_settings,
// validação em português e o "o que falta" para emitir. Regras puras (testadas).
import { isValidCnpj, isValidUf, onlyDigits } from '../../../supabase/functions/_shared/fiscal-doc.ts';

export type FiscalEnvironment = 'homologacao' | 'producao';

export interface FiscalSettingsForm {
  environment: FiscalEnvironment;
  nfce_enabled: boolean;
  nfe_enabled: boolean;
  cnpj: string;
  inscricao_estadual: string;
  regime_tributario: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  codigo_municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  nfce_serie: string;
  nfce_proximo_numero: string;
  nfe_serie: string;
  nfe_proximo_numero: string;
  nfce_natureza_operacao: string;
  nfe_natureza_operacao: string;
  default_ncm: string;
  default_cfop: string;
  default_icms_origem: string;
  default_icms_situacao: string;
  default_pis_cst: string;
  default_cofins_cst: string;
  default_unidade: string;
  pix_payment_code: string;
  include_service_fee: boolean;
}

export interface FiscalSecretsStatus {
  token_homologacao: boolean;
  token_producao: boolean;
  csc_homologacao: boolean;
  csc_producao: boolean;
}

export const REGIME_OPTIONS = [
  { value: '1', label: 'Simples Nacional' },
  { value: '2', label: 'Simples Nacional (excesso de sublimite)' },
  { value: '3', label: 'Regime Normal (Lucro Presumido/Real)' },
  { value: '4', label: 'MEI' },
];

export const ORIGEM_OPTIONS = [
  { value: '0', label: '0 - Nacional' },
  { value: '1', label: '1 - Estrangeira (importação direta)' },
  { value: '2', label: '2 - Estrangeira (comprada no Brasil)' },
  { value: '3', label: '3 - Nacional, mais de 40% importado' },
  { value: '4', label: '4 - Nacional (processo produtivo básico)' },
  { value: '5', label: '5 - Nacional, até 40% importado' },
  { value: '6', label: '6 - Estrangeira sem similar (importação direta)' },
  { value: '7', label: '7 - Estrangeira sem similar (comprada no Brasil)' },
  { value: '8', label: '8 - Nacional, mais de 70% importado' },
];

/** Códigos que o Mostralo já monta sem campos extras (os outros pedem alíquota/ST). */
export const CSOSN_OPTIONS = [
  { value: '102', label: '102 - Sem crédito (mais comum no Simples)' },
  { value: '103', label: '103 - Isenção do ICMS no Simples' },
  { value: '300', label: '300 - Imune' },
  { value: '400', label: '400 - Não tributada' },
  { value: '500', label: '500 - ICMS já cobrado por substituição (ST)' },
];
export const CST_OPTIONS = [
  { value: '40', label: '40 - Isenta' },
  { value: '41', label: '41 - Não tributada' },
  { value: '50', label: '50 - Suspensão' },
  { value: '60', label: '60 - ICMS cobrado antes por ST' },
];
export const PIS_COFINS_OPTIONS = [
  { value: '49', label: '49 - Outras operações de saída' },
  { value: '99', label: '99 - Outras operações' },
  { value: '04', label: '04 - Monofásica (revenda a alíquota zero)' },
  { value: '05', label: '05 - Substituição tributária' },
  { value: '06', label: '06 - Alíquota zero' },
  { value: '07', label: '07 - Isenta' },
  { value: '08', label: '08 - Sem incidência' },
  { value: '09', label: '09 - Suspensão' },
];

export const icmsOptionsFor = (regime: string) => (regime === '3' ? CST_OPTIONS : CSOSN_OPTIONS);

const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export function emptyFiscalForm(): FiscalSettingsForm {
  return formFromRow(null);
}

export function formFromRow(row: Record<string, unknown> | null): FiscalSettingsForm {
  const r = row ?? {};
  return {
    environment: r.environment === 'producao' ? 'producao' : 'homologacao',
    nfce_enabled: !!r.nfce_enabled,
    nfe_enabled: !!r.nfe_enabled,
    cnpj: s(r.cnpj),
    inscricao_estadual: s(r.inscricao_estadual),
    regime_tributario: s(r.regime_tributario || 1),
    razao_social: s(r.razao_social),
    nome_fantasia: s(r.nome_fantasia),
    logradouro: s(r.logradouro),
    numero: s(r.numero),
    complemento: s(r.complemento),
    bairro: s(r.bairro),
    municipio: s(r.municipio),
    codigo_municipio: s(r.codigo_municipio),
    uf: s(r.uf),
    cep: s(r.cep),
    telefone: s(r.telefone),
    nfce_serie: s(r.nfce_serie),
    nfce_proximo_numero: s(r.nfce_proximo_numero),
    nfe_serie: s(r.nfe_serie),
    nfe_proximo_numero: s(r.nfe_proximo_numero),
    nfce_natureza_operacao: s(r.nfce_natureza_operacao || 'VENDA AO CONSUMIDOR'),
    nfe_natureza_operacao: s(r.nfe_natureza_operacao || 'Venda de mercadoria'),
    default_ncm: s(r.default_ncm),
    default_cfop: s(r.default_cfop || '5102'),
    default_icms_origem: s(r.default_icms_origem ?? 0),
    default_icms_situacao: s(r.default_icms_situacao || '102'),
    default_pis_cst: s(r.default_pis_cst),
    default_cofins_cst: s(r.default_cofins_cst),
    default_unidade: s(r.default_unidade || 'UN'),
    pix_payment_code: r.pix_payment_code === '20' ? '20' : '17',
    include_service_fee: r.include_service_fee !== false,
  };
}

const textOrNull = (v: string) => (v.trim() === '' ? null : v.trim());
const digitsOrNull = (v: string) => (onlyDigits(v) === '' ? null : onlyDigits(v));
const intOrNull = (v: string) => (v.trim() === '' ? null : Number(v.trim()));

export type FiscalFormErrors = Partial<Record<keyof FiscalSettingsForm, string>>;

/** Confere o formulário. Com NFC-e/NF-e ligadas, exige os dados do emitente. */
export function validateFiscalForm(f: FiscalSettingsForm): FiscalFormErrors {
  const e: FiscalFormErrors = {};
  const emitting = f.nfce_enabled || f.nfe_enabled;
  if (f.cnpj.trim() && !isValidCnpj(f.cnpj)) e.cnpj = 'CNPJ inválido';
  if (f.uf.trim() && !isValidUf(f.uf)) e.uf = 'UF inválida';
  if (f.cep.trim() && onlyDigits(f.cep).length !== 8) e.cep = 'CEP precisa ter 8 dígitos';
  if (f.codigo_municipio.trim() && onlyDigits(f.codigo_municipio).length !== 7) e.codigo_municipio = 'Código IBGE tem 7 dígitos';
  if (emitting) {
    if (!f.cnpj.trim()) e.cnpj = 'Obrigatório para emitir';
    if (!f.inscricao_estadual.trim()) e.inscricao_estadual = 'Obrigatória para emitir (ou ISENTO)';
    if (!f.razao_social.trim()) e.razao_social = 'Obrigatória para emitir';
    if (!f.logradouro.trim()) e.logradouro = 'Obrigatório para emitir';
    if (!f.numero.trim()) e.numero = 'Obrigatório (ou S/N)';
    if (!f.bairro.trim()) e.bairro = 'Obrigatório para emitir';
    if (!f.municipio.trim()) e.municipio = 'Obrigatório para emitir';
    if (!f.uf.trim()) e.uf = 'Obrigatória para emitir';
    if (!f.cep.trim()) e.cep = 'Obrigatório para emitir';
  }
  if (f.default_ncm.trim() && onlyDigits(f.default_ncm).length !== 8) e.default_ncm = 'NCM tem 8 dígitos';
  if (!/^[56]\d{3}$/.test(onlyDigits(f.default_cfop))) e.default_cfop = 'CFOP de saída com 4 dígitos (ex.: 5102)';
  const icms = icmsOptionsFor(f.regime_tributario).map((o) => o.value);
  if (!icms.includes(f.default_icms_situacao)) {
    e.default_icms_situacao = f.regime_tributario === '3' ? 'Escolha um CST' : 'Escolha um CSOSN';
  }
  if (!f.default_unidade.trim() || f.default_unidade.trim().length > 6) e.default_unidade = 'De 1 a 6 letras (ex.: UN)';
  for (const k of ['nfce_serie', 'nfe_serie'] as const) {
    if (f[k].trim() && !/^\d{1,3}$/.test(f[k].trim())) e[k] = 'Série de 0 a 999';
  }
  for (const k of ['nfce_proximo_numero', 'nfe_proximo_numero'] as const) {
    if (f[k].trim() && !(/^\d+$/.test(f[k].trim()) && Number(f[k]) > 0)) e[k] = 'Número maior que zero';
  }
  return e;
}

/** Linha para gravar em store_fiscal_settings (upsert por store_id). */
export function rowFromForm(f: FiscalSettingsForm, storeId: string) {
  return {
    store_id: storeId,
    environment: f.environment,
    nfce_enabled: f.nfce_enabled,
    nfe_enabled: f.nfe_enabled,
    cnpj: digitsOrNull(f.cnpj),
    inscricao_estadual: f.inscricao_estadual.trim().toUpperCase() === 'ISENTO' ? 'ISENTO' : digitsOrNull(f.inscricao_estadual),
    regime_tributario: Number(f.regime_tributario) || 1,
    razao_social: textOrNull(f.razao_social),
    nome_fantasia: textOrNull(f.nome_fantasia),
    logradouro: textOrNull(f.logradouro),
    numero: textOrNull(f.numero),
    complemento: textOrNull(f.complemento),
    bairro: textOrNull(f.bairro),
    municipio: textOrNull(f.municipio),
    codigo_municipio: digitsOrNull(f.codigo_municipio),
    uf: textOrNull(f.uf)?.toUpperCase() ?? null,
    cep: digitsOrNull(f.cep),
    telefone: digitsOrNull(f.telefone),
    nfce_serie: intOrNull(f.nfce_serie),
    nfce_proximo_numero: intOrNull(f.nfce_proximo_numero),
    nfe_serie: intOrNull(f.nfe_serie),
    nfe_proximo_numero: intOrNull(f.nfe_proximo_numero),
    nfce_natureza_operacao: f.nfce_natureza_operacao.trim() || 'VENDA AO CONSUMIDOR',
    nfe_natureza_operacao: f.nfe_natureza_operacao.trim() || 'Venda de mercadoria',
    default_ncm: digitsOrNull(f.default_ncm),
    default_cfop: onlyDigits(f.default_cfop) || '5102',
    default_icms_origem: Number(f.default_icms_origem) || 0,
    default_icms_situacao: f.default_icms_situacao,
    default_pis_cst: textOrNull(f.default_pis_cst),
    default_cofins_cst: textOrNull(f.default_cofins_cst),
    default_unidade: f.default_unidade.trim().toUpperCase() || 'UN',
    pix_payment_code: f.pix_payment_code === '20' ? '20' : '17',
    include_service_fee: f.include_service_fee,
  };
}

export interface ReadinessItem {
  key: string;
  label: string;
  done: boolean;
  hint: string;
}

/** O que falta para emitir no ambiente escolhido (o certificado A1 fica na Focus e não dá para conferir daqui). */
export function fiscalReadiness(f: FiscalSettingsForm, secrets: FiscalSecretsStatus | null): ReadinessItem[] {
  const prod = f.environment === 'producao';
  const company = isValidCnpj(f.cnpj) && !!f.inscricao_estadual.trim() && !!f.razao_social.trim() && isValidUf(f.uf)
    && !!f.municipio.trim() && !!f.logradouro.trim() && onlyDigits(f.cep).length === 8;
  const items: ReadinessItem[] = [
    { key: 'company', label: 'Dados da empresa (CNPJ, inscrição estadual, endereço)', done: company, hint: 'Preencha a seção "Empresa".' },
    {
      key: 'taxes', label: 'Padrões de imposto (CST de PIS e COFINS)',
      done: !!f.default_pis_cst && !!f.default_cofins_cst,
      hint: 'Peça ao contador. Pode ser por produto também.',
    },
    {
      key: 'token', label: `Token da Focus NFe (${prod ? 'produção' : 'homologação'})`,
      done: !!(prod ? secrets?.token_producao : secrets?.token_homologacao),
      hint: 'Vem do cadastro da empresa na Focus. Se o Mostralo usa uma conta única, o suporte configura.',
    },
  ];
  if (f.nfce_enabled) {
    items.push({
      key: 'csc', label: `CSC da NFC-e (${prod ? 'produção' : 'homologação'})`,
      done: !!(prod ? secrets?.csc_producao : secrets?.csc_homologacao),
      hint: 'Código gerado no site da SEFAZ do seu estado. Também precisa estar cadastrado na Focus.',
    });
  }
  items.push({
    key: 'enabled', label: 'NFC-e ou NF-e ligada', done: f.nfce_enabled || f.nfe_enabled,
    hint: 'Ligue o tipo de nota que a loja vai emitir.',
  });
  return items;
}
