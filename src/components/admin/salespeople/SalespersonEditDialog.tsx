import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User, Building2, CreditCard, Trophy, Settings, Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalespersonEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesperson: any;
  onSuccess: () => void;
}

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

const STATUS_OPTIONS = [
  { value: "pending_approval", label: "Aguardando Aprovação" },
  { value: "pending_contract", label: "Aguardando Contrato" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "rejected", label: "Rejeitado" },
];

const QUALIFICATION_LEVELS = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
  { value: "expert", label: "Expert" },
  { value: "top_candidate", label: "Top Candidate" },
];

export function SalespersonEditDialog({ open, onOpenChange, salesperson, onSuccess }: SalespersonEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    cnpj: "",
    company_name: "",
    company_trade_name: "",
    pix_key: "",
    pix_key_type: "",
    qualification_score: 0,
    qualification_level: "beginner",
    status: "pending_approval",
    referral_code: "",
    profile_photo_url: "",
  });

  // Sync form data when salesperson changes or dialog opens
  useEffect(() => {
    if (open && salesperson) {
      setFormData({
        full_name: salesperson.full_name || "",
        email: salesperson.email || "",
        phone: salesperson.phone || "",
        cpf: salesperson.cpf || "",
        cnpj: salesperson.cnpj || "",
        company_name: salesperson.company_name || "",
        company_trade_name: salesperson.company_trade_name || "",
        pix_key: salesperson.pix_key || "",
        pix_key_type: salesperson.pix_key_type || "",
        qualification_score: salesperson.qualification_score || 0,
        qualification_level: salesperson.qualification_level || "beginner",
        status: salesperson.status || "pending_approval",
        referral_code: salesperson.referral_code || "",
        profile_photo_url: salesperson.profile_photo_url || "",
      });
    }
  }, [open, salesperson]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${salesperson.id}-${Date.now()}.${fileExt}`;
      const filePath = `salesperson-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("salesperson-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("salesperson-photos")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, profile_photo_url: publicUrl }));
      toast.success("Foto atualizada!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, profile_photo_url: "" }));
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("salespeople")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          cpf: formData.cpf || null,
          cnpj: formData.cnpj || null,
          company_name: formData.company_name || null,
          company_trade_name: formData.company_trade_name || null,
          pix_key: formData.pix_key || null,
          pix_key_type: formData.pix_key_type || null,
          qualification_score: Number(formData.qualification_score),
          qualification_level: formData.qualification_level,
          status: formData.status,
          referral_code: formData.referral_code,
          profile_photo_url: formData.profile_photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", salesperson.id);

      if (error) throw error;

      toast.success("Vendedor atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Erro ao atualizar vendedor");
    } finally {
      setIsLoading(false);
    }
  };

  const initials = formData.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Editar Vendedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Foto de Perfil */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Foto de Perfil
            </Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.profile_photo_url} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                  />
                  <Button type="button" variant="outline" size="sm" asChild disabled={isUploadingPhoto}>
                    <span>
                      {isUploadingPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Alterar Foto
                    </span>
                  </Button>
                </label>
                {formData.profile_photo_url && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Dados Pessoais
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="full_name" className="text-xs text-muted-foreground">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs text-muted-foreground">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="cpf" className="text-xs text-muted-foreground">CPF (se afiliado)</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Dados da Empresa */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Dados da Empresa (Parceiro PJ)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cnpj" className="text-xs text-muted-foreground">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <Label htmlFor="company_name" className="text-xs text-muted-foreground">Razão Social</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Empresa LTDA"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="company_trade_name" className="text-xs text-muted-foreground">Nome Fantasia</Label>
                <Input
                  id="company_trade_name"
                  value={formData.company_trade_name}
                  onChange={(e) => handleInputChange("company_trade_name", e.target.value)}
                  placeholder="Nome Fantasia"
                />
              </div>
            </div>
          </div>

          {/* Dados PIX */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Dados PIX
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pix_key_type" className="text-xs text-muted-foreground">Tipo de Chave</Label>
                <Select
                  value={formData.pix_key_type}
                  onValueChange={(value) => handleInputChange("pix_key_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIX_KEY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pix_key" className="text-xs text-muted-foreground">Chave PIX</Label>
                <Input
                  id="pix_key"
                  value={formData.pix_key}
                  onChange={(e) => handleInputChange("pix_key", e.target.value)}
                  placeholder="Sua chave PIX"
                />
              </div>
            </div>
          </div>

          {/* Qualificação */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4" />
              Qualificação (ajuste manual)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qualification_score" className="text-xs text-muted-foreground">Pontuação (0-100)</Label>
                <Input
                  id="qualification_score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.qualification_score}
                  onChange={(e) => handleInputChange("qualification_score", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="qualification_level" className="text-xs text-muted-foreground">Nível</Label>
                <Select
                  value={formData.qualification_level}
                  onValueChange={(value) => handleInputChange("qualification_level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATION_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Configurações */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Configurações
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="referral_code" className="text-xs text-muted-foreground">Código de Referência</Label>
                <Input
                  id="referral_code"
                  value={formData.referral_code}
                  onChange={(e) => handleInputChange("referral_code", e.target.value.toUpperCase())}
                  placeholder="CODIGO2024"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
