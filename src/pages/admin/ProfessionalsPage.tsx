import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  UserPlus,
  Edit,
  Trash2,
  Loader2,
  MoreVertical,
  Calendar,
  Clock,
  Percent,
  DollarSign,
  CalendarOff,
  Scissors,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Settings,
  UserCheck,
  UserX,
  Mail,
  CheckCircle2,
  Key,
  Link2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, Professional, CreateProfessionalInput } from '@/hooks/useBooking';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { usePageSEO } from '@/hooks/useSEO';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfessionalScheduleDialog } from '@/components/admin/booking/ProfessionalScheduleDialog';
import { ProfessionalBlocksDialog } from '@/components/admin/booking/ProfessionalBlocksDialog';
import { ProfessionalServicesDialog } from '@/components/admin/booking/ProfessionalServicesDialog';
import { ProfessionalAgendaDialog } from '@/components/admin/booking/ProfessionalAgendaDialog';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ProfessionalWhatsAppValidator, 
  WhatsAppValidationOverlay,
  WhatsAppValidationStatus,
  validateAndWelcomeProfessional 
} from '@/components/admin/booking/ProfessionalWhatsAppValidator';
import { ProfessionalPhotoUpload } from '@/components/admin/booking/ProfessionalPhotoUpload';
import { supabase } from '@/integrations/supabase/client';

