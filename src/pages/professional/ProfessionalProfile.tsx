import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Store, DollarSign, Save, Loader2, Upload } from "lucide-react";
import { useProfessionalData } from "@/hooks/useProfessionalData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfessionalProfile() {
  const queryClient = useQueryClient();
  const { data: professional, isLoading } = useProfessionalData();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    description: "",
  });

  // Inicializar form quando dados carregarem
  useState(() => {
    if (professional) {
      setFormData({
        name: professional.name || "",
        specialty: professional.specialty || "",
        description: professional.description || "",
      });
    }
  });

  const handleSave = async () => {
    if (!professional?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("professionals")
        .update({
          name: formData.name,
          specialty: formData.specialty,
          description: formData.description,
        })
        .eq("id", professional.id);

      if (error) throw error;

      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["professional-data"] });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !professional?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${professional.id}-${Date.now()}.${fileExt}`;
      const filePath = `professionals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("public-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("public-images")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("professionals")
        .update({ photo_url: publicUrl })
        .eq("id", professional.id);

      if (updateError) throw updateError;

      toast.success("Foto atualizada!");
      queryClient.invalidateQueries({ queryKey: ["professional-data"] });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = professional?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "P";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      {/* Photo Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {professional?.photo_url && (
                  <AvatarImage src={professional.photo_url} alt={professional.name} />
                )}
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            
            <div className="text-center md:text-left">
              <h2 className="text-xl font-semibold">{professional?.name}</h2>
              {professional?.specialty && (
                <p className="text-muted-foreground">{professional.specialty}</p>
              )}
              <Badge variant="secondary" className="mt-2">
                {professional?.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Loja Vinculada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{professional?.stores?.name}</p>
        </CardContent>
      </Card>

      {/* Commission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Comissão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-base">
            {professional?.commission_type === "percentage"
              ? `${professional.commission_value}% por serviço`
              : `R$ ${professional?.commission_value} fixo por serviço`
            }
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            A comissão é calculada automaticamente quando um serviço é marcado como concluído.
          </p>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Seu nome"
            />
          </div>

          <div>
            <Label htmlFor="specialty">Especialidade</Label>
            <Input
              id="specialty"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="Ex: Cabeleireiro, Barbeiro, Manicure"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Uma breve descrição sobre você e seu trabalho"
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
