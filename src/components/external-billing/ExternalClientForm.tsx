import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { useExternalClients, type ExternalClient } from "@/hooks/useExternalClients";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Lista de estados brasileiros
const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

// Funções de formatação
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 14);
  return numbers
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, "$1-$2");
};

// Validadores
const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(numbers[10]);
};

const validateCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, "");
  if (numbers.length !== 14) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(numbers[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return digit === parseInt(numbers[13]);
};

// Schema de validação - campos obrigatórios para emissão de boleto
const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().optional(),
  person_type: z.enum(["PF", "PJ"]),
  document: z.string().min(1, "Documento é obrigatório para emissão de boleto"),
  address_zipcode: z.string().min(8, "CEP é obrigatório (8 dígitos)"),
  address_street: z.string().min(1, "Logradouro é obrigatório"),
  address_number: z.string().min(1, "Número é obrigatório"),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().min(1, "Bairro é obrigatório"),
  address_city: z.string().min(1, "Cidade é obrigatória"),
  address_state: z.string().min(2, "Estado é obrigatório"),
  notes: z.string().optional(),
  is_active: z.boolean(),
});

type ClientFormData = z.infer<typeof formSchema>;

interface ExternalClientFormProps {
  client: ExternalClient | null;
  onClose: () => void;
}

export function ExternalClientForm({ client, onClose }: ExternalClientFormProps) {
  const { createClient, updateClient } = useExternalClients();
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      person_type: client?.person_type || "PF",
      document: client?.document || "",
      address_zipcode: client?.address_zipcode || "",
      address_street: client?.address_street || "",
      address_number: client?.address_number || "",
      address_complement: client?.address_complement || "",
      address_neighborhood: client?.address_neighborhood || "",
      address_city: client?.address_city || "",
      address_state: client?.address_state || "",
      notes: client?.notes || "",
      is_active: client?.is_active ?? true,
    },
  });

  const personType = form.watch("person_type");
  const addressZipcode = form.watch("address_zipcode");
  const isSubmitting = createClient.isPending || updateClient.isPending;

  // Busca automática de CEP quando completar 8 dígitos
  useEffect(() => {
    const cepNumbers = addressZipcode?.replace(/\D/g, "") || "";
    if (cepNumbers.length === 8 && !isSearchingCep) {
      searchCep();
    }
  }, [addressZipcode]);

  // Buscar endereço pelo CEP via Edge Function
  const searchCep = async () => {
    const cep = form.getValues("address_zipcode")?.replace(/\D/g, "");
    if (!cep || cep.length !== 8) {
      toast.error("Digite um CEP válido com 8 dígitos");
      return;
    }

    setIsSearchingCep(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-cep", {
        body: { cep },
      });

      if (error) {
        toast.error("Erro ao buscar CEP");
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      form.setValue("address_street", data.logradouro || "");
      form.setValue("address_neighborhood", data.bairro || "");
      form.setValue("address_city", data.cidade || "");
      form.setValue("address_state", data.estado || "");
      toast.success("Endereço encontrado!");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    // Validar documento conforme tipo de pessoa
    const docNumbers = data.document.replace(/\D/g, "");
    if (data.person_type === "PF") {
      if (!validateCPF(data.document)) {
        toast.error("CPF inválido. Verifique os dígitos.");
        return;
      }
    } else {
      if (!validateCNPJ(data.document)) {
        toast.error("CNPJ inválido. Verifique os dígitos.");
        return;
      }
    }

    // Montar endereço completo para compatibilidade
    const addressParts = [
      data.address_street,
      data.address_number,
      data.address_complement,
      data.address_neighborhood,
      data.address_city,
      data.address_state,
      data.address_zipcode,
    ].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    const submitData = {
      ...data,
      address: fullAddress || undefined,
      email: data.email || undefined,
      address_zipcode: data.address_zipcode?.replace(/\D/g, "") || undefined,
    };

    if (client) {
      await updateClient.mutateAsync({
        id: client.id,
        ...submitData,
      });
    } else {
      await createClient.mutateAsync(submitData);
    }
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Tipo de Pessoa */}
        <FormField
          control={form.control}
          name="person_type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Pessoa *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PF" id="pf" />
                    <Label htmlFor="pf">Pessoa Física</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PJ" id="pj" />
                    <Label htmlFor="pj">Pessoa Jurídica</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nome */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{personType === "PF" ? "Nome Completo *" : "Razão Social *"}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={personType === "PF" ? "Nome completo" : "Razão social da empresa"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CPF/CNPJ e Email */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="document"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{personType === "PF" ? "CPF *" : "CNPJ *"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={personType === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                    value={field.value}
                    onChange={(e) => {
                      const formatted = personType === "PF" 
                        ? formatCPF(e.target.value) 
                        : formatCNPJ(e.target.value);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {personType === "PF" ? "11 dígitos" : "14 dígitos"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Telefone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(00) 00000-0000"
                  value={field.value}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seção de Endereço */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h4 className="font-medium text-sm">Endereço (obrigatório para boleto)</h4>

          {/* CEP com busca */}
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="address_zipcode"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>CEP *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000-000"
                      value={field.value}
                      onChange={(e) => field.onChange(formatCEP(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              className="mt-8"
              onClick={searchCep}
              disabled={isSearchingCep}
            >
              {isSearchingCep ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Logradouro e Número */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="address_street"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Logradouro *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Avenida, etc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número *</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Complemento e Bairro */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address_complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto, Sala, etc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro *</FormLabel>
                  <FormControl>
                    <Input placeholder="Bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade *</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Observações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o cliente..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Ativo (apenas para edição) */}
        {client && (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Cliente Ativo</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Botões */}
        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {client ? "Salvar" : "Criar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
