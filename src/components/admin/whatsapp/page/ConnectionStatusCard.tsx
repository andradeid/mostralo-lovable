// Status da conexão (computador) com ações.
// JSX movido da WhatsAppInstancePage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Smartphone,
  RefreshCw,
  PowerOff,
  Trash2,
  QrCode,
  AlertCircle,
  MessageSquare,
  Calendar,
  Phone,
  Users,
  Pause,
  RotateCcw,
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getStatusBadge } from "./statusBadge";
import type { WhatsAppInstancePageCtx } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";

export function ConnectionStatusCard({ ctx }: { ctx: WhatsAppInstancePageCtx & { isConnected?: boolean } }) {
  const { instance, contactsCount, messagesCount, pausedSessionsCount, actionLoading, checkAndFixUazapiWebhook, isUazapiInstance, handleConnect, handleCheckStatus, disconnectInstance, deleteInstance, restartInstance } = ctx;

  return (
    <>
      <Card className="hidden sm:block">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              Status da Conexão
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(instance.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {instance.status === 'connected' && instance.profile_picture_url && (
            <div className="flex justify-center">
              <img 
                src={instance.profile_picture_url} 
                alt="Perfil" 
                className="h-20 w-20 rounded-full border-2 border-primary/20"
              />
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Identificador:</span>
                <span className="font-medium">{instance.instance_name}</span>
              </div>
              
              {instance.phone_number && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Número:
                  </span>
                  <span className="font-medium">+{instance.phone_number}</span>
                </div>
              )}
              
              {instance.profile_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Perfil:</span>
                  <span className="font-medium">{instance.profile_name}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Criado em:
                </span>
                <span className="font-medium">
                  {format(new Date(instance.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              {instance.last_connected_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Última conexão:</span>
                  <span className="font-medium">
                    {format(new Date(instance.last_connected_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {instance.status === 'connected' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-background rounded-lg border">
                <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="text-2xl font-bold">{contactsCount}</div>
                <div className="text-xs text-muted-foreground">Contatos</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-2xl font-bold">{messagesCount}</div>
                <div className="text-xs text-muted-foreground">Mensagens</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <Pause className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <div className="text-2xl font-bold">{pausedSessionsCount}</div>
                <div className="text-xs text-muted-foreground">Pausadas</div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {instance.status !== 'connected' && !isUazapiInstance && (
              <Button onClick={() => handleConnect()} disabled={actionLoading === 'connect'}>
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

            <Button variant="outline" onClick={handleCheckStatus} disabled={!!actionLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>

            {isUazapiInstance && instance.status === 'connected' && (
              <Button 
                variant="outline" 
                onClick={checkAndFixUazapiWebhook} 
                disabled={actionLoading === 'webhook'}
                className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
              >
                {actionLoading === 'webhook' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Verificar Webhook
              </Button>
            )}

            {instance.status === 'connected' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={restartInstance}
                  disabled={actionLoading === 'restart'}
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                >
                  {actionLoading === 'restart' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Reiniciar
                </Button>
                <Button variant="outline" onClick={disconnectInstance} disabled={actionLoading === 'disconnect'}>
                  {actionLoading === 'disconnect' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PowerOff className="h-4 w-4 mr-2" />
                  )}
                  Desconectar
                </Button>
              </>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" disabled={!!actionLoading} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover conexão
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover a conexão do WhatsApp?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá remover a conexão. Você precisará escanear o QR Code novamente.
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
    </>
  );
}
