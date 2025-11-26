import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePageSEO } from '@/hooks/useSEO';
import { 
  Users, 
  Crown, 
  Store, 
  User,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: 'master_admin' | 'store_admin';
  created_at: string;
}

const UsersDemo = () => {
  usePageSEO({
    title: 'Usuários Demonstração - Mostralo | Conheça os Perfis',
    description: 'Veja exemplos de usuários da plataforma Mostralo. Conheça diferentes tipos de perfis e funcionalidades disponíveis.',
    keywords: 'usuários demo, exemplos usuários, perfis mostralo, demonstração plataforma'
  });

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os perfis de usuário.',
          variant: 'destructive'
        });
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeInfo = (userType: string) => {
    switch (userType) {
      case 'master_admin':
        return {
          label: 'Super Admin',
          description: 'Acesso total ao sistema, gerencia planos e módulos',
          icon: Crown,
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      case 'store_admin':
        return {
          label: 'Dono da Loja',
          description: 'Gerencia sua própria loja e produtos',
          icon: Store,
          variant: 'default' as const,
          color: 'text-blue-600'
        };
      default:
        return {
          label: 'Usuário',
          description: 'Usuário padrão do sistema',
          icon: User,
          variant: 'secondary' as const,
          color: 'text-gray-600'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Usuários de Demonstração</h1>
          </div>
          <p className="text-muted-foreground">
            Perfis de exemplo criados para testes e demonstração do sistema Mostralo.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {profiles.map((profile) => {
            const userInfo = getUserTypeInfo(profile.user_type);
            const IconComponent = userInfo.icon;

            return (
              <Card key={profile.id} className="relative overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full bg-muted ${userInfo.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {profile.full_name || 'Nome não informado'}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <Mail className="w-4 h-4" />
                          <span>{profile.email}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={userInfo.variant} className="ml-2">
                      {userInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {userInfo.description}
                    </p>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Criado em: {formatDate(profile.created_at)}</span>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        <strong>ID:</strong> {profile.id}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {profiles.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum perfil encontrado</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Não há perfis de usuário criados no sistema ainda. 
                Execute a migração de dados de exemplo para criar os perfis de demonstração.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>Informações Importantes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <strong>Dados de Demonstração:</strong> Estes perfis são criados apenas para testes.
              </div>
              <div>
                <strong>Login Real:</strong> Para usar com autenticação real, crie contas com os emails mostrados na página de registro.
              </div>
              <div>
                <strong>Níveis de Acesso:</strong> Cada tipo de usuário tem permissões específicas no sistema.
              </div>
              <div>
                <strong>Loja de Exemplo:</strong> O usuário "João Santos" é proprietário da "Pizzaria do João".
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersDemo;