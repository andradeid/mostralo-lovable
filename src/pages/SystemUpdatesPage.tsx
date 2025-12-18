import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Megaphone, CheckCheck, Rocket, Bug, Zap, Shield, AlertTriangle, Bell } from 'lucide-react';
import { UpdateCard } from '@/components/system-updates/UpdateCard';
import { useUnreadUpdates } from '@/hooks/useUnreadUpdates';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface UpdateImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  category: 'feature' | 'fix' | 'improvement' | 'security';
  importance: 'normal' | 'important' | 'critical';
  release_date: string;
  is_published: boolean;
  system_update_images?: UpdateImage[];
}

export default function SystemUpdatesPage() {
  const { profile } = useAuth();
  const { unreadUpdates, markAsRead, markAllAsRead, refetch } = useUnreadUpdates();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('system_updates')
        .select(`
          *,
          system_update_images (*)
        `)
        .eq('is_published', true)
        .order('release_date', { ascending: false });

      if (error) throw error;
      setUpdates((data || []) as SystemUpdate[]);
    } catch (error) {
      console.error('Erro ao buscar atualizações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadIds = async () => {
    if (!profile?.id) return;

    try {
      const { data } = await supabase
        .from('user_update_reads')
        .select('update_id')
        .eq('user_id', profile.id);

      setReadIds(new Set((data || []).map(r => r.update_id)));
    } catch (error) {
      console.error('Erro ao buscar leituras:', error);
    }
  };

  useEffect(() => {
    fetchUpdates();
    fetchReadIds();
  }, [profile?.id]);

  const handleMarkAsRead = async (updateId: string) => {
    await markAsRead(updateId);
    setReadIds(prev => new Set([...prev, updateId]));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    const allIds = updates.map(u => u.id);
    setReadIds(new Set(allIds));
  };

  // Estatísticas
  const stats = {
    features: updates.filter(u => u.category === 'feature').length,
    fixes: updates.filter(u => u.category === 'fix').length,
    improvements: updates.filter(u => u.category === 'improvement').length,
    security: updates.filter(u => u.category === 'security').length,
    critical: updates.filter(u => u.importance === 'critical').length,
    important: updates.filter(u => u.importance === 'important').length,
    unread: updates.filter(u => !readIds.has(u.id)).length
  };

  const filteredUpdates = updates.filter(update => {
    if (categoryFilter !== 'all' && update.category !== categoryFilter) {
      return false;
    }
    if (importanceFilter !== 'all' && update.importance !== importanceFilter) {
      return false;
    }
    return true;
  });

  const unreadCount = filteredUpdates.filter(u => !readIds.has(u.id)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Novidades do Sistema</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe as atualizações e melhorias do Mostralo
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas ({unreadCount})
          </Button>
        )}
      </div>

      {/* Card de Estatísticas */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Resumo das Novidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Rocket className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-blue-500">{stats.features}</p>
                <p className="text-xs text-muted-foreground">Funcionalidades</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Bug className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-orange-500">{stats.fixes}</p>
                <p className="text-xs text-muted-foreground">Correções</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-lg font-bold text-yellow-500">{stats.improvements}</p>
                <p className="text-xs text-muted-foreground">Melhorias</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Shield className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-lg font-bold text-green-500">{stats.security}</p>
                <p className="text-xs text-muted-foreground">Segurança</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-lg font-bold text-red-500">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Críticos</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold text-primary">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">Não lidas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="feature">🚀 Novas Funcionalidades</SelectItem>
                  <SelectItem value="fix">🐛 Correções</SelectItem>
                  <SelectItem value="improvement">⚡ Melhorias</SelectItem>
                  <SelectItem value="security">🔒 Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={importanceFilter} onValueChange={setImportanceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por importância" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as importâncias</SelectItem>
                  <SelectItem value="critical">🔴 Crítico</SelectItem>
                  <SelectItem value="important">🟡 Importante</SelectItem>
                  <SelectItem value="normal">🟢 Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground flex items-center whitespace-nowrap">
              {filteredUpdates.length} atualização(ões)
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredUpdates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma atualização encontrada</h3>
            <p className="text-muted-foreground">
              Não há atualizações disponíveis com os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredUpdates.map(update => (
            <UpdateCard
              key={update.id}
              update={update}
              isRead={readIds.has(update.id)}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
