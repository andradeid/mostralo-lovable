import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Scissors, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Loader2,
  MoreVertical,
  Clock,
  DollarSign,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, BookingService, CreateBookingServiceInput } from '@/hooks/useBooking';
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
import { Switch } from '@/components/ui/switch';
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

const BookingServicesPage = () => {
  const { storeId } = useStoreAccess();
  const { 
    bookingServices, 
    loadingServices,
    createService,
    updateService,
    deleteService,
    creatingService,
    updatingService,
    deletingService
  } = useBooking(storeId);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    buffer_minutes: 0,
    price: 0,
    price_type: 'fixed' as 'fixed' | 'from',
    image_url: '',
    requires_deposit: false,
    deposit_amount: 0,
    deposit_percentage: 0
  });

  usePageSEO({
    title: 'Serviços de Agendamento',
    description: 'Gerencie os serviços disponíveis para agendamento',
    keywords: 'serviços, agendamento, duração, preço'
  });

  const filteredServices = bookingServices.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 30,
      buffer_minutes: 0,
      price: 0,
      price_type: 'fixed',
      image_url: '',
      requires_deposit: false,
      deposit_amount: 0,
      deposit_percentage: 0
    });
  };

  const handleCreate = async () => {
    if (!storeId || !formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.error('Duração deve ser maior que 0');
      return;
    }

    try {
      await createService({
        store_id: storeId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        duration_minutes: formData.duration_minutes,
        buffer_minutes: formData.buffer_minutes,
        price: formData.price,
        price_type: formData.price_type,
        image_url: formData.image_url.trim() || undefined,
        requires_deposit: formData.requires_deposit,
        deposit_amount: formData.requires_deposit ? formData.deposit_amount : undefined,
        deposit_percentage: formData.requires_deposit ? formData.deposit_percentage : undefined
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = async () => {
    if (!selectedService || !formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      await updateService({
        id: selectedService.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        duration_minutes: formData.duration_minutes,
        buffer_minutes: formData.buffer_minutes,
        price: formData.price,
        price_type: formData.price_type,
        image_url: formData.image_url.trim() || undefined,
        requires_deposit: formData.requires_deposit,
        deposit_amount: formData.requires_deposit ? formData.deposit_amount : undefined,
        deposit_percentage: formData.requires_deposit ? formData.deposit_percentage : undefined
      });
      setIsEditDialogOpen(false);
      setSelectedService(null);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    try {
      await deleteService(selectedService.id);
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleActive = async (service: BookingService) => {
    try {
      await updateService({
        id: service.id,
        is_active: !service.is_active
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const openEditDialog = (service: BookingService) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      buffer_minutes: service.buffer_minutes,
      price: service.price,
      price_type: service.price_type,
      image_url: service.image_url || '',
      requires_deposit: service.requires_deposit,
      deposit_amount: service.deposit_amount || 0,
      deposit_percentage: service.deposit_percentage || 0
    });
    setIsEditDialogOpen(true);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatPrice = (price: number, priceType: 'fixed' | 'from') => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
    return priceType === 'from' ? `A partir de ${formatted}` : formatted;
  };

  return (
    <ModuleGate moduleKey="booking">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              Serviços de Agendamento
            </h1>
            <p className="text-muted-foreground">
              Configure os serviços disponíveis para agendamento online
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        {loadingServices ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
              </p>
              {!searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar primeiro serviço
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatPrice(service.price, service.price_type)}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(service)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                          {service.is_active ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedService(service);
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
                  <div className="space-y-3">
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(service.duration_minutes)}
                      </Badge>
                      {service.buffer_minutes > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Timer className="h-3 w-3" />
                          +{service.buffer_minutes}min buffer
                        </Badge>
                      )}
                      {service.requires_deposit && (
                        <Badge variant="outline" className="gap-1 text-amber-600">
                          <DollarSign className="h-3 w-3" />
                          Requer sinal
                        </Badge>
                      )}
                    </div>
                    <Badge variant={service.is_active ? 'default' : 'secondary'}>
                      {service.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog 
          open={isCreateDialogOpen || isEditDialogOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedService(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditDialogOpen ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
              <DialogDescription>
                {isEditDialogOpen 
                  ? 'Atualize as informações do serviço' 
                  : 'Cadastre um novo serviço para agendamento'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Corte de Cabelo, Consulta, Banho e Tosa"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição detalhada do serviço"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duration_minutes: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="buffer">Buffer (minutos)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    min="0"
                    step="5"
                    value={formData.buffer_minutes}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      buffer_minutes: parseInt(e.target.value) || 0 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Intervalo entre atendimentos
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price_type">Tipo de Preço</Label>
                  <Select
                    value={formData.price_type}
                    onValueChange={(value: 'fixed' | 'from') => 
                      setFormData(prev => ({ ...prev, price_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Preço Fixo</SelectItem>
                      <SelectItem value="from">A partir de</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              
              {/* Deposit section */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Exigir Sinal</Label>
                    <p className="text-xs text-muted-foreground">
                      Exigir pagamento de sinal para confirmar agendamento
                    </p>
                  </div>
                  <Switch
                    checked={formData.requires_deposit}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, requires_deposit: checked }))
                    }
                  />
                </div>
                {formData.requires_deposit && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit_amount">Valor Fixo (R$)</Label>
                      <Input
                        id="deposit_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          deposit_amount: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deposit_percentage">Ou % do Total</Label>
                      <Input
                        id="deposit_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.deposit_percentage}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          deposit_percentage: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={isEditDialogOpen ? handleEdit : handleCreate} 
                disabled={creatingService || updatingService}
              >
                {(creatingService || updatingService) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isEditDialogOpen ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{selectedService?.name}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingService && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ModuleGate>
  );
};

export default BookingServicesPage;
