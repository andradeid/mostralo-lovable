import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, CheckCircle2, AlertTriangle, RefreshCw, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreModules } from '@/hooks/useStoreModules';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  backgroundColor?: string;
}

interface ProfessionalGoogleCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
  storeId: string;
}

export function ProfessionalGoogleCalendarDialog({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  storeId
}: ProfessionalGoogleCalendarDialogProps) {
  const { session } = useAuth();
  const { hasModule, loading: loadingModules } = useStoreModules(storeId);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [tokenData, setTokenData] = useState<Record<string, unknown> | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');

  // Verificar módulo usando o hook correto
  const hasGoogleModule = hasModule('google_calendar');

  const fetchCalendars = useCallback(async () => {
    setLoadingCalendars(true);
    try {
      // Garantir que temos uma sessão válida
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        console.log('fetchCalendars: No session token');
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      console.log('fetchCalendars: Calling edge function for professional:', professionalId);
      const { data, error } = await supabase.functions.invoke('google-calendar-list-calendars', {
        body: { professional_id: professionalId }
      });

      console.log('fetchCalendars: Response:', { data, error });

      if (error) {
        console.error('fetchCalendars: Error from edge function:', error);
        // Tentar extrair mensagem de erro do contexto
        const errorMsg = data?.error || 'Erro ao buscar calendários';
        toast.error(errorMsg);
        return;
      }

      if (data?.calendars && data.calendars.length > 0) {
        setCalendars(data.calendars);
        console.log('fetchCalendars: Loaded', data.calendars.length, 'calendars');
      } else if (data?.error) {
        console.error('fetchCalendars: API error:', data.error);
        toast.error(data.error);
      } else {
        console.log('fetchCalendars: No calendars found');
        toast.warning('Nenhum calendário encontrado na conta Google');
      }
    } catch (err) {
      console.error('fetchCalendars: Exception:', err);
      toast.error('Erro ao buscar calendários');
    } finally {
      setLoadingCalendars(false);
    }
  }, [professionalId]);

  useEffect(() => {
    if (!open || !professionalId) return;
    
    const fetchTokenData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://noshwvwpjtnvndokbfjx.supabase.co/rest/v1/google_calendar_tokens?professional_id=eq.${professionalId}&select=*&limit=1`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA',
              'Authorization': `Bearer ${session?.access_token || ''}`
            }
          }
        );
        const data = await response.json();
        const token = data?.[0];
        if (token) {
          setTokenData(token as Record<string, unknown>);
          setSyncEnabled(Boolean(token.sync_enabled ?? true));
          setSelectedCalendarId(String(token.calendar_id || 'primary'));
          if (token.is_active) {
            fetchCalendars();
          }
        } else {
          setTokenData(null);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenData();
  }, [open, professionalId, fetchCalendars, session?.access_token]);

  const handleConnect = async () => {
    if (!session?.access_token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { professional_id: professionalId }
      });

      if (error) {
        toast.error('Erro ao iniciar conexão');
        return;
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao conectar');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('professional_id', professionalId);

      if (error) {
        toast.error('Erro ao desconectar');
        return;
      }

      setTokenData(null);
      setCalendars([]);
      toast.success('Google Calendar desconectado');
    } catch (err) {
      toast.error('Erro ao desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('google_calendar_tokens')
        .update({
          sync_enabled: syncEnabled,
          calendar_id: selectedCalendarId,
          updated_at: new Date().toISOString()
        })
        .eq('professional_id', professionalId);

      if (error) {
        toast.error('Erro ao salvar');
        return;
      }

      toast.success('Configurações salvas');
    } catch (err) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Mostrar loading enquanto verifica módulos
  if (loadingModules) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!hasGoogleModule) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-muted-foreground">
              O módulo <strong>Google Calendar</strong> não está habilitado.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar - {professionalName}
          </DialogTitle>
          <DialogDescription>
            Sincronize agendamentos automaticamente.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !tokenData?.is_active ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Conecte uma conta Google para <strong>{professionalName}</strong>.
              </p>
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                {connecting ? 'Conectando...' : 'Conectar Google Calendar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Conectado</p>
                  <p className="text-sm text-green-600">{String(tokenData.google_email || '')}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={disconnecting} className="text-red-600 hover:bg-red-50">
                {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Unlink className="h-4 w-4 mr-1" />Desconectar</>}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Calendário</Label>
                <Button variant="ghost" size="sm" onClick={fetchCalendars} disabled={loadingCalendars}>
                  <RefreshCw className={`h-4 w-4 ${loadingCalendars ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {loadingCalendars ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Carregando calendários...</span>
                </div>
              ) : calendars.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-4 border border-dashed rounded-md">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum calendário encontrado. Clique no botão de atualizar.
                  </p>
                  <Button variant="outline" size="sm" onClick={fetchCalendars}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Carregar Calendários
                  </Button>
                </div>
              ) : (
                <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                  <SelectTrigger><SelectValue placeholder="Selecione um calendário" /></SelectTrigger>
                  <SelectContent>
                    {calendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        <div className="flex items-center gap-2">
                          {cal.backgroundColor && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.backgroundColor }} />}
                          <span>{cal.summary}</span>
                          {cal.primary && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>Sincronização ativa</Label>
              <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Configurações'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
