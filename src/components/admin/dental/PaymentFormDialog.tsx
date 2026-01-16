import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, FileImage } from "lucide-react";
import { usePatientPayments, PAYMENT_METHODS } from "@/hooks/dental/useDentalPayments";
import { DentalQuote } from "@/hooks/dental/useDentalQuotes";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const paymentSchema = z.object({
  quote_id: z.string().min(1, "Selecione um orçamento"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  payment_date: z.string().min(1, "Data é obrigatória"),
  payment_method: z.string().min(1, "Selecione o método de pagamento"),
  installment_number: z.number().min(1).optional(),
  total_installments: z.number().min(1).optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  storeId: string;
  quotes: DentalQuote[];
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  patientId,
  storeId,
  quotes,
}: PaymentFormDialogProps) {
  const { createPayment } = usePatientPayments(patientId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      quote_id: "",
      amount: 0,
      payment_date: format(new Date(), "yyyy-MM-dd"),
      payment_method: "",
      installment_number: 1,
      total_installments: 1,
      reference_number: "",
      notes: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 5MB",
          variant: "destructive",
        });
        return;
      }
      setAttachmentFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setAttachmentPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const uploadAttachment = async (): Promise<string | null> => {
    if (!attachmentFile) return null;

    const fileExt = attachmentFile.name.split(".").pop();
    const fileName = `${patientId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("dental-payment-receipts")
      .upload(fileName, attachmentFile);

    if (error) {
      console.error("Erro ao fazer upload:", error);
      throw new Error("Falha ao enviar comprovante");
    }

    const { data } = supabase.storage
      .from("dental-payment-receipts")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const selectedQuoteId = form.watch("quote_id");
  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        attachmentUrl = await uploadAttachment();
      }

      await createPayment.mutateAsync({
        quote_id: data.quote_id,
        patient_id: patientId,
        store_id: storeId,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        installment_number: data.installment_number,
        total_installments: data.total_installments,
        reference_number: data.reference_number,
        notes: data.notes,
        attachment_url: attachmentUrl || undefined,
      });
      form.reset();
      setAttachmentFile(null);
      setAttachmentPreview(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Quote Selection */}
            <FormField
              control={form.control}
              name="quote_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orçamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o orçamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {quotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id}>
                          #{quote.quote_number} - R$ {Number(quote.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {selectedQuote && (
                    <p className="text-xs text-muted-foreground">
                      Total do orçamento: R$ {Number(selectedQuote.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Date */}
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Pagamento *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Installments */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="installment_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcela</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reference Number */}
            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Referência</FormLabel>
                  <FormControl>
                    <Input placeholder="Nº do comprovante, transação, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachment Upload */}
            <div className="space-y-2">
              <Label>Comprovante (opcional)</Label>
              {!attachmentFile ? (
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou PDF (máx. 5MB)</p>
                </div>
              ) : (
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-primary" />
                      <span className="text-sm truncate max-w-[200px]">{attachmentFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAttachmentFile(null);
                        setAttachmentPreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {attachmentPreview && (
                    <img
                      src={attachmentPreview}
                      alt="Preview"
                      className="w-full h-24 object-contain rounded"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Registrar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
