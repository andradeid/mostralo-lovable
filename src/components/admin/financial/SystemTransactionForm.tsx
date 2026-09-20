import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinancialCategory } from '@/hooks/useFinancialCategories';
import { FinancialTransaction } from '@/hooks/useFinancialTransactions';
import { format } from 'date-fns';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Selecione uma categoria'),
  amount: z.string().min(1, 'Informe o valor'),
  description: z.string().min(1, 'Informe a descrição'),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  transaction_date: z.string().min(1, 'Informe a data'),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  is_recurring: z.boolean(),
  recurrence_type: z.enum(['monthly', 'yearly']).optional(),
});


export type SystemTransactionFormValues = z.infer<typeof transactionSchema>;

interface SystemTransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SystemTransactionFormValues) => void;
  transaction?: FinancialTransaction | null;
  categories: FinancialCategory[];
  isLoading?: boolean;
}

export function SystemTransactionForm({
  open,
  onClose,
  onSubmit,
  transaction,
  categories,
  isLoading,
}: SystemTransactionFormProps) {
  const form = useForm<SystemTransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      category_id: '',
      amount: '',
      description: '',
      vendor: '',
      notes: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: '',
      reference_number: '',
      is_recurring: false,
      recurrence_type: 'monthly',
    },
  });

  const selectedType = form.watch('type');
  const isRecurring = form.watch('is_recurring');
  const filteredCategories = categories.filter(c => c.type === selectedType);

  useEffect(() => {
    if (transaction) {
      // Para transações do sistema, o vendor pode estar em notes ou em um campo separado
      // Aqui assumimos que o backend retorna vendor (não existe no tipo antigo, então checamos any)
      const txAny = transaction as any;
      form.reset({
        type: transaction.type,
        category_id: transaction.category_id,
        amount: String(transaction.amount),
        description: transaction.description,
        vendor: txAny.vendor || '',
        notes: transaction.notes || '',
        transaction_date: transaction.transaction_date,
        payment_method: transaction.payment_method || '',
        reference_number: transaction.reference_number || '',
        is_recurring: !!transaction.is_recurring,
        recurrence_type: (transaction.recurrence_type as 'monthly' | 'yearly') || 'monthly',
      });
    } else {
      form.reset({
        type: 'expense',
        category_id: '',
        amount: '',
        description: '',
        vendor: '',
        notes: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: '',
        reference_number: '',
        is_recurring: false,
        recurrence_type: 'monthly',
      });
    }
  }, [transaction, form, open]);

  // Reset categoria quando tipo muda
  useEffect(() => {
    if (!transaction) {
      form.setValue('category_id', '');
    }
  }, [selectedType, form, transaction]);


  const handleSubmit = (values: SystemTransactionFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Setup cliente XYZ, Mensalidade VPS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Hetzner, Supabase, Cloudflare" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="bank_transfer">Transferência</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Referência (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="NF, Invoice, ID interno, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais..." 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recorrência — útil principalmente para despesas fixas (VPS, ferramentas) */}
            <div className="rounded-md border p-3 space-y-3">
              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 space-y-0">
                    <div>
                      <FormLabel>Recorrente</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Marque se esse lançamento se repete todo período.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Lançamento recorrente"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <FormField
                  control={form.control}
                  name="recurrence_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periodicidade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'monthly'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>


            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : transaction ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
