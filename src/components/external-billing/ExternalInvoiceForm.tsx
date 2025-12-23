import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon, Plus, MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useExternalClients } from "@/hooks/useExternalClients";
import { useExternalServices } from "@/hooks/useExternalServices";
import { useExternalInvoices } from "@/hooks/useExternalInvoices";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalClientForm } from "./ExternalClientForm";
import { ExternalServiceForm } from "./ExternalServiceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const invoiceFormSchema = z.object({
  client_id: z.string().min(1, "Selecione um cliente"),
  service_id: z.string().optional(),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  due_date: z.date(),
  is_recurring: z.boolean(),
  recurrence_type: z.enum(["once", "monthly", "quarterly", "yearly"]).optional(),
  recurrence_count: z.number().nullable().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface ExternalInvoiceFormProps {
  onClose: () => void;
  invoice?: ExternalInvoice; // Fatura para edição
}

// Import ExternalInvoice type
import { ExternalInvoice } from "@/hooks/useExternalInvoices";

export function ExternalInvoiceForm({ onClose, invoice }: ExternalInvoiceFormProps) {
  const { clients } = useExternalClients();
  const { services } = useExternalServices();
  const { createInvoice, updateInvoice } = useExternalInvoices();
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  
  // WhatsApp states
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [masterWhatsAppStatus, setMasterWhatsAppStatus] = useState<string | null>(null);

  const isEditing = !!invoice;

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client_id: invoice?.client_id || "",
      service_id: invoice?.service_id || "",
      description: invoice?.description || "",
      amount: invoice?.amount || 0,
      due_date: invoice?.due_date ? new Date(invoice.due_date) : new Date(),
      is_recurring: invoice?.is_recurring || false,
      recurrence_type: (invoice?.recurrence_type as "once" | "monthly" | "quarterly" | "yearly") || "monthly",
      recurrence_count: invoice?.recurrence_count || null,
      notes: invoice?.notes || "",
    },
  });

  const isRecurring = form.watch("is_recurring");
  const selectedServiceId = form.watch("service_id");
  const selectedClientId = form.watch("client_id");
  const watchedDescription = form.watch("description");
  const watchedAmount = form.watch("amount");
  const watchedDueDate = form.watch("due_date");

  // Fetch WhatsApp Master status
  useEffect(() => {
    const fetchMasterStatus = async () => {
      const { data } = await supabase
        .from('master_whatsapp_config')
        .select('instance_status')
        .limit(1)
        .single();
      setMasterWhatsAppStatus(data?.instance_status || null);
    };
    fetchMasterStatus();
  }, []);

  // Auto-fill phone when client is selected
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client?.phone) {
        // Format phone for display
        const phone = client.phone.replace(/\D/g, '');
        if (phone.length === 11) {
          setWhatsappPhone(`(${phone.slice(0,2)}) ${phone.slice(2,7)}-${phone.slice(7)}`);
        } else if (phone.length === 10) {
          setWhatsappPhone(`(${phone.slice(0,2)}) ${phone.slice(2,6)}-${phone.slice(6)}`);
        } else {
          setWhatsappPhone(client.phone);
        }
      } else {
        setWhatsappPhone("");
      }
    }
  }, [selectedClientId, clients]);

  // Auto-fill description and amount when service is selected
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find((s) => s.id === selectedServiceId);
      if (service) {
        form.setValue("description", service.name);
        form.setValue("amount", service.default_price);
      }
    }
  }, [selectedServiceId, services, form]);

  const isSubmitting = createInvoice.isPending || updateInvoice.isPending || sendingWhatsApp;

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      if (isEditing && invoice) {
        // Modo edição
        await updateInvoice.mutateAsync({
          id: invoice.id,
          description: data.description,
          amount: data.amount,
          due_date: format(data.due_date, "yyyy-MM-dd"),
          notes: data.notes,
        });
        toast.success('Fatura atualizada com sucesso!');
        onClose();
        return;
      }

      // Modo criação
      const createdInvoice = await createInvoice.mutateAsync({
        client_id: data.client_id,
        service_id: data.service_id || undefined,
        description: data.description,
        amount: data.amount,
        due_date: format(data.due_date, "yyyy-MM-dd"),
        is_recurring: data.is_recurring,
        recurrence_type: data.is_recurring ? data.recurrence_type : undefined,
        recurrence_count: data.is_recurring && data.recurrence_count ? data.recurrence_count : null,
        notes: data.notes,
      });

      // Send WhatsApp if enabled
      if (sendWhatsApp && whatsappPhone && createdInvoice?.id) {
        setSendingWhatsApp(true);
        try {
          const normalizedPhone = whatsappPhone.replace(/\D/g, '');
          const { error } = await supabase.functions.invoke('send-external-invoice-whatsapp', {
            body: {
              invoice_id: createdInvoice.id,
              phone_number: normalizedPhone
            }
          });
          
          if (error) {
            console.error('WhatsApp error:', error);
            toast.error('Fatura criada, mas erro ao enviar WhatsApp');
          } else {
            toast.success('📱 Link de pagamento enviado por WhatsApp!');
          }
        } catch (err) {
          console.error('WhatsApp send error:', err);
          toast.error('Fatura criada, mas erro ao enviar WhatsApp');
        } finally {
          setSendingWhatsApp(false);
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const activeClients = clients.filter((c) => c.is_active);
  const activeServices = services.filter((s) => s.is_active);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Client */}
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <div className="flex gap-2">
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsClientFormOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">Cliente não pode ser alterado</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Service */}
          <FormField
            control={form.control}
            name="service_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serviço (opcional)</FormLabel>
                <div className="flex gap-2">
                  <Select 
                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)} 
                    value={field.value || "none"}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {activeServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - R$ {service.default_price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsServiceFormOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">Serviço não pode ser alterado</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição do serviço/produto..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vencimento *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Recurring Toggle - apenas para novas faturas */}
          {!isEditing && (
            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Fatura Recorrente</FormLabel>
                    <FormDescription className="text-xs">
                      Gerar faturas automaticamente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          {/* Recurrence Options - apenas para novas faturas */}
          {!isEditing && isRecurring && (
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border bg-muted/50">
              <FormField
                control={form.control}
                name="recurrence_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrence_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repetições</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="∞ Infinito"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : null);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Deixe vazio para repetir para sempre
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações internas..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* WhatsApp Section - apenas para novas faturas */}
          {!isEditing && (
            <Card className={cn(
              "border-2 transition-all",
              sendWhatsApp 
                ? "border-green-500 bg-green-500/5" 
                : "border-dashed border-muted-foreground/30"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="h-5 w-5 accent-green-500 rounded"
                    disabled={masterWhatsAppStatus !== 'connected'}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      Enviar Link por WhatsApp
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Enviar link de pagamento automaticamente via WhatsApp Master
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={masterWhatsAppStatus === 'connected' ? 'default' : 'secondary'}
                    className={cn(
                      masterWhatsAppStatus === 'connected' 
                        ? "bg-green-500 hover:bg-green-600" 
                        : "bg-muted"
                    )}
                  >
                    {masterWhatsAppStatus === 'connected' ? '✅ Conectado' : '❌ Desconectado'}
                  </Badge>
                </div>
              </CardHeader>

              {sendWhatsApp && masterWhatsAppStatus === 'connected' && (
                <CardContent className="space-y-4">
                  {/* Phone input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Número do WhatsApp *
                    </label>
                    <Input
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Preenchido automaticamente com o telefone do cliente
                    </p>
                  </div>

                  {/* Message preview */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">📝 Preview da mensagem:</label>
                    <div className="p-3 rounded-lg bg-muted/50 border text-sm whitespace-pre-line">
                      {`Olá${selectedClientId ? ` ${clients.find(c => c.id === selectedClientId)?.name?.split(' ')[0] || ''}` : ''}! 👋

Sua fatura está disponível:

👤 Cliente: ${clients.find(c => c.id === selectedClientId)?.name || '[Nome do Cliente]'}
📋 Serviço: ${watchedDescription || '[Descrição]'}
💰 Valor: ${watchedAmount ? watchedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
📅 Vencimento: ${watchedDueDate ? format(watchedDueDate, 'dd/MM/yyyy', { locale: ptBR }) : '[Data]'}

💳 Pague agora pelo link:
[Link será gerado automaticamente]

O QR Code PIX será gerado automaticamente! 🚀`}
                    </div>
                  </div>

                  {/* Info */}
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    📱 Após criar a fatura, o link será enviado automaticamente
                  </p>
                </CardContent>
              )}
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Fatura'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Client Form Dialog */}
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>Cadastre um novo cliente</DialogDescription>
          </DialogHeader>
          <ExternalClientForm client={null} onClose={() => setIsClientFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Service Form Dialog */}
      <Dialog open={isServiceFormOpen} onOpenChange={setIsServiceFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
            <DialogDescription>Cadastre um novo serviço</DialogDescription>
          </DialogHeader>
          <ExternalServiceForm service={null} onClose={() => setIsServiceFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
