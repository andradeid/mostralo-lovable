import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { PatientRecord, usePatientRecord } from "@/hooks/dental/usePatientRecord";

const recordFormSchema = z.object({
  blood_type: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  allergies: z.string().optional(),
  allergy_latex: z.boolean().default(false),
  allergy_anesthesia: z.boolean().default(false),
  allergy_penicillin: z.boolean().default(false),
  current_medications: z.string().optional(),
  medical_conditions: z.string().optional(),
  previous_surgeries: z.string().optional(),
  is_pregnant: z.boolean().default(false),
  is_breastfeeding: z.boolean().default(false),
  has_pacemaker: z.boolean().default(false),
  has_heart_condition: z.boolean().default(false),
  has_diabetes: z.boolean().default(false),
  has_hypertension: z.boolean().default(false),
  has_bleeding_disorder: z.boolean().default(false),
  has_hepatitis: z.boolean().default(false),
  has_hiv: z.boolean().default(false),
  is_smoker: z.boolean().default(false),
  smoking_frequency: z.string().optional(),
  alcohol_consumption: z.string().optional(),
  bruxism: z.boolean().default(false),
  clinical_observations: z.string().optional(),
});

type RecordFormData = z.infer<typeof recordFormSchema>;

interface PatientRecordFormProps {
  patientId: string;
  record: PatientRecord | null | undefined;
}

export function PatientRecordForm({ patientId, record }: PatientRecordFormProps) {
  const { upsertRecord } = usePatientRecord(patientId);

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      blood_type: "",
      weight: "",
      height: "",
      allergies: "",
      allergy_latex: false,
      allergy_anesthesia: false,
      allergy_penicillin: false,
      current_medications: "",
      medical_conditions: "",
      previous_surgeries: "",
      is_pregnant: false,
      is_breastfeeding: false,
      has_pacemaker: false,
      has_heart_condition: false,
      has_diabetes: false,
      has_hypertension: false,
      has_bleeding_disorder: false,
      has_hepatitis: false,
      has_hiv: false,
      is_smoker: false,
      smoking_frequency: "",
      alcohol_consumption: "",
      bruxism: false,
      clinical_observations: "",
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        blood_type: record.blood_type ?? "",
        weight: record.weight?.toString() ?? "",
        height: record.height?.toString() ?? "",
        allergies: record.allergies ?? "",
        allergy_latex: record.allergy_latex,
        allergy_anesthesia: record.allergy_anesthesia,
        allergy_penicillin: record.allergy_penicillin,
        current_medications: record.current_medications ?? "",
        medical_conditions: record.medical_conditions ?? "",
        previous_surgeries: record.previous_surgeries ?? "",
        is_pregnant: record.is_pregnant,
        is_breastfeeding: record.is_breastfeeding,
        has_pacemaker: record.has_pacemaker,
        has_heart_condition: record.has_heart_condition,
        has_diabetes: record.has_diabetes,
        has_hypertension: record.has_hypertension,
        has_bleeding_disorder: record.has_bleeding_disorder,
        has_hepatitis: record.has_hepatitis,
        has_hiv: record.has_hiv,
        is_smoker: record.is_smoker,
        smoking_frequency: record.smoking_frequency ?? "",
        alcohol_consumption: record.alcohol_consumption ?? "",
        bruxism: record.bruxism,
        clinical_observations: record.clinical_observations ?? "",
      });
    }
  }, [record, form]);

  const onSubmit = async (data: RecordFormData) => {
    await upsertRecord.mutateAsync({
      patient_id: patientId,
      blood_type: data.blood_type || null,
      weight: data.weight ? parseFloat(data.weight) : null,
      height: data.height ? parseFloat(data.height) : null,
      allergies: data.allergies || null,
      allergy_latex: data.allergy_latex,
      allergy_anesthesia: data.allergy_anesthesia,
      allergy_penicillin: data.allergy_penicillin,
      current_medications: data.current_medications || null,
      medical_conditions: data.medical_conditions || null,
      previous_surgeries: data.previous_surgeries || null,
      is_pregnant: data.is_pregnant,
      is_breastfeeding: data.is_breastfeeding,
      has_pacemaker: data.has_pacemaker,
      has_heart_condition: data.has_heart_condition,
      has_diabetes: data.has_diabetes,
      has_hypertension: data.has_hypertension,
      has_bleeding_disorder: data.has_bleeding_disorder,
      has_hepatitis: data.has_hepatitis,
      has_hiv: data.has_hiv,
      is_smoker: data.is_smoker,
      smoking_frequency: data.smoking_frequency || null,
      alcohol_consumption: data.alcohol_consumption || null,
      bruxism: data.bruxism,
      clinical_observations: data.clinical_observations || null,
      last_updated_by: null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="blood_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Sanguíneo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="70.5" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura (m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1.75" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alergias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alergias</CardTitle>
            <CardDescription>Marque as alergias conhecidas do paciente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="allergy_latex"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Látex</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allergy_anesthesia"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Anestésico</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allergy_penicillin"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Penicilina</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outras Alergias</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva outras alergias conhecidas..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Condições Médicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Condições Médicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="has_diabetes"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Diabetes</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="has_hypertension"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Hipertensão</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="has_heart_condition"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Cardiopatia</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="has_pacemaker"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Marcapasso</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="has_bleeding_disorder"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Dist. Sangramento</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="has_hepatitis"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Hepatite</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="has_hiv"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">HIV</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_pregnant"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Gestante</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_breastfeeding"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Lactante</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="medical_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outras Condições</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva outras condições médicas..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current_medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicamentos em Uso</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Liste os medicamentos que o paciente usa regularmente..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previous_surgeries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cirurgias Anteriores</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Cirurgias realizadas anteriormente..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Hábitos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hábitos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="is_smoker"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Fumante</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bruxism"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">Bruxismo</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smoking_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência de Fumo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 10 cigarros/dia" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alcohol_consumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumo de Álcool</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Socialmente, Diariamente..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações Clínicas</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="clinical_observations"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações gerais sobre o estado de saúde do paciente..." 
                      className="min-h-[100px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={upsertRecord.isPending} className="gap-2">
            {upsertRecord.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Prontuário
          </Button>
        </div>
      </form>
    </Form>
  );
}
