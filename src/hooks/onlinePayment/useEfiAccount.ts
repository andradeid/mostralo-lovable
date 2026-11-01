// Conta EFI da loja na tela Pagamento Online: carregar dados, formulário de
// vinculação/edição, vincular conta e ligar/desligar o pagamento online.
// Código movido da StoreOnlinePaymentPage sem mudança.
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { useToast } from "@/hooks/use-toast";
import { formatDocumentByType } from "@/lib/onlinePayment/efiFormat";

export interface StoreEfiData {
  wants_online_payment: boolean;
  efi_account_status: string | null;
  efi_account_id: string | null;
  efi_account_number: string | null;
  efi_document_type: string | null;
  efi_document_number: string | null;
  company_name: string | null;
}

interface Params {
  storeId: string | null;
  toast: ReturnType<typeof useToast>['toast'];
}

export function useEfiAccount({ storeId, toast }: Params) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState<StoreEfiData | null>(null);
  const [togglingPayment, setTogglingPayment] = useState(false);

  // Form state
  const [efiAccountNumber, setEfiAccountNumber] = useState("");
  const [efiDocumentType, setEfiDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
  const [efiDocumentNumber, setEfiDocumentNumber] = useState("");

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (storeData) {
      setEfiAccountNumber(storeData.efi_account_number || '');
      setEfiDocumentType((storeData.efi_document_type as 'cpf' | 'cnpj') || 'cpf');
      setEfiDocumentNumber(storeData.efi_document_number || '');
    }
  };

  const fetchStoreData = async () => {
    if (!storeId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          wants_online_payment,
          efi_account_status,
          efi_account_id,
          efi_account_number,
          efi_document_type,
          efi_document_number,
          name
        `)
        .eq('id', storeId)
        .single();

      if (error) throw error;

      setStoreData({
        wants_online_payment: data.wants_online_payment || false,
        efi_account_status: data.efi_account_status,
        efi_account_id: data.efi_account_id,
        efi_account_number: data.efi_account_number,
        efi_document_type: data.efi_document_type,
        efi_document_number: data.efi_document_number,
        company_name: data.name,
      });

      if (data.efi_account_number) {
        setEfiAccountNumber(data.efi_account_number);
      }
      if (data.efi_document_type) {
        setEfiDocumentType(data.efi_document_type as 'cpf' | 'cnpj');
      }
      if (data.efi_document_number) {
        setEfiDocumentNumber(data.efi_document_number);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da loja.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchStoreData();
    }
  }, [storeId]);

  const formatDocument = (value: string) => formatDocumentByType(value, efiDocumentType);

  const handleLinkAccount = async () => {
    if (!storeId) return;

    const cleanAccountNumber = efiAccountNumber.replace(/\D/g, '');
    const cleanDocNumber = efiDocumentNumber.replace(/\D/g, '');

    if (cleanAccountNumber.length < 6) {
      toast({
        title: "Número da conta inválido",
        description: "O número da conta deve ter pelo menos 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    const expectedDocLength = efiDocumentType === 'cpf' ? 11 : 14;
    if (cleanDocNumber.length !== expectedDocLength) {
      toast({
        title: `${efiDocumentType.toUpperCase()} inválido`,
        description: `O ${efiDocumentType.toUpperCase()} deve ter ${expectedDocLength} dígitos.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-efi-account', {
        body: {
          store_id: storeId,
          efi_account_number: cleanAccountNumber,
          efi_document_type: efiDocumentType,
          efi_document_number: cleanDocNumber
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conta vinculada!",
          description: "Sua conta EFI foi vinculada com sucesso. Agora você pode receber pagamentos PIX.",
        });
        fetchStoreData();
      } else {
        throw new Error(data.error || 'Erro ao vincular conta');
      }
    } catch (error: any) {
      console.error('Erro ao vincular conta:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível vincular a conta.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOnlinePayment = async (enabled: boolean) => {
    if (!storeId) return;

    setTogglingPayment(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ wants_online_payment: enabled })
        .eq('id', storeId);

      if (error) throw error;

      setStoreData(prev => prev ? { ...prev, wants_online_payment: enabled } : null);

      toast({
        title: enabled ? "Pagamento online ativado!" : "Pagamento online desativado",
        description: enabled
          ? "Seus clientes agora podem pagar via PIX no checkout."
          : "Seus clientes só podem pagar na entrega.",
      });
    } catch (error: any) {
      console.error('Erro ao alterar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
        variant: "destructive",
      });
    } finally {
      setTogglingPayment(false);
    }
  };

  return {
    loading,
    saving,
    storeData,
    togglingPayment,
    efiAccountNumber,
    setEfiAccountNumber,
    efiDocumentType,
    setEfiDocumentType,
    efiDocumentNumber,
    setEfiDocumentNumber,
    isEditing,
    setIsEditing,
    handleCancelEdit,
    fetchStoreData,
    formatDocument,
    handleLinkAccount,
    handleToggleOnlinePayment,
  };
}

export type EfiAccount = ReturnType<typeof useEfiAccount>;
