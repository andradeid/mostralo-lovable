import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

interface BannerFormProps {
  bannerId?: string;
}

interface Store {
  id: string;
  name: string;
}

export function BannerForm({ bannerId }: BannerFormProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [title, setTitle] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [desktopImage, setDesktopImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [desktopImageUrl, setDesktopImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState("sim");
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  useEffect(() => {
    loadStores();
    if (bannerId) {
      loadBanner();
    }
  }, [bannerId]);

  const loadStores = async () => {
    try {
      let query = supabase.from("stores").select("id, name");
      
      if (profile?.user_type === "store_admin") {
        query = query.eq("owner_id", profile.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setStores(data || []);
      
      if (data && data.length === 1) {
        setSelectedStoreId(data[0].id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar lojas",
        description: error.message,
      });
    }
  };

  const loadBanner = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("id", bannerId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setTitle(data.title);
        setSelectedStoreId(data.store_id);
        setDesktopImageUrl(data.desktop_image_url || "");
        setMobileImageUrl(data.mobile_image_url || "");
        setVideoUrl(data.video_url || "");
        setLinkUrl(data.link_url || "");
        setIsActive(data.is_active ? "sim" : "nao");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar banner",
        description: error.message,
      });
    }
  };

  const uploadImage = async (file: File, type: "desktop" | "mobile") => {
    if (!selectedStoreId) {
      toast({
        variant: "destructive",
        title: "Selecione uma loja primeiro",
      });
      return null;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${selectedStoreId}/${type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("store-banners")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("store-banners")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleDesktopUpload = async () => {
    if (!desktopImage) return;
    
    setUploadingDesktop(true);
    try {
      const url = await uploadImage(desktopImage, "desktop");
      if (url) {
        setDesktopImageUrl(url);
        toast({
          title: "Imagem enviada com sucesso!",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar imagem",
        description: error.message,
      });
    } finally {
      setUploadingDesktop(false);
    }
  };

  const handleMobileUpload = async () => {
    if (!mobileImage) return;
    
    setUploadingMobile(true);
    try {
      const url = await uploadImage(mobileImage, "mobile");
      if (url) {
        setMobileImageUrl(url);
        toast({
          title: "Imagem enviada com sucesso!",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar imagem",
        description: error.message,
      });
    } finally {
      setUploadingMobile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Título é obrigatório",
      });
      return;
    }
    
    if (!selectedStoreId) {
      toast({
        variant: "destructive",
        title: "Selecione uma loja",
      });
      return;
    }
    
    if (!desktopImageUrl && !mobileImageUrl) {
      toast({
        variant: "destructive",
        title: "Adicione pelo menos uma imagem",
      });
      return;
    }

    setLoading(true);
    try {
      const bannerData = {
        title,
        store_id: selectedStoreId,
        desktop_image_url: desktopImageUrl || null,
        mobile_image_url: mobileImageUrl || null,
        video_url: videoUrl || null,
        link_url: linkUrl || null,
        is_active: isActive === "sim",
      };

      if (bannerId) {
        const { error } = await supabase
          .from("banners")
          .update(bannerData)
          .eq("id", bannerId);
        
        if (error) throw error;
        
        toast({
          title: "Banner atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("banners")
          .insert(bannerData);
        
        if (error) throw error;
        
        toast({
          title: "Banner criado com sucesso!",
        });
      }
      
      navigate("/dashboard/banners");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar banner",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do banner"
            required
          />
        </div>

        <div>
          <Label htmlFor="store">Loja *</Label>
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a loja" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Image */}
        <Card>
          <CardContent className="pt-6">
            <Label>Arte para Computadores (1280x300 pixels)</Label>
            <div className="mt-2 space-y-4">
              {desktopImageUrl ? (
                <div className="relative">
                  <img
                    src={desktopImageUrl}
                    alt="Preview Desktop"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setDesktopImageUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDesktopImage(e.target.files?.[0] || null)}
                      className="hidden"
                      id="desktop-upload"
                    />
                    <label htmlFor="desktop-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Selecione sua capa clicando no campo ou arrastando o arquivo!
                      </p>
                    </label>
                  </div>
                  {desktopImage && (
                    <Button
                      type="button"
                      onClick={handleDesktopUpload}
                      disabled={uploadingDesktop || !selectedStoreId}
                    >
                      {uploadingDesktop ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "ENVIAR IMAGEM"
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Image */}
        <Card>
          <CardContent className="pt-6">
            <Label>Arte para Dispositivos Móveis (800x350 pixels)</Label>
            <div className="mt-2 space-y-4">
              {mobileImageUrl ? (
                <div className="relative">
                  <img
                    src={mobileImageUrl}
                    alt="Preview Mobile"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setMobileImageUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setMobileImage(e.target.files?.[0] || null)}
                      className="hidden"
                      id="mobile-upload"
                    />
                    <label htmlFor="mobile-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Selecione sua capa clicando no campo ou arrastando o arquivo!
                      </p>
                    </label>
                  </div>
                  {mobileImage && (
                    <Button
                      type="button"
                      onClick={handleMobileUpload}
                      disabled={uploadingMobile || !selectedStoreId}
                    >
                      {uploadingMobile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "ENVIAR IMAGEM"
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <Label htmlFor="videoUrl">Link do Vídeo</Label>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
          />
        </div>

        <div>
          <Label htmlFor="linkUrl">Link</Label>
          <Input
            id="linkUrl"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div>
          <Label>Ativo?</Label>
          <RadioGroup value={isActive} onValueChange={setIsActive} className="flex gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="sim" />
              <Label htmlFor="sim" className="font-normal cursor-pointer">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="nao" />
              <Label htmlFor="nao" className="font-normal cursor-pointer">Não</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/dashboard/banners")}
        >
          Voltar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            bannerId ? "Salvar" : "Cadastrar"
          )}
        </Button>
      </div>
    </form>
  );
}
