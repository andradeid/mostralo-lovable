import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NICHES } from "./MediaFilters";

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMedia?: {
    id: string;
    title: string;
    description?: string;
    category: string;
    niche: string;
    file_url: string;
    file_name: string;
    thumbnail_url?: string;
  } | null;
}

const ACCEPT_TYPES: Record<string, string> = {
  video: 'video/*',
  audio: 'audio/*',
  imagem: 'image/*',
  pdf: 'application/pdf',
  outro: '*/*',
};

export function MediaUploadDialog({ open, onOpenChange, onSuccess, editMedia }: MediaUploadDialogProps) {
  const [title, setTitle] = useState(editMedia?.title || '');
  const [description, setDescription] = useState(editMedia?.description || '');
  const [category, setCategory] = useState(editMedia?.category || 'imagem');
  const [niche, setNiche] = useState(editMedia?.niche || 'geral');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(editMedia?.thumbnail_url || '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editMedia;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 50MB.");
        return;
      }
      setFile(selectedFile);
      
      // Auto-fill title if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error("Imagem de capa muito grande. Máximo 2MB.");
        return;
      }
      setThumbnailFile(selectedFile);
      setThumbnailPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const uploadFile = async (fileToUpload: File, folder: string): Promise<string> => {
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('sales-media')
      .upload(fileName, fileToUpload);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('sales-media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Informe o título da mídia");
      return;
    }

    if (!isEditing && !file) {
      toast.error("Selecione um arquivo");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let fileUrl = editMedia?.file_url || '';
      let fileName = editMedia?.file_name || '';
      let fileSize = 0;
      let fileType = '';

      // Upload main file if new
      if (file) {
        setUploadProgress(30);
        fileUrl = await uploadFile(file, category);
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        setUploadProgress(60);
      }

      // Upload thumbnail if provided
      let thumbnailUrl = editMedia?.thumbnail_url || null;
      if (thumbnailFile) {
        setUploadProgress(70);
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails');
        setUploadProgress(80);
      } else if (thumbnailPreview === '' && editMedia?.thumbnail_url) {
        // Thumbnail was cleared
        thumbnailUrl = null;
      }

      setUploadProgress(90);

      if (isEditing) {
        // Update existing media
        const { error } = await supabase
          .from('sales_media')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            category,
            niche,
            thumbnail_url: thumbnailUrl,
            ...(file ? { file_url: fileUrl, file_name: fileName, file_size: fileSize, file_type: fileType } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editMedia.id);

        if (error) throw error;
        toast.success("Mídia atualizada com sucesso!");
      } else {
        // Create new media
        const { error } = await supabase
          .from('sales_media')
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            category,
            niche,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            thumbnail_url: thumbnailUrl,
            created_by: user.id,
          });

        if (error) throw error;
        toast.success("Mídia enviada com sucesso!");
      }

      setUploadProgress(100);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Erro ao enviar mídia");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('imagem');
    setNiche('geral');
    setFile(null);
    setThumbnailFile(null);
    setThumbnailPreview('');
  };

  // Reset form when dialog opens with edit data
  useState(() => {
    if (editMedia) {
      setTitle(editMedia.title);
      setDescription(editMedia.description || '');
      setCategory(editMedia.category);
      setNiche(editMedia.niche);
      setThumbnailPreview(editMedia.thumbnail_url || '');
    } else {
      resetForm();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Mídia' : 'Adicionar Nova Mídia'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">🎬 Vídeo</SelectItem>
                  <SelectItem value="audio">🎵 Áudio</SelectItem>
                  <SelectItem value="imagem">🖼️ Imagem</SelectItem>
                  <SelectItem value="pdf">📄 PDF</SelectItem>
                  <SelectItem value="outro">📁 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nicho</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.filter(n => n.value !== 'all').map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Arquivo {!isEditing && '*'}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_TYPES[category]}
              onChange={handleFileChange}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              ) : isEditing ? (
                <div className="space-y-1">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para substituir o arquivo atual
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {editMedia?.file_name}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Máximo 50MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail (optional for non-images) */}
          {category !== 'imagem' && (
            <div className="space-y-2">
              <Label>Imagem de Capa (opcional)</Label>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
              
              {thumbnailPreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={clearThumbnail}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicionar capa personalizada
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da mídia"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções de uso ou descrição..."
              rows={3}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                Enviando... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : isEditing ? 'Salvar Alterações' : 'Enviar Mídia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
