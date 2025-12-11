import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Send,
  Search,
  TestTube,
  MessageSquare,
  Calendar,
  Phone,
  History,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Template {
  id: string;
  name: string;
  content: string;
  message_type: string;
  media_url?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
}

interface MessageLog {
  id: string;
  phone_number: string;
  content: string;
  status: string;
  error_message?: string;
  sent_at?: string;
  failed_at?: string;
  created_at: string;
  customer?: { name: string } | null;
  template?: { name: string } | null;
}


export default function WhatsAppInstancePage() {
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [instance, setInstance] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [storeSlug, setStoreSlug] = useState<string>('');

  // Estados para teste de conexão
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Estados para envio de mensagem de teste
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sendTestLoading, setSendTestLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Estados para histórico de mensagens avulsas
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchInstance();
      fetchTemplates();
      fetchStoreInfo();
      fetchMessageLogs();
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId && showAllLogs) {
      fetchMessageLogs();
    }
  }, [showAllLogs]);

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

  const fetchStoreInfo = async () => {
    try {
      const { data } = await supabase
        .from('stores')
        .select('name, slug')
        .eq('id', storeId)
        .single();
      
      if (data) {
        setStoreName(data.name);
        setStoreSlug(data.slug);
      }
    } catch (error) {
      console.error('Erro ao buscar informações da loja:', error);
    }
  };

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

  const fetchTemplates = async () => {
    try {
      const { data } = await supabase
        .from('whatsapp_templates' as any)
        .select('id, name, content, message_type, media_url')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');

      if (data) {
        setTemplates(data as unknown as Template[]);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const fetchMessageLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from('whatsapp_messages' as any)
        .select(`
          id, phone_number, content, status, error_message,
          sent_at, failed_at, created_at,
          customer:customers(name),
          template:whatsapp_templates(name)
        `)
        .eq('store_id', storeId)
        .is('campaign_id', null)
        .order('created_at', { ascending: false })
        .limit(showAllLogs ? 50 : 10);

      if (data) {
        setMessageLogs(data as unknown as MessageLog[]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de mensagens:', error);
    } finally {
      setLogsLoading(false);
    }
  };


  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('customer_stores')
        .select(`
          customer_id,
          total_orders,
          total_spent,
          last_order_at,
          customers!inner(id, name, phone)
        `)
        .eq('store_id', storeId)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`, { referencedTable: 'customers' })
        .limit(10);

      if (data) {
        const formattedCustomers: Customer[] = data.map((item: any) => ({
          id: item.customers.id,
          name: item.customers.name,
          phone: item.customers.phone,
          total_orders: item.total_orders || 0,
          total_spent: item.total_spent || 0,
          last_order_at: item.last_order_at,
        }));
        setCustomers(formattedCustomers);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setSearchLoading(false);
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

  const testConnection = async () => {
    if (!testPhone) {
      toast({
        title: "Número obrigatório",
        description: "Digite um número para testar a conexão",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await supabase.functions.invoke('whatsapp-send', {
        body: {
          storeId,
          phoneNumber: testPhone,
          messageType: 'text',
          content: `✅ Teste de conexão do Mostralo!\n\nSua conexão WhatsApp está funcionando corretamente.\n\n🕐 ${new Date().toLocaleString('pt-BR')}`,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        setTestResult({ success: true, message: 'Conexão funcionando! Mensagem enviada com sucesso.' });
        toast({
          title: "Teste bem-sucedido!",
          description: "Mensagem de teste enviada com sucesso",
        });
      } else {
        throw new Error(response.data?.error || 'Falha no envio');
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Erro ao enviar mensagem de teste' });
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao enviar mensagem de teste",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const calculateDaysInactive = (lastOrderAt: string | null): string => {
    if (!lastOrderAt) return '—';
    const lastOrder = new Date(lastOrderAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  };

  const renderMessagePreview = (content: string, customer: Customer): string => {
    const storeLink = `${window.location.origin}/loja/${storeSlug}`;
    
    return content
      .replace(/{nome}/g, customer.name)
      .replace(/{primeiro_nome}/g, customer.name?.split(' ')[0] || '')
      .replace(/{telefone}/g, customer.phone)
      .replace(/{total_pedidos}/g, customer.total_orders?.toString() || '0')
      .replace(/{total_gasto}/g, `R$ ${customer.total_spent?.toFixed(2) || '0,00'}`)
      .replace(/{dias_inativo}/g, calculateDaysInactive(customer.last_order_at))
      .replace(/{ultimo_pedido}/g, customer.last_order_at ? format(new Date(customer.last_order_at), "dd/MM/yyyy", { locale: ptBR }) : '—')
      .replace(/{loja}/g, storeName)
      .replace(/{link_loja}/g, storeLink);
  };

  const sendTestMessage = async () => {
    if (!selectedCustomer || !selectedTemplateId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um cliente e um template",
        variant: "destructive",
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setSendTestLoading(true);

    try {
      const messageContent = renderMessagePreview(template.content, selectedCustomer);

      const response = await supabase.functions.invoke('whatsapp-send', {
        body: {
          storeId,
          phoneNumber: selectedCustomer.phone,
          messageType: template.message_type,
          content: messageContent,
          mediaUrl: template.media_url,
          customerId: selectedCustomer.id,
          templateId: template.id,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        toast({
          title: "Mensagem enviada!",
          description: `Mensagem enviada com sucesso para ${selectedCustomer.name}`,
        });
        // Reset
        setSelectedCustomer(null);
        setSelectedTemplateId('');
        setCustomerSearch('');
        setCustomers([]);
      } else {
        throw new Error(response.data?.error || 'Falha no envio');
      }
    } catch (error: any) {
      toast({
        title: "Erro no envio",
        description: error.message || "Falha ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setSendTestLoading(false);
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

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

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
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card de Status */}
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
                {/* Informações detalhadas da instância */}
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  {instance.status === 'connected' && instance.profile_picture_url && (
                    <div className="flex justify-center">
                      <img 
                        src={instance.profile_picture_url} 
                        alt="Perfil" 
                        className="h-20 w-20 rounded-full"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Instância:</span>
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
                        <span className="text-muted-foreground">Nome do Perfil:</span>
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
                          {format(new Date(instance.last_connected_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

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

            {/* Card de Instruções de Gerenciamento */}
            <Card className="bg-muted/30 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Instruções de Gerenciamento
                </CardTitle>
                <CardDescription>
                  Saiba como trocar de número e a diferença entre as ações disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="trocar-numero">
                    <AccordionTrigger className="text-sm font-medium">
                      📱 Como trocar de número WhatsApp?
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                          Siga estes passos simples para conectar um novo número:
                        </p>
                        <ol className="space-y-2 ml-4">
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                            <span>Clique em <strong>"Desconectar"</strong> para desvincular o número atual</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                            <span>Clique em <strong>"Gerar QR Code"</strong> para obter um novo código</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                            <span>Abra o WhatsApp no celular com o <strong>novo número</strong> e escaneie o QR Code</span>
                          </li>
                        </ol>
                        <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2 rounded">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>⏱️ Tempo estimado: ~1 minuto</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="diferenca-acoes">
                    <AccordionTrigger className="text-sm font-medium">
                      ⚡ Diferença: Desconectar vs Remover
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 text-sm">
                        <div className="grid gap-3">
                          {/* Desconectar */}
                          <div className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <PowerOff className="h-4 w-4 text-orange-500" />
                              <span className="font-semibold">Desconectar</span>
                              <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              Apenas desvincula o número atual
                            </p>
                            <ul className="space-y-1 text-xs">
                              <li className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Configurações preservadas
                              </li>
                              <li className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Contatos mantidos
                              </li>
                              <li className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Reconexão rápida (~1 min)
                              </li>
                            </ul>
                          </div>

                          {/* Remover */}
                          <div className="border border-destructive/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="font-semibold">Remover</span>
                              <Badge variant="destructive" className="text-xs">Permanente</Badge>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              Remove a instância completamente
                            </p>
                            <ul className="space-y-1 text-xs">
                              <li className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-destructive" />
                                Configurações perdidas
                              </li>
                              <li className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-orange-500" />
                                Contatos ficam órfãos
                              </li>
                              <li className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-destructive" />
                                Nova config (~2 min)
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="avisos" className="border-b-0">
                    <AccordionTrigger className="text-sm font-medium">
                      ⚠️ Avisos importantes
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2 p-2 bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded text-xs">
                          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>Verifique <strong>campanhas ativas</strong></span>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded text-xs">
                          <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                          <span><strong>Contatos</strong> permanecem salvos</span>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded text-xs">
                          <RefreshCw className="h-3 w-3 shrink-0 mt-0.5" />
                          <span><strong>Automações</strong> continuam funcionando</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* QR Code - Largura total abaixo do grid */}
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

          {/* Seção de Teste de Conexão - Só aparece se conectado */}
          {instance.status === 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Teste Rápido de Conexão
                </CardTitle>
                <CardDescription>
                  Envie uma mensagem de teste para verificar se a conexão está funcionando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label htmlFor="testPhone">Número para teste (com DDD)</Label>
                    <Input
                      id="testPhone"
                      placeholder="11999999999"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={testConnection} 
                      disabled={testLoading || !testPhone}
                    >
                      {testLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Testar Conexão
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    testResult.success 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Seção de Envio de Mensagem com Template - Só aparece se conectado */}
          {instance.status === 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Enviar Mensagem de Teste
                </CardTitle>
                <CardDescription>
                  Selecione um cliente e um template para enviar uma mensagem de teste
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Busca de Cliente */}
                <div className="space-y-2">
                  <Label>Buscar Cliente</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite o nome ou telefone do cliente..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        searchCustomers(e.target.value);
                      }}
                      className="pl-10"
                    />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                    )}
                  </div>

                  {/* Resultados da busca */}
                  {customers.length > 0 && !selectedCustomer && (
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch(customer.name);
                            setCustomers([]);
                          }}
                          className="w-full p-3 text-left hover:bg-muted transition-colors"
                        >
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phone} • {customer.total_orders} pedidos
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Cliente selecionado */}
                  {selectedCustomer && (
                    <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.phone} • {selectedCustomer.total_orders} pedidos • 
                          R$ {selectedCustomer.total_spent?.toFixed(2) || '0,00'} gasto
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerSearch('');
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Seleção de Template */}
                <div className="space-y-2">
                  <Label>Template de Mensagem</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum template configurado
                        </div>
                      ) : (
                        templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview da Mensagem */}
                {selectedTemplate && selectedCustomer && (
                  <div className="space-y-2">
                    <Label>Preview da Mensagem</Label>
                    <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                      {renderMessagePreview(selectedTemplate.content, selectedCustomer)}
                    </div>
                  </div>
                )}

                {/* Botão de Envio */}
                <Button 
                  onClick={sendTestMessage} 
                  disabled={sendTestLoading || !selectedCustomer || !selectedTemplateId}
                  className="w-full"
                >
                  {sendTestLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensagem de Teste
                    </>
                  )}
                </Button>

                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Configure templates de mensagem na seção de Campanhas para poder enviar mensagens de teste.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Histórico de Mensagens de Teste */}
          {instance?.status === 'connected' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Histórico de Testes
                  </CardTitle>
                  <CardDescription>
                    Últimas mensagens enviadas fora de campanhas
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMessageLogs} disabled={logsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${logsLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {logsLoading && messageLogs.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messageLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma mensagem de teste enviada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messageLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-4 rounded-lg border ${
                          log.status === 'failed' 
                            ? 'bg-destructive/10 border-destructive/20' 
                            : 'bg-green-500/10 border-green-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            {log.status === 'failed' ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" /> Falhou
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500 gap-1">
                                <CheckCircle className="h-3 w-3" /> Enviada
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.sent_at || log.failed_at || log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <span className="font-mono text-xs">{log.phone_number}</span>
                          </div>
                        </div>
                        
                        {(log.customer?.name || log.template?.name) && (
                          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                            {log.customer?.name && <span>👤 {log.customer.name}</span>}
                            {log.template?.name && <span>• 📄 {log.template.name}</span>}
                          </div>
                        )}
                        
                        <p className="text-sm line-clamp-2 text-muted-foreground">
                          {log.status === 'failed' && log.error_message 
                            ? <span className="text-destructive">Erro: {log.error_message}</span>
                            : log.content}
                        </p>
                      </div>
                    ))}
                    
                    {!showAllLogs && messageLogs.length >= 10 && (
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => setShowAllLogs(true)}
                      >
                        Ver mais mensagens
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
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
            <li>Vá em Configurações {'>'} Aparelhos Conectados {'>'} Conectar um Aparelho</li>
            <li>Escaneie o QR Code exibido na tela</li>
            <li>Aguarde a conexão ser estabelecida</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
