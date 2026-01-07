import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DentalDocumentTemplate {
  id: string;
  store_id: string;
  type: string;
  name: string;
  description: string | null;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DentalPatientDocument {
  id: string;
  patient_id: string;
  store_id: string;
  template_id: string | null;
  type: string;
  title: string;
  content: string;
  document_number: string | null;
  medications: any | null;
  generated_by: string | null;
  professional_name: string | null;
  professional_registration: string | null;
  signature_data: string | null;
  patient_signature_data: string | null;
  signed_at: string | null;
  patient_signed_at: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  sent_via: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos de documentos
export const DOCUMENT_TYPES = {
  prescription: { label: "Receituário", icon: "Pill" },
  certificate: { label: "Atestado", icon: "FileCheck" },
  consent: { label: "Termo de Consentimento", icon: "FileSignature" },
  referral: { label: "Encaminhamento", icon: "Forward" },
  declaration: { label: "Declaração", icon: "FileText" },
} as const;

// Templates padrão
export const DEFAULT_TEMPLATES = {
  prescription: `<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="text-align: center;">RECEITUÁRIO</h1>
  <p><strong>Paciente:</strong> {patient.name}</p>
  <p><strong>Data:</strong> {date}</p>
  <hr/>
  <div style="min-height: 300px; padding: 20px;">
    {content}
  </div>
  <hr/>
  <div style="text-align: center; margin-top: 50px;">
    <p>_____________________________</p>
    <p>{professional.name}</p>
    <p>CRO: {professional.registration}</p>
  </div>
</div>`,
  certificate: `<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="text-align: center;">ATESTADO ODONTOLÓGICO</h1>
  <p>Atesto para os devidos fins que o(a) paciente <strong>{patient.name}</strong>, 
  compareceu a este consultório no dia {date} para atendimento odontológico, 
  devendo permanecer afastado(a) de suas atividades por {days} dia(s).</p>
  <p style="margin-top: 30px;">{content}</p>
  <div style="text-align: center; margin-top: 80px;">
    <p>_____________________________</p>
    <p>{professional.name}</p>
    <p>CRO: {professional.registration}</p>
  </div>
</div>`,
  consent: `<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="text-align: center;">TERMO DE CONSENTIMENTO INFORMADO</h1>
  <p>Eu, <strong>{patient.name}</strong>, declaro que fui devidamente informado(a) sobre:</p>
  <ul>
    <li>O diagnóstico e o procedimento proposto</li>
    <li>Os riscos e benefícios do tratamento</li>
    <li>As alternativas de tratamento</li>
    <li>As possíveis complicações</li>
  </ul>
  <p>{content}</p>
  <p>Autorizo a realização do procedimento proposto.</p>
  <div style="display: flex; justify-content: space-between; margin-top: 80px;">
    <div style="text-align: center;">
      <p>_____________________________</p>
      <p>Paciente</p>
    </div>
    <div style="text-align: center;">
      <p>_____________________________</p>
      <p>Profissional</p>
    </div>
  </div>
</div>`,
};

export function useDentalDocumentTemplates(storeId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['dental-document-templates', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await (supabase as any)
        .from('dental_document_templates')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as DentalDocumentTemplate[];
    },
    enabled: !!storeId,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: Partial<DentalDocumentTemplate> & { store_id: string; type: string; name: string; content: string }) => {
      const { data, error } = await (supabase as any)
        .from('dental_document_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      return data as DentalDocumentTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-document-templates', storeId] });
      toast({
        title: "Template criado",
        description: "O modelo de documento foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    refetch: templatesQuery.refetch,
  };
}

export function useDentalPatientDocuments(patientId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['dental-patient-documents', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await (supabase as any)
        .from('dental_patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DentalPatientDocument[];
    },
    enabled: !!patientId,
  });

  const createDocument = useMutation({
    mutationFn: async (docData: Partial<DentalPatientDocument> & { patient_id: string; store_id: string; type: string; title: string; content: string }) => {
      const { data, error } = await (supabase as any)
        .from('dental_patient_documents')
        .insert(docData)
        .select()
        .single();

      if (error) throw error;
      return data as DentalPatientDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-patient-documents', patientId] });
      toast({
        title: "Documento criado",
        description: "O documento foi gerado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('dental_patient_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-patient-documents', patientId] });
      toast({
        title: "Documento removido",
        description: "O documento foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    createDocument,
    deleteDocument,
    refetch: documentsQuery.refetch,
  };
}
