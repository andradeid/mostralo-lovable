import { useState, useMemo } from 'react';
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
  UserX
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
import { InfoTooltip } from '@/components/ui/info-tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    description: '',
    photo_url: '',
    commission_type: 'percentage' as 'percentage' | 'fixed',
    commission_value: 0
  });

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
      specialty: '',
      description: '',
      photo_url: '',
      commission_type: 'percentage',
      commission_value: 0
    });
  };

  const handleCreate = async () => {
    if (!storeId || !formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      await createProfessional({
        store_id: storeId,
        name: formData.name.trim(),
        specialty: formData.specialty.trim() || undefined,
        description: formData.description.trim() || undefined,
        photo_url: formData.photo_url.trim() || undefined,
        commission_type: formData.commission_type,
        commission_value: formData.commission_value
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = async () => {
    if (!selectedProfessional || !formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      await updateProfessional({
        id: selectedProfessional.id,
        name: formData.name.trim(),
        specialty: formData.specialty.trim() || undefined,
        description: formData.description.trim() || undefined,
        photo_url: formData.photo_url.trim() || undefined,
        commission_type: formData.commission_type,
        commission_value: formData.commission_value
      });
      setIsEditDialogOpen(false);
      setSelectedProfessional(null);
      resetForm();
    } catch (error) {
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

  const openEditDialog = (professional: Professional) => {
    setSelectedProfessional(professional);
    setFormData({
      name: professional.name,
      specialty: professional.specialty || '',
      description: professional.description || '',
      photo_url: professional.photo_url || '',
      commission_type: professional.commission_type,
      commission_value: professional.commission_value
    });
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
                    <Badge variant={professional.is_active ? 'default' : 'secondary'}>
                      {professional.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
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
            <div className="space-y-4">
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
              <div>
                <Label htmlFor="photo_url">URL da Foto</Label>
                <Input
                  id="photo_url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Profissional</DialogTitle>
              <DialogDescription>
                Atualize as informações do profissional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do profissional"
                />
              </div>
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
              <div>
                <Label htmlFor="edit-photo_url">URL da Foto</Label>
                <Input
                  id="edit-photo_url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
            </div>
            <DialogFooter>
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
      </div>
    </ModuleGate>
  );
};

export default ProfessionalsPage;
