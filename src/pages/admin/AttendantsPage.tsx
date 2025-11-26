import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  UserPlus,
  User as UserIcon,
  Mail,
  Calendar,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Store,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePageSEO } from '@/hooks/useSEO';

interface Attendant {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  store_id: string;
  store_name?: string;
}

interface Store {
  id: string;
  name: string;
}

const AttendantsPage = () => {
  const { profile, userRole } = useAuth();
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState<Attendant | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    store_id: ''
  });

  usePageSEO({
    title: 'Gerenciar Atendentes - Mostralo',
    description: 'Gerencie os atendentes da sua loja',
    keywords: 'atendentes, gerenciamento, loja'
  });

  useEffect(() => {
    fetchStores();
    fetchAttendants();
  }, []);

  const fetchStores = async () => {
    try {
      let query = supabase
        .from('stores')
        .select('id, name')
        .order('name', { ascending: true });

      // Store admin só vê sua própria loja
      if (userRole === 'store_admin' && profile?.id) {
        query = query.eq('owner_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar lojas:', error);
      toast.error('Erro ao carregar lojas');
    }
  };

  const fetchAttendants = async () => {
    setLoading(true);
    console.log('🔍 AttendantsPage: Iniciando busca de atendentes', {
      userRole,
      profileId: profile?.id,
      profileEmail: profile?.email
    });

    try {
      // Buscar user_roles com role = 'attendant'
      let rolesQuery = supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          store_id,
          created_at,
          stores (
            name
          )
        `)
        .eq('role', 'attendant' as any)
        .order('created_at', { ascending: false });

      // Store admin só vê atendentes da sua loja
      if (userRole === 'store_admin' && profile?.id) {
        console.log('👤 AttendantsPage: Buscando loja do store_admin');
        const { data: userStore, error: storeError } = await supabase
          .from('stores')
          .select('id, name')
          .eq('owner_id', profile.id)
          .single();

        console.log('🏪 AttendantsPage: Resultado da busca de loja:', { 
          userStore, 
          storeError,
          ownerId: profile.id 
        });

        if (userStore) {
          console.log('✅ AttendantsPage: Filtrando por store_id:', userStore.id);
          rolesQuery = rolesQuery.eq('store_id', userStore.id);
        } else {
          console.warn('⚠️ AttendantsPage: Store admin sem loja associada');
          setAttendants([]);
          setLoading(false);
          return;
        }
      }

      const { data: roles, error: rolesError } = await rolesQuery;
      
      console.log('📊 AttendantsPage: Resultado da query de roles:', {
        rolesCount: roles?.length || 0,
        roles,
        rolesError
      });

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        console.log('📭 AttendantsPage: Nenhum atendente encontrado');
        setAttendants([]);
        setLoading(false);
        return;
      }

      console.log('👥 AttendantsPage: Buscando profiles dos atendentes');
      // Buscar profiles dos atendentes
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .in('id', userIds);

      console.log('📊 AttendantsPage: Profiles encontrados:', {
        profilesCount: profiles?.length || 0,
        profiles,
        profilesError
      });

      if (profilesError) throw profilesError;

      // Combinar dados
      const attendantsData: Attendant[] = roles.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          id: role.user_id,
          email: profile?.email || '',
          full_name: profile?.full_name || null,
          created_at: role.created_at,
          store_id: role.store_id,
          store_name: (role.stores as any)?.name
        };
      });

      console.log('✅ AttendantsPage: Atendentes processados:', attendantsData);
      setAttendants(attendantsData);
    } catch (error: any) {
      console.error('Erro ao buscar atendentes:', error);
      toast.error('Erro ao carregar atendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.store_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Chamar Edge Function para criar atendente
      // O Supabase JS automaticamente adiciona o token de autenticação
      const { data, error } = await supabase.functions.invoke('create-attendant', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || null,
          store_id: formData.store_id
        }
      });

      console.log('Resposta da Edge Function:', { data, error });

      // IMPORTANTE: Verificar data?.error primeiro, pois mesmo com error HTTP, data pode conter a mensagem real
      if (data?.error) {
        console.error('Erro retornado pela Edge Function:', data);
        // Construir mensagem de erro completa com todos os detalhes disponíveis
        let errorMsg = data.error;
        if (data.details) {
          errorMsg += `: ${data.details}`;
        } else if (data.message) {
          errorMsg += `: ${data.message}`;
        }
        if (data.hint) {
          errorMsg += ` (${data.hint})`;
        }
        if (data.code) {
          errorMsg += ` [Código: ${data.code}]`;
        }
        toast.error(errorMsg);
        return;
      }

      if (error) {
        console.error('Erro HTTP da Edge Function:', error);
        // Tentar extrair mensagem de erro do response
        const errorMessage = error.message || 'Erro ao criar atendente';
        toast.error(errorMessage);
        return;
      }

      if (!data || !data.success) {
        console.error('Resposta inválida:', data);
        toast.error('Resposta inválida do servidor');
        return;
      }

      toast.success('Atendente criado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({ email: '', full_name: '', password: '', store_id: '' });
      fetchAttendants();
    } catch (error: any) {
      console.error('Erro ao criar atendente:', error);
      const errorMessage = error.message || error.toString() || 'Erro ao criar atendente';
      toast.error(errorMessage);
    }
  };

  const handleEdit = async () => {
    if (!selectedAttendant) return;

    console.log('🔄 Iniciando edição de atendente:', {
      id: selectedAttendant.id,
      email: selectedAttendant.email,
      novoNome: formData.full_name,
      novaLoja: formData.store_id
    });

    try {
      // Atualizar profile do atendente
      const { data: updatedData, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null
        })
        .eq('id', selectedAttendant.id)
        .select();

      console.log('📊 Resultado da atualização do profile:', { updatedData, profileError });

      if (profileError) {
        console.error('❌ Erro ao atualizar profile:', profileError);
        throw profileError;
      }

      if (!updatedData || updatedData.length === 0) {
        console.warn('⚠️ Nenhuma linha foi atualizada no profile');
        throw new Error('Nenhuma linha foi atualizada. Verifique as permissões.');
      }

      console.log('✅ Profile atualizado com sucesso:', updatedData[0]);

      // Se mudou a loja, atualizar user_roles
      if (formData.store_id && formData.store_id !== selectedAttendant.store_id) {
        console.log('🏪 Atualizando loja do atendente:', formData.store_id);
        
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .update({ store_id: formData.store_id })
          .eq('user_id', selectedAttendant.id)
          .eq('role', 'attendant' as any)
          .select();

        console.log('📊 Resultado da atualização de role:', { roleData, roleError });

        if (roleError) {
          console.error('❌ Erro ao atualizar role:', roleError);
          throw roleError;
        }

        console.log('✅ Loja atualizada com sucesso');
      }

      toast.success('Atendente atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedAttendant(null);
      setFormData({ email: '', full_name: '', password: '', store_id: '' });
      
      // Aguardar um pouco antes de buscar novamente (garante que o DB foi atualizado)
      await new Promise(resolve => setTimeout(resolve, 500));
      fetchAttendants();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar atendente:', error);
      toast.error(`Erro ao atualizar atendente: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedAttendant) return;

    try {
      // Remover role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedAttendant.id)
        .eq('role', 'attendant' as any);

      if (roleError) throw roleError;

      toast.success('Atendente removido com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedAttendant(null);
      fetchAttendants();
    } catch (error: any) {
      console.error('Erro ao remover atendente:', error);
      toast.error('Erro ao remover atendente');
    }
  };

  const filteredAttendants = attendants.filter(attendant =>
    attendant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendant.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atendentes</h1>
          <p className="text-muted-foreground">
            Gerencie os atendentes da sua loja
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Atendente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Atendentes</CardTitle>
              <CardDescription>
                {filteredAttendants.length} atendente(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atendente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredAttendants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum atendente encontrado' : 'Nenhum atendente cadastrado'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAttendants.map((attendant) => (
                <div
                  key={attendant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {attendant.full_name || 'Sem nome'}
                        </p>
                        <Badge variant="outline">Atendente</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {attendant.email}
                        </div>
                        {attendant.store_name && (
                          <div className="flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {attendant.store_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(attendant.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAttendant(attendant);
                          setFormData({
                            email: attendant.email,
                            full_name: attendant.full_name || '',
                            password: '',
                            store_id: attendant.store_id
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAttendant(attendant);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar Atendente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Atendente</DialogTitle>
            <DialogDescription>
              Crie uma conta para um novo atendente da loja
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="atendente@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome do atendente"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Senha temporária"
              />
            </div>
            <div>
              <Label htmlFor="store_id">Loja *</Label>
              <Select
                value={formData.store_id}
                onValueChange={(value) => setFormData({ ...formData, store_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>
              Criar Atendente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Atendente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Atendente</DialogTitle>
            <DialogDescription>
              Atualize as informações do atendente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_email">E-mail</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="atendente@exemplo.com"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                O e-mail não pode ser alterado
              </p>
            </div>
            <div>
              <Label htmlFor="edit_full_name">Nome Completo</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome do atendente"
              />
            </div>
            <div>
              <Label htmlFor="edit_store_id">Loja</Label>
              <Select
                value={formData.store_id}
                onValueChange={(value) => setFormData({ ...formData, store_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Remover Atendente */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Atendente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este atendente? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedAttendant && (
            <div className="py-4">
              <p className="font-semibold">{selectedAttendant.full_name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">{selectedAttendant.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendantsPage;

