import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ClinicalNoteFormData } from "@/hooks/dental/useClinicalNotes";

const noteFormSchema = z.object({
  note_type: z.string().min(1, "Selecione o tipo da nota"),
  content: z.string().min(1, "O conteúdo é obrigatório"),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

interface ClinicalNoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  storeId: string;
  onSubmit: (data: ClinicalNoteFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function ClinicalNoteFormDialog({ 
  open, 
  onOpenChange, 
  patientId,
  storeId,
  onSubmit, 
  isSubmitting 
}: ClinicalNoteFormDialogProps) {
  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      note_type: "evolution",
      content: "",
    },
  });

  const handleSubmit = async (data: NoteFormData) => {
    await onSubmit({
      patient_id: patientId,
      store_id: storeId,
      note_type: data.note_type,
      content: data.content,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Nota Clínica</DialogTitle>
          <DialogDescription>
            Registre uma nova evolução ou observação do paciente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="note_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo da Nota *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="evolution">Evolução</SelectItem>
                      <SelectItem value="observation">Observação</SelectItem>
                      <SelectItem value="procedure">Procedimento</SelectItem>
                      <SelectItem value="prescription">Prescrição</SelectItem>
                      <SelectItem value="initial_exam">Exame Inicial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a evolução, procedimento realizado, observações..." 
                      className="min-h-[150px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Nota
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
