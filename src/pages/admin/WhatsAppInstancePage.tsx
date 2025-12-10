import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { 
  Loader2, 
  Smartphone, 
  RefreshCw, 
  Power, 
  PowerOff, 
  Trash2, 
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  User
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function WhatsAppInstancePage() {
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [instance, setInstance] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      fetchInstance();
    }
  }, [storeId]);

  // Polling para verificar status quando conectando
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (instance?.status === 'connecting') {
      interval = setInterval(() => {
        checkStatus();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [instance?.status]);

  const fetchInstance = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances' as any)
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (data) {
        setInstance(data);
      }
    } catch (error) {
      console.log('Nenhuma instância encontrada');
    } finally {
      setLoading(false);
    }
  };

  const callInstanceFunction = async (action: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const response = await supabase.functions.invoke('whatsapp-instance', {
      body: { action, storeId },
    });

    if (response.error) throw response.error;
    return response.data;
  };

  const createInstance = async () => {
    setActionLoading('create');
    try {
      const result = await callInstanceFunction('create');
      
      if (result.success) {
        setInstance(result.instance);
        setQrCode(result.qrcode);
        toast({
          title: "Instância Criada",
          description: "Escaneie o QR Code para conectar seu WhatsApp",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar instância",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const connectInstance = async () => {
    setActionLoading('connect');
    try {
      const result = await callInstanceFunction('connect');
      
      if (result.success && result.qrcode) {
        setQrCode(result.qrcode);
        setInstance((prev: any) => ({ ...prev, status: 'connecting' }));
        toast({
          title: "QR Code Gerado",
          description: "Escaneie o QR Code com seu WhatsApp",
        });
      } else if (result.status === 'connected') {
        setInstance((prev: any) => ({ ...prev, status: 'connected' }));
        setQrCode(null);
        toast({
          title: "Conectado!",
          description: "WhatsApp já está conectado",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar QR Code",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const checkStatus = async () => {
    try {
      const result = await callInstanceFunction('status');
      
      if (result.success) {
        setInstance(result.instance);
        if (result.status === 'connected') {
          setQrCode(null);
          toast({
            title: "Conectado!",
            description: "WhatsApp conectado com sucesso",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const disconnectInstance = async () => {
    setActionLoading('disconnect');
    try {
      const result = await callInstanceFunction('disconnect');
      
      if (result.success) {
        setInstance((prev: any) => ({ ...prev, status: 'disconnected' }));
        setQrCode(null);
        toast({
          title: "Desconectado",
          description: "WhatsApp desconectado com sucesso",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desconectar",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteInstance = async () => {
    setActionLoading('delete');
    try {
      const result = await callInstanceFunction('delete');
      
      if (result.success) {
        setInstance(null);
        setQrCode(null);
        toast({
          title: "Removido",
          description: "Instância removida com sucesso",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover instância",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Conectando</Badge>;
      case 'banned':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Banido</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Desconectado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conexão WhatsApp</h1>
        <p className="text-muted-foreground">
          Conecte seu WhatsApp para enviar campanhas de recuperação de clientes
        </p>
      </div>

      {!instance ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Nenhuma Instância Configurada
            </CardTitle>
            <CardDescription>
              Crie uma instância para conectar seu WhatsApp e começar a enviar mensagens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={createInstance} disabled={actionLoading === 'create'}>
              {actionLoading === 'create' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Criar Instância
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Status da Conexão
                </span>
                {getStatusBadge(instance.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {instance.status === 'connected' && instance.phone_number && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  {instance.profile_picture_url && (
                    <div className="flex justify-center">
                      <img 
                        src={instance.profile_picture_url} 
                        alt="Perfil" 
                        className="h-20 w-20 rounded-full"
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-medium">{instance.profile_name || 'WhatsApp Conectado'}</p>
                    <p className="text-sm text-muted-foreground">+{instance.phone_number}</p>
                  </div>
                  {instance.last_connected_at && (
                    <p className="text-xs text-center text-muted-foreground">
                      Conectado em: {new Date(instance.last_connected_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {instance.status !== 'connected' && (
                  <Button 
                    onClick={connectInstance} 
                    disabled={actionLoading === 'connect'}
                  >
                    {actionLoading === 'connect' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando QR...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  onClick={checkStatus}
                  disabled={!!actionLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status
                </Button>

                {instance.status === 'connected' && (
                  <Button 
                    variant="outline" 
                    onClick={disconnectInstance}
                    disabled={actionLoading === 'disconnect'}
                  >
                    {actionLoading === 'disconnect' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PowerOff className="h-4 w-4 mr-2" />
                    )}
                    Desconectar
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!!actionLoading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Instância?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso irá remover a conexão do WhatsApp. Você precisará escanear o QR Code 
                        novamente para reconectar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteInstance}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {(qrCode || instance.qr_code) && instance.status !== 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Escaneie o QR Code
                </CardTitle>
                <CardDescription>
                  Abra o WhatsApp no seu celular e escaneie o código abaixo
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={qrCode || instance.qr_code} 
                    alt="QR Code" 
                    className="h-64 w-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  O QR Code expira em alguns segundos. Clique em "Gerar QR Code" para obter um novo.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Como Conectar</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Clique em "Criar Instância" se ainda não tiver uma</li>
            <li>Clique em "Gerar QR Code" para obter o código</li>
            <li>Abra o WhatsApp no seu celular</li>
            <li>Vá em Configurações {'>'}  Aparelhos Conectados {'>'}  Conectar um Aparelho</li>
            <li>Escaneie o QR Code exibido na tela</li>
            <li>Aguarde a conexão ser estabelecida</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