const ProfessionalsPage = () => {
  const { profile } = useAuth();
  const { storeId } = useStoreAccess();
  const { 
    professionals, 
    loadingProfessionals,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    creatingProfessional,
    updatingProfessional,
    deletingProfessional
  } = useBooking(storeId);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isBlocksDialogOpen, setIsBlocksDialogOpen] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showValidationOverlay, setShowValidationOverlay] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppValidationStatus>('idle');
  const [storeName, setStoreName] = useState('');
  
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
  
  // Estado para edição de senha
  const [editPasswordData, setEditPasswordData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [professionalServices, setProfessionalServices] = useState<Record<string, { id: string; name: string }[]>>({});
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  // Fetch store slug for booking link
  useEffect(() => {
    const fetchStoreSlug = async () => {
      if (!storeId) return;
      const { data } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single();
      if (data) setStoreSlug(data.slug);
    };
    fetchStoreSlug();
  }, [storeId]);

  // Buscar serviços vinculados a cada profissional
  useEffect(() => {
    const fetchProfessionalServices = async () => {
      if (!professionals.length || !storeId) return;

      const professionalIds = professionals.map(p => p.id);
      
      const { data, error } = await supabase
        .from('professional_services')
        .select(`
          professional_id,
          service:booking_services(id, name)
        `)
        .in('professional_id', professionalIds);

      if (error) {
        console.error('Error fetching professional services:', error);
        return;
      }

      // Agrupar serviços por profissional
      const servicesMap: Record<string, { id: string; name: string }[]> = {};
      (data || []).forEach((ps: any) => {
        if (ps.service) {
          if (!servicesMap[ps.professional_id]) {
            servicesMap[ps.professional_id] = [];
          }
          servicesMap[ps.professional_id].push(ps.service);
        }
      });

      setProfessionalServices(servicesMap);
    };

    fetchProfessionalServices();
  }, [professionals, storeId]);

  usePageSEO({
    title: 'Profissionais - Agendamento',
    description: 'Gerencie os profissionais do seu estabelecimento',
    keywords: 'profissionais, agendamento, barbeiro, serviços'
  });

  const filteredProfessionals = professionals.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate KPIs
  const kpis = useMemo(() => {
    const active = professionals.filter(p => p.is_active).length;
    const inactive = professionals.filter(p => !p.is_active).length;
    const withCommission = professionals.filter(p => p.commission_value > 0).length;
    return {
      total: professionals.length,
      active,
      inactive,
      withCommission
    };
  }, [professionals]);

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

  // Fetch store name for welcome message
  const fetchStoreName = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase.from('stores').select('name').eq('id', storeId).single();
    if (data?.name) setStoreName(data.name);
  }, [storeId]);

  useState(() => {
    fetchStoreName();
  });

  const handleCreate = async () => {
    if (!storeId || !formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório para acesso ao portal');
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Email inválido');
      return;
    }

    // Validar senha
    if (!formData.password || formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setShowValidationOverlay(true);
    setWhatsappStatus('validating');

    try {
      // Chamar edge function para criar conta com autenticação
      const { data, error } = await supabase.functions.invoke('create-professional-account', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          countryCode: formData.countryCode,
          specialty: formData.specialty.trim() || undefined,
          description: formData.description.trim() || undefined,
          photo_url: formData.photo_url.trim() || undefined,
          commission_type: formData.commission_type,
          commission_value: formData.commission_value,
          store_id: storeId,
          send_whatsapp: !!formData.phone.trim()
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar profissional');
      }

      setWhatsappStatus(data.whatsapp_sent ? 'valid' : 'idle');
      
      // Aguardar animação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowValidationOverlay(false);
      setIsCreateDialogOpen(false);
      resetForm();
      
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

    // Validar senha se preenchida
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
      // Atualizar dados do profissional
      await updateProfessional({
        id: selectedProfessional.id,
        name: formData.name.trim(),
        specialty: formData.specialty.trim() || undefined,
        description: formData.description.trim() || undefined,
        photo_url: formData.photo_url.trim() || undefined,
        commission_type: formData.commission_type,
        commission_value: formData.commission_value
      });

      // Atualizar senha se preenchida
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
      setUpdatingPassword(false);
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!selectedProfessional) return;

    try {
      await deleteProfessional(selectedProfessional.id);
      setIsDeleteDialogOpen(false);
      setSelectedProfessional(null);
    } catch (error) {
      // Error handled by hook
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
    
    // Parse phone if exists (format: 5561999999999 -> countryCode: +55, phone: formatted)
    let countryCode = '+55';
    let phone = '';
    if (professional.phone) {
      // Assume Brazilian format for now
      if (professional.phone.startsWith('55')) {
        countryCode = '+55';
        phone = professional.phone.slice(2);
      } else {
        phone = professional.phone;
      }
    }

    // Buscar email do profissional na tabela profiles
    let professionalEmail = '';
    if (professional.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', professional.user_id)
        .single();
      
      if (profile?.email) {
        professionalEmail = profile.email;
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <ModuleGate moduleKey="booking" storeId={storeId}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Badges */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Profissionais
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie os profissionais que realizam atendimentos
              </p>
            </div>
          </div>
          
          {/* Header Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {kpis.total} Total
            </Badge>
            <Badge variant="default" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
              <UserCheck className="h-3 w-3" />
              {kpis.active} Ativos
            </Badge>
            {kpis.inactive > 0 && (
              <Badge variant="secondary" className="gap-1">
                <UserX className="h-3 w-3" />
                {kpis.inactive} Inativos
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions Card - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1.5" asChild>
                <Link to="/dashboard/booking/calendar">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Ver Agenda</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1.5" asChild>
                <Link to="/dashboard/booking/services">
                  <Settings className="h-4 w-4" />
                  <span className="text-xs">Serviços</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1.5" asChild>
                <a href={`/${storeId}/agendar`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-xs">Pág. Pública</span>
                </a>
              </Button>
              <Button size="sm" className="h-auto py-3 flex-col gap-1.5" onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                <UserPlus className="h-4 w-4" />
                <span className="text-xs font-semibold">Novo Prof.</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tutorial Card */}
        <Collapsible open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2 px-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">Como configurar Profissionais</CardTitle>
                  </div>
                  {isHelpOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4">
                <div className="grid gap-2.5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">Cadastre o profissional</span> com nome e especialidade.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">Configure os HORÁRIOS</span> no menu ⋮ → Horários.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">Adicione BLOQUEIOS</span> para férias ou folgas.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">4</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">Vincule os SERVIÇOS</span> que pode realizar.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">5</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">Defina a COMISSÃO</span> (% ou R$ fixo).
                    </div>
                  </div>
                </div>
              </CardContent>
        </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Card: Como o profissional acessa sua agenda */}
        <Collapsible>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="pb-2 px-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent group">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm">Como o profissional acessa sua agenda?</CardTitle>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 space-y-4">
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">1</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">Ao cadastrar o profissional</span>, você define email e senha. Essas são as credenciais de acesso dele.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">2</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">O profissional acessa a página de login</span> e entra com o email e senha que você cadastrou.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">3</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">Após o login</span>, ele é redirecionado automaticamente para seu painel onde pode ver agenda, comissões, horários e bloqueios.
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => {
                      const loginUrl = `${window.location.origin}/auth`;
                      navigator.clipboard.writeText(loginUrl);
                      toast.success('Link de login copiado!', { description: loginUrl });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar Link de Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-muted-foreground"
                    asChild
                  >
                    <a href="/auth" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir Página de Login
                    </a>
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{kpis.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{kpis.active}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-muted">
                <UserX className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-muted-foreground">{kpis.inactive}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                <Percent className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{kpis.withCommission}</p>
                <p className="text-xs text-muted-foreground">Com Comissão</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar profissional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        {loadingProfessionals ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
              </p>
              {!searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar primeiro profissional
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfessionals.map((professional) => (
              <Card key={professional.id} className={!professional.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={professional.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(professional.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{professional.name}</CardTitle>
                        {professional.specialty && (
                          <CardDescription>{professional.specialty}</CardDescription>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(professional)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedProfessional(professional);
                          setIsScheduleDialogOpen(true);
                        }}>
                          <Clock className="h-4 w-4 mr-2" />
                          Horários
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedProfessional(professional);
                          setIsBlocksDialogOpen(true);
                        }}>
                          <CalendarOff className="h-4 w-4 mr-2" />
                          Bloqueios
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedProfessional(professional);
                          setIsServicesDialogOpen(true);
                        }}>
                          <Scissors className="h-4 w-4 mr-2" />
                          Serviços
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedProfessional(professional);
                          setIsAgendaDialogOpen(true);
                        }}>
                         <Calendar className="h-4 w-4 mr-2" />
                          Ver Agenda Completa
                        </DropdownMenuItem>
                        {storeSlug && (
                          <DropdownMenuItem onClick={() => {
                            const url = `${window.location.origin}/agendar/${storeSlug}?profissional=${professional.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Link copiado!', { 
                              description: 'Cole e compartilhe com o cliente' 
                            });
                          }}>
                            <Link2 className="h-4 w-4 mr-2" />
                            Copiar Link de Agendamento
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleToggleActive(professional)}
                        >
                          {professional.is_active ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedProfessional(professional);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {professional.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {professional.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      {professional.commission_type === 'percentage' ? (
                        <Badge variant="secondary" className="gap-1">
                          <Percent className="h-3 w-3" />
                          {professional.commission_value}% comissão
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {professional.commission_value.toFixed(2)} fixo
                        </Badge>
                      )}
                    </div>
                    
                    {/* Serviços vinculados */}
                    {professionalServices[professional.id]?.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Scissors className="h-3 w-3 text-muted-foreground" />
                        {professionalServices[professional.id].slice(0, 2).map((service) => (
                          <Badge key={service.id} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ))}
                        {professionalServices[professional.id].length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{professionalServices[professional.id].length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={professional.is_active ? 'default' : 'secondary'}>
                        {professional.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {storeSlug && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            const url = `${window.location.origin}/agendar/${storeSlug}?profissional=${professional.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Link copiado!', { 
                              description: 'Cole e compartilhe com o cliente' 
                            });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          Copiar Link
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Profissional</DialogTitle>
              <DialogDescription>
                Cadastre um novo profissional para realizar atendimentos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do profissional"
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email * <span className="text-xs text-muted-foreground">(para acesso ao portal)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="profissional@email.com"
                />
              </div>
              <div>
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Ex: Barbeiro, Manicure, Veterinário"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição do profissional"
                  rows={3}
                />
              </div>
              {/* Photo Upload */}
              <ProfessionalPhotoUpload
                currentPhotoUrl={formData.photo_url}
                professionalName={formData.name}
                onPhotoChange={(url) => setFormData(prev => ({ ...prev, photo_url: url }))}
                disabled={creatingProfessional}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commission_type">Tipo de Comissão</Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={(value: 'percentage' | 'fixed') => 
                      setFormData(prev => ({ ...prev, commission_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem</SelectItem>
                      <SelectItem value="fixed">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="commission_value">
                    {formData.commission_type === 'percentage' ? 'Porcentagem (%)' : 'Valor (R$)'}
                  </Label>
                  <Input
                    id="commission_value"
                    type="number"
                    min="0"
                    step={formData.commission_type === 'percentage' ? '1' : '0.01'}
                    value={formData.commission_value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      commission_value: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
              
              {/* WhatsApp Field */}
              <ProfessionalWhatsAppValidator
                phone={formData.phone}
                countryCode={formData.countryCode}
                onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                onCountryCodeChange={(countryCode) => setFormData(prev => ({ ...prev, countryCode }))}
                onStatusChange={setWhatsappStatus}
                status={whatsappStatus}
                disabled={creatingProfessional}
              />

              {/* Senha de Acesso */}
              <div className="space-y-3 p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Credenciais de Acesso</Label>
                </div>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Digite a senha novamente"
                    />
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
                    )}
                    {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Senhas coincidem
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={creatingProfessional}>
                {creatingProfessional && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Editar Profissional</DialogTitle>
              <DialogDescription>
                Atualize as informações do profissional
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do profissional"
                />
              </div>

              {/* Email de Acesso (somente leitura) */}
              {formData.email && (
                <div>
                  <Label htmlFor="edit-email" className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    Email de Acesso
                  </Label>
                  <Input
                    id="edit-email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O email de acesso não pode ser alterado após o cadastro
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="edit-specialty">Especialidade</Label>
                <Input
                  id="edit-specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Ex: Barbeiro, Manicure, Veterinário"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição do profissional"
                  rows={3}
                />
              </div>
              
              {/* Photo Upload for Edit */}
              <ProfessionalPhotoUpload
                currentPhotoUrl={formData.photo_url}
                professionalName={formData.name}
                onPhotoChange={(url) => setFormData(prev => ({ ...prev, photo_url: url }))}
                disabled={updatingProfessional}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-commission_type">Tipo de Comissão</Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={(value: 'percentage' | 'fixed') => 
                      setFormData(prev => ({ ...prev, commission_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem</SelectItem>
                      <SelectItem value="fixed">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-commission_value">
                    {formData.commission_type === 'percentage' ? 'Porcentagem (%)' : 'Valor (R$)'}
                  </Label>
                  <Input
                    id="edit-commission_value"
                    type="number"
                    min="0"
                    step={formData.commission_type === 'percentage' ? '1' : '0.01'}
                    value={formData.commission_value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      commission_value: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
              
              {/* WhatsApp Field for Edit */}
              <ProfessionalWhatsAppValidator
                phone={formData.phone}
                countryCode={formData.countryCode}
                onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                onCountryCodeChange={(countryCode) => setFormData(prev => ({ ...prev, countryCode }))}
                onStatusChange={setWhatsappStatus}
                status={whatsappStatus}
                disabled={updatingProfessional || updatingPassword}
              />

              {/* Alterar Senha - Opcional */}
              {selectedProfessional?.user_id && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">Alterar Senha (Opcional)</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para manter a senha atual
                  </p>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={editPasswordData.newPassword}
                        onChange={(e) => setEditPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={editPasswordData.confirmNewPassword}
                        onChange={(e) => setEditPasswordData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                        placeholder="Digite a nova senha novamente"
                      />
                      {editPasswordData.newPassword && editPasswordData.confirmNewPassword && editPasswordData.newPassword !== editPasswordData.confirmNewPassword && (
                        <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
                      )}
                      {editPasswordData.newPassword && editPasswordData.confirmNewPassword && editPasswordData.newPassword === editPasswordData.confirmNewPassword && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Senhas coincidem
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={updatingProfessional}>
                {updatingProfessional && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Profissional</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{selectedProfessional?.name}</strong>?
                Esta ação não pode ser desfeita e todos os agendamentos vinculados serão afetados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingProfessional && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Schedule Dialog */}
        {selectedProfessional && (
          <ProfessionalScheduleDialog
            open={isScheduleDialogOpen}
            onOpenChange={setIsScheduleDialogOpen}
            professionalId={selectedProfessional.id}
            professionalName={selectedProfessional.name}
          />
        )}

        {/* Blocks Dialog */}
        {selectedProfessional && (
          <ProfessionalBlocksDialog
            open={isBlocksDialogOpen}
            onOpenChange={setIsBlocksDialogOpen}
            professionalId={selectedProfessional.id}
            professionalName={selectedProfessional.name}
          />
        )}

        {/* Services Dialog */}
        {selectedProfessional && storeId && (
          <ProfessionalServicesDialog
            open={isServicesDialogOpen}
            onOpenChange={setIsServicesDialogOpen}
            professionalId={selectedProfessional.id}
            professionalName={selectedProfessional.name}
            storeId={storeId}
          />
        )}

        {/* Agenda Dialog */}
        {selectedProfessional && (
          <ProfessionalAgendaDialog
            open={isAgendaDialogOpen}
            onOpenChange={setIsAgendaDialogOpen}
            professionalId={selectedProfessional.id}
            professionalName={selectedProfessional.name}
          />
        )}

        {/* WhatsApp Validation Overlay */}
        {showValidationOverlay && (
          <WhatsAppValidationOverlay
            status={whatsappStatus}
            phone={formData.phone}
            professionalName={formData.name}
            storeName={storeName}
            onComplete={() => setShowValidationOverlay(false)}
          />
        )}

      </div>
    </ModuleGate>
  );
};

export default ProfessionalsPage;
