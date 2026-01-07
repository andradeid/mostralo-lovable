import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PatientData {
  name: string;
  cpf?: string | null;
  rg?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  email?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  health_insurance?: string | null;
  health_insurance_number?: string | null;
}

export interface ProfessionalData {
  name: string;
  registration?: string | null;
  specialty?: string | null;
}

export interface ClinicData {
  name: string;
  address?: string | null;
  phone?: string | null;
  cnpj?: string | null;
}

export interface DocumentVariables {
  patient: PatientData;
  professional?: ProfessionalData;
  clinic?: ClinicData;
  customFields?: Record<string, string>;
}

/**
 * Formata o endereço completo do paciente
 */
function formatFullAddress(patient: PatientData): string {
  const parts = [
    patient.address_street,
    patient.address_number,
    patient.address_complement,
    patient.address_neighborhood,
    patient.address_city,
    patient.address_state,
    patient.address_zip,
  ].filter(Boolean);
  
  return parts.join(", ") || "Não informado";
}

/**
 * Calcula a idade a partir da data de nascimento
 */
function calculateAge(birthDate: string | null | undefined): string {
  if (!birthDate) return "Não informado";
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} anos`;
}

/**
 * Mapa de variáveis disponíveis para substituição
 */
export const AVAILABLE_VARIABLES = {
  // Paciente
  "{{paciente_nome}}": "Nome completo do paciente",
  "{{paciente_cpf}}": "CPF do paciente",
  "{{paciente_rg}}": "RG do paciente",
  "{{paciente_nascimento}}": "Data de nascimento",
  "{{paciente_idade}}": "Idade do paciente",
  "{{paciente_telefone}}": "Telefone do paciente",
  "{{paciente_email}}": "E-mail do paciente",
  "{{paciente_endereco}}": "Endereço completo",
  "{{paciente_convenio}}": "Convênio médico",
  "{{paciente_convenio_numero}}": "Número do convênio",
  
  // Profissional
  "{{profissional_nome}}": "Nome do profissional",
  "{{profissional_cro}}": "CRO do profissional",
  "{{profissional_especialidade}}": "Especialidade",
  
  // Clínica
  "{{clinica_nome}}": "Nome da clínica",
  "{{clinica_endereco}}": "Endereço da clínica",
  "{{clinica_telefone}}": "Telefone da clínica",
  "{{clinica_cnpj}}": "CNPJ da clínica",
  
  // Data/Hora
  "{{data}}": "Data atual (DD/MM/AAAA)",
  "{{data_extenso}}": "Data por extenso",
  "{{hora}}": "Hora atual (HH:MM)",
  "{{data_hora}}": "Data e hora completa",
} as const;

/**
 * Substitui as variáveis do template pelos valores reais
 */
export function replaceDocumentVariables(
  template: string,
  variables: DocumentVariables
): string {
  const { patient, professional, clinic, customFields } = variables;
  const now = new Date();
  
  const replacements: Record<string, string> = {
    // Paciente
    "{{paciente_nome}}": patient.name || "_______________",
    "{{paciente_cpf}}": patient.cpf || "_______________",
    "{{paciente_rg}}": patient.rg || "_______________",
    "{{paciente_nascimento}}": patient.birth_date 
      ? format(new Date(patient.birth_date), "dd/MM/yyyy", { locale: ptBR })
      : "_______________",
    "{{paciente_idade}}": calculateAge(patient.birth_date),
    "{{paciente_telefone}}": patient.phone || "_______________",
    "{{paciente_email}}": patient.email || "_______________",
    "{{paciente_endereco}}": formatFullAddress(patient),
    "{{paciente_convenio}}": patient.health_insurance || "Particular",
    "{{paciente_convenio_numero}}": patient.health_insurance_number || "_______________",
    
    // Profissional
    "{{profissional_nome}}": professional?.name || "_______________",
    "{{profissional_cro}}": professional?.registration || "_______________",
    "{{profissional_especialidade}}": professional?.specialty || "_______________",
    
    // Clínica
    "{{clinica_nome}}": clinic?.name || "_______________",
    "{{clinica_endereco}}": clinic?.address || "_______________",
    "{{clinica_telefone}}": clinic?.phone || "_______________",
    "{{clinica_cnpj}}": clinic?.cnpj || "_______________",
    
    // Data/Hora
    "{{data}}": format(now, "dd/MM/yyyy", { locale: ptBR }),
    "{{data_extenso}}": format(now, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    "{{hora}}": format(now, "HH:mm", { locale: ptBR }),
    "{{data_hora}}": format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    
    // Legado - suporte aos templates antigos
    "{patient.name}": patient.name || "_______________",
    "{date}": format(now, "dd/MM/yyyy", { locale: ptBR }),
    "{professional.name}": professional?.name || "_______________",
    "{professional.registration}": professional?.registration || "_______________",
    "{days}": customFields?.days || "___",
    "{content}": customFields?.content || "",
  };
  
  // Adicionar campos customizados
  if (customFields) {
    Object.entries(customFields).forEach(([key, value]) => {
      replacements[`{{${key}}}`] = value;
    });
  }
  
  let result = template;
  Object.entries(replacements).forEach(([variable, value]) => {
    result = result.replace(new RegExp(escapeRegExp(variable), "g"), value);
  });
  
  return result;
}

/**
 * Escapa caracteres especiais para uso em RegExp
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extrai as variáveis presentes em um template
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{[^}]+\}\}|\{[^}]+\}/g;
  const matches = template.match(regex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Valida se todas as variáveis do template são conhecidas
 */
export function validateTemplateVariables(template: string): {
  valid: boolean;
  unknownVariables: string[];
} {
  const variables = extractVariables(template);
  const knownVariables = new Set(Object.keys(AVAILABLE_VARIABLES));
  
  // Adicionar variáveis legadas
  const legacyVariables = [
    "{patient.name}",
    "{date}",
    "{professional.name}",
    "{professional.registration}",
    "{days}",
    "{content}",
  ];
  legacyVariables.forEach(v => knownVariables.add(v));
  
  const unknownVariables = variables.filter(v => !knownVariables.has(v));
  
  return {
    valid: unknownVariables.length === 0,
    unknownVariables,
  };
}
