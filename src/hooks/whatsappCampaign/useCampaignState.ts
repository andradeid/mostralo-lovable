// Estado da tela Nova Campanha (formulário, mídia, testes, contatos) e estimativa de tempo.
// Código movido da WhatsAppCampaignNewPage sem mudança de comportamento.
import { useState } from "react";
import type { SelectedTemplate } from "./types";

export function useCampaignState() {
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [storeSlug, setStoreSlug] = useState<string>('');
  
  // Estados para mídia
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Estados para teste de envio
  const [testNumber, setTestNumber] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [validatingTestNumber, setValidatingTestNumber] = useState(false);
  const [testNumberValid, setTestNumberValid] = useState<boolean | null>(null);
  const [validationStep, setValidationStep] = useState('');
  
  // Estado para salvar mensagem
  const [savingMessage, setSavingMessage] = useState(false);
  
  // Estado para validação em lote de WhatsApp
  const [validatingBatch, setValidatingBatch] = useState(false);
  
  // Estado para etapas de validação animada
  const [validationStage, setValidationStage] = useState('');
  const [validationProgress, setValidationProgress] = useState(0);
  
  // Estados para contatos manuais
  const [manualContactsInput, setManualContactsInput] = useState('');
  const [manualContacts, setManualContacts] = useState<{
    name: string;
    phone: string;
    valid: boolean | null;
    selected: boolean;
  }[]>([]);
  const [validatingManual, setValidatingManual] = useState(false);
  
  // Estados para busca de clientes
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    template_id: '',
    custom_message: '',
    media_url: '',
    media_type: '' as '' | 'image' | 'video' | 'document',
    filter_days_inactive: 7,
    filter_min_orders: 0,
    filter_max_orders: 0,
    filter_min_spent: 0,
    filter_max_spent: 0,
    filter_label_ids: [] as string[],
    include_imported_contacts: false,
    message_interval_seconds: 60,
    daily_limit: 100,
    start_hour: 9,
    end_hour: 21,
    // Anti-bloqueio
    pause_enabled: false,
    pause_after_messages: 10,
    pause_duration_seconds: 120,
    // Agendamento
    schedule_type: 'now' as 'now' | 'scheduled',
    scheduled_date: '',
    scheduled_time: '09:00',
    // Tipo de interação (enquete/lista)
    interaction_type: 'text' as 'text' | 'poll',
    // Campos para enquete
    poll_question: '',
    poll_options: ['', ''] as string[],
    poll_selectable_count: 1,
  });

  // Funções auxiliares para formatação de tempo
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  const calculateEstimate = () => {
    if (!previewData?.totalRecipients) return null;
    const total = previewData.totalRecipients;
    const avgInterval = form.message_interval_seconds * 0.875; // Média entre 75% e 100%
    
    let totalSeconds = total * avgInterval;
    
    // Adicionar pausas
    if (form.pause_enabled && form.pause_after_messages > 0) {
      const pauseCount = Math.floor((total - 1) / form.pause_after_messages);
      totalSeconds += pauseCount * form.pause_duration_seconds;
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    
    return {
      time: hours > 0 ? `${hours}h ${mins}min` : `${mins}min`,
      pauseCount: form.pause_enabled ? Math.floor((total - 1) / form.pause_after_messages) : 0,
      avgInterval: formatTime(Math.round(avgInterval)),
    };
  };

  return {
    loading,
    setLoading,
    previewing,
    setPreviewing,
    templates,
    setTemplates,
    labels,
    setLabels,
    previewData,
    setPreviewData,
    selectedTemplate,
    setSelectedTemplate,
    storeName,
    setStoreName,
    storeSlug,
    setStoreSlug,
    mediaFile,
    setMediaFile,
    mediaPreview,
    setMediaPreview,
    uploadingMedia,
    setUploadingMedia,
    testNumber,
    setTestNumber,
    sendingTest,
    setSendingTest,
    validatingTestNumber,
    setValidatingTestNumber,
    testNumberValid,
    setTestNumberValid,
    validationStep,
    setValidationStep,
    savingMessage,
    setSavingMessage,
    validatingBatch,
    setValidatingBatch,
    validationStage,
    setValidationStage,
    validationProgress,
    setValidationProgress,
    manualContactsInput,
    setManualContactsInput,
    manualContacts,
    setManualContacts,
    validatingManual,
    setValidatingManual,
    customerSearchQuery,
    setCustomerSearchQuery,
    customerSearchResults,
    setCustomerSearchResults,
    searchingCustomers,
    setSearchingCustomers,
    form,
    setForm,
    formatTime,
    calculateEstimate,
  };
}
