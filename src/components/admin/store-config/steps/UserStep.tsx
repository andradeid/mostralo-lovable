import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, CreditCard } from "lucide-react";

interface UserStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

export function UserStep({ formData, updateFormData }: UserStepProps) {
  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara do CPF
    return numbers
      .slice(0, 11) // Máximo 11 dígitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara do telefone
    return numbers
      .slice(0, 11) // Máximo 11 dígitos
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    updateFormData({ responsible_cpf: formatted });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    updateFormData({ responsible_phone: formatted });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Dados do Responsável
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responsible_name">Nome Completo *</Label>
            <Input
              id="responsible_name"
              value={formData.responsible_name}
              onChange={(e) => updateFormData({ responsible_name: e.target.value })}
              placeholder="Nome completo do responsável pela loja"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible_email" className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                E-mail *
              </Label>
              <Input
                id="responsible_email"
                type="email"
                value={formData.responsible_email}
                onChange={(e) => updateFormData({ responsible_email: e.target.value })}
                placeholder="email@exemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                E-mail usado para login e notificações
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_phone" className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Telefone/Celular
              </Label>
              <Input
                id="responsible_phone"
                value={formData.responsible_phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_cpf" className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              CPF
            </Label>
            <Input
              id="responsible_cpf"
              value={formData.responsible_cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            <p className="text-xs text-muted-foreground">
              CPF do responsável (usado para questões fiscais)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resumo das Informações */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo das Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Nome:</span>
                <p>{formData.responsible_name || 'Não informado'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">E-mail:</span>
                <p>{formData.responsible_email || 'Não informado'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Telefone:</span>
                <p>{formData.responsible_phone || 'Não informado'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">CPF:</span>
                <p>{formData.responsible_cpf || 'Não informado'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre Login */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Informações de Acesso:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• O e-mail será usado como login do usuário</li>
          <li>• Uma senha temporária será enviada por e-mail</li>
          <li>• O usuário deve alterar a senha no primeiro acesso</li>
          <li>• Todos os dados podem ser editados posteriormente</li>
        </ul>
      </div>
    </div>
  );
}