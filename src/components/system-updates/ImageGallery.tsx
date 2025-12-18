import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface UpdateImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface ImageGalleryProps {
  images: UpdateImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? sortedImages.length - 1 : selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === sortedImages.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden border bg-muted aspect-video"
            onClick={() => openLightbox(index)}
          >
            <img
              src={image.image_url}
              alt={image.caption || `Screenshot ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white" />
            </div>
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => closeLightbox()}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {sortedImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {selectedIndex !== null && (
              <div className="flex flex-col items-center p-4">
                <img
                  src={sortedImages[selectedIndex].image_url}
                  alt={sortedImages[selectedIndex].caption || `Screenshot ${selectedIndex + 1}`}
                  className="max-h-[80vh] max-w-full object-contain rounded"
                />
                {sortedImages[selectedIndex].caption && (
                  <p className="text-white text-sm mt-2 text-center">
                    {sortedImages[selectedIndex].caption}
                  </p>
                )}
                <p className="text-white/60 text-xs mt-1">
                  {selectedIndex + 1} / {sortedImages.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
