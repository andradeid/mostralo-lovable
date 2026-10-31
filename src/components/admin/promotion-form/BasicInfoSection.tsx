import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { PromotionSectionProps } from './types';

export function BasicInfoSection({ formData, setFormData, uploadingImage, uploadProgress, handleImageUpload, handleRemoveImage }: PromotionSectionProps & { uploadingImage: boolean; uploadProgress: number; handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; handleRemoveImage: () => void }) {
  return (
    <>
    {/* Informações Básicas */}
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome da Promoção *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="code">Código do Cupom (opcional)</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Ex: DESCONTO10"
            className="uppercase"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Se deixar em branco, a promoção será aplicada automaticamente
          </p>
        </div>

        {/* Upload de Imagem */}
        <div>
          <Label>Imagem do Banner (opcional)</Label>
          <div className="mt-2 space-y-3">
            {formData.banner_image_url ? (
              <div className="relative group">
                <img
                  src={formData.banner_image_url}
                  alt="Banner da promoção"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="banner-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="banner-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Enviando...</p>
                      <Progress value={uploadProgress} className="w-full max-w-xs" />
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Clique para fazer upload</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG ou WEBP (máx 2MB)
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
    </>
  );
}
