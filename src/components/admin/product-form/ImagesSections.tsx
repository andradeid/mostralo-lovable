import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X } from 'lucide-react';
import type { ProductFormApi } from './types';

interface MainImageProps {
  form: ProductFormApi;
  uploading: boolean;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MainImageSection({ form, uploading, handleImageUpload }: MainImageProps) {
  return <div className="space-y-4">
              <h3 className="text-lg font-medium">Imagem Principal</h3>

              <div className="space-y-4">
                {form.watch('image_url') && <div className="relative inline-block">
                    <img src={form.watch('image_url')} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                    <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2" onClick={() => form.setValue('image_url', '')}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>}

                <div>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  {uploading && <div className="flex items-center space-x-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Enviando imagem...
                      </span>
                    </div>}
                </div>
              </div>
            </div>;
}

interface GalleryProps {
  form: ProductFormApi;
  galleryUploading: boolean;
  handleGalleryUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeGalleryImage: (index: number) => void;
}

export function GallerySection({ form, galleryUploading, handleGalleryUpload, removeGalleryImage }: GalleryProps) {
  return <div className="space-y-4">
              <h3 className="text-lg font-medium">Galeria de Fotos</h3>

              <div className="space-y-4">
                {form.watch('image_gallery') && form.watch('image_gallery')!.length > 0 && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {form.watch('image_gallery')!.map((imageUrl, index) => <div key={index} className="relative">
                        <img src={imageUrl} alt={`Galeria ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2" onClick={() => removeGalleryImage(index)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>)}
                  </div>}

                <div>
                  <Label>Adicionar Fotos à Galeria</Label>
                  <Input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={galleryUploading} />
                  {galleryUploading && <div className="flex items-center space-x-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Enviando fotos...
                      </span>
                    </div>}
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecione múltiplas imagens para adicionar à galeria
                  </p>
                </div>
              </div>
            </div>;
}
