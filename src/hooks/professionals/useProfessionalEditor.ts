// Formulário de profissional (criar, editar, senha, WhatsApp) e ações de excluir e ativar/desativar.
// Código movido da ProfessionalsPage sem mudança (mesmas chamadas, mesma ordem).
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Professional, useBooking } from '@/hooks/useBooking';
import type { WhatsAppValidationStatus } from '@/components/admin/booking/ProfessionalWhatsAppValidator';
import { splitProfessionalPhone } from '@/lib/professionals/professionalsList';
import type { ProfessionalDialogs } from '@/hooks/professionals/useProfessionalDialogs';

type BookingApi = ReturnType<typeof useBooking>;

interface Params {
  storeId: string | null;
  dialogs: ProfessionalDialogs;
  updateProfessional: BookingApi['updateProfessional'];
  deleteProfessional: BookingApi['deleteProfessional'];
}

export function useProfessionalEditor({ storeId, dialogs, updateProfessional, deleteProfessional }: Params) {
  const {
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setInviteDialog,
    selectedProfessional,
    setSelectedProfessional,
  } = dialogs;
  // Acesso do profissional: convite por link (ele cria a senha) ou senha definida pelo dono
  const [accessMode, setAccessMode] = useState<'invite' | 'password'>('invite');
  const [showValidationOverlay, setShowValidationOverlay] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppValidationStatus>('idle');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialty: '',
    description: '',
    photo_url: '',
    commission_type: 'percentage' as 'percentage' | 'fixed',
    commission_value: 0,
    phone: '',
    countryCode: '+55'
  });
  
  const [editPasswordData, setEditPasswordData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      specialty: '',
      description: '',
      photo_url: '',
      commission_type: 'percentage',
      commission_value: 0,
      phone: '',
      countryCode: '+55'
    });
    setEditPasswordData({
      newPassword: '',
      confirmNewPassword: ''
    });
    setWhatsappStatus('idle');
  };

  const handleCreate = async () => {
    if (!storeId || !formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório para acesso ao portal');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Email inválido');
      return;
    }

    if (accessMode === 'password') {
      if (!formData.password || formData.password.length < 6) {
        toast.error('Senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }
    }

    setShowValidationOverlay(true);
    setWhatsappStatus('validating');

    try {
      const { data, error } = await supabase.functions.invoke('create-professional-account', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: accessMode === 'password' ? formData.password : undefined,
          send_invite: accessMode === 'invite',
          phone: formData.phone.trim() || undefined,
          countryCode: formData.countryCode,
          specialty: formData.specialty.trim() || undefined,
          description: formData.description.trim() || undefined,
          photo_url: formData.photo_url.trim() || undefined,
          commission_type: formData.commission_type,
          commission_value: formData.commission_value,
          store_id: storeId,
          send_whatsapp: accessMode === 'password' && !!formData.phone.trim()
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar profissional');

      setWhatsappStatus(data.whatsapp_sent ? 'valid' : 'idle');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowValidationOverlay(false);
      setIsCreateDialogOpen(false);
      const createdName = formData.name.trim();
      const createdPhone = formData.phone.trim();
      resetForm();

      if (data.invite_url && data.professional) {
        // Abre a janela com o link para mandar ao profissional
        setInviteDialog({
          professional: { id: data.professional.id, name: createdName, phone: createdPhone ? `${formData.countryCode}${createdPhone}` : null },
          url: data.invite_url,
        });
        toast.success('Profissional criado! Agora mande o convite para ele criar a senha.');
        return;
      }
      
      toast.success('Profissional criado com sucesso!', {
        description: data.whatsapp_sent 
          ? 'Notificação enviada via WhatsApp'
          : 'Informe as credenciais ao profissional'
      });

    } catch (error) {
      console.error('Erro ao criar profissional:', error);
      setWhatsappStatus('invalid');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowValidationOverlay(false);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar profissional');
    }
  };

  const handleEdit = async () => {
    if (!selectedProfessional || !formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editPasswordData.newPassword) {
      if (editPasswordData.newPassword.length < 6) {
        toast.error('Nova senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (editPasswordData.newPassword !== editPasswordData.confirmNewPassword) {
        toast.error('As novas senhas não coincidem');
        return;
      }
    }

    try {
      await updateProfessional({
        id: selectedProfessional.id,
        name: formData.name.trim(),
        specialty: formData.specialty.trim() || undefined,
        description: formData.description.trim() || undefined,
        photo_url: formData.photo_url.trim() || undefined,
        commission_type: formData.commission_type,
        commission_value: formData.commission_value,
        // WhatsApp do profissional (antes a edição ignorava o campo)
        phone: formData.phone.replace(/\D/g, '')
          ? `${formData.countryCode.replace('+', '')}${formData.phone.replace(/\D/g, '')}`
          : (null as unknown as string),
      });

      if (editPasswordData.newPassword && selectedProfessional.user_id && storeId) {
        setUpdatingPassword(true);
        const { data, error } = await supabase.functions.invoke('update-professional-password', {
          body: {
            professional_id: selectedProfessional.id,
            new_password: editPasswordData.newPassword,
            store_id: storeId
          }
        });

        if (error || !data?.success) {
          toast.error(data?.error || 'Erro ao atualizar senha');
          setUpdatingPassword(false);
          return;
        }
        toast.success('Senha atualizada com sucesso!');
        setUpdatingPassword(false);
      }

      setIsEditDialogOpen(false);
      setSelectedProfessional(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao editar profissional:', error);
      setUpdatingPassword(false);
      setIsEditDialogOpen(false);
      setSelectedProfessional(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedProfessional) return;

    try {
      await deleteProfessional(selectedProfessional.id);
      setIsDeleteDialogOpen(false);
      setSelectedProfessional(null);
    } catch (error) {
      console.error('Erro ao excluir profissional:', error);
      setIsDeleteDialogOpen(false);
      setSelectedProfessional(null);
    }
  };

  const handleToggleActive = async (professional: Professional) => {
    try {
      await updateProfessional({
        id: professional.id,
        is_active: !professional.is_active
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const openEditDialog = async (professional: Professional) => {
    setSelectedProfessional(professional);
    
    const { countryCode, phone } = splitProfessionalPhone(professional.phone);

    let professionalEmail = '';
    if (professional.user_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', professional.user_id)
        .single();
      
      if (prof?.email) {
        professionalEmail = prof.email;
      }
    }

    setFormData({
      name: professional.name,
      email: professionalEmail,
      password: '',
      confirmPassword: '',
      specialty: professional.specialty || '',
      description: professional.description || '',
      photo_url: professional.photo_url || '',
      commission_type: professional.commission_type,
      commission_value: professional.commission_value,
      phone,
      countryCode
    });
    setEditPasswordData({
      newPassword: '',
      confirmNewPassword: ''
    });
    setWhatsappStatus('idle');
    setIsEditDialogOpen(true);
  };

  return {
    accessMode, setAccessMode,
    showValidationOverlay, setShowValidationOverlay,
    whatsappStatus, setWhatsappStatus,
    formData, setFormData,
    editPasswordData, setEditPasswordData,
    updatingPassword,
    resetForm,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    openEditDialog,
  };
}

export type ProfessionalEditor = ReturnType<typeof useProfessionalEditor>;
