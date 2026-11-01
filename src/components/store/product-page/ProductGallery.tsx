// Fotos do produto: imagem única, carrossel com miniaturas, ou "Sem imagem".
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { type CarouselApi } from '@/components/ui/carousel';
import type { Product } from '@/lib/productPage/types';

interface Props {
  product: Product;
  images: string[];
  currentImageIndex: number;
  setCarouselApi: (api: CarouselApi) => void;
  handleThumbnailClick: (index: number) => void;
  storeStatus: { shouldShowSchedulingRequired: boolean; canAddToCart: boolean };
}

export function ProductGallery({ product, images, currentImageIndex, setCarouselApi, handleThumbnailClick, storeStatus }: Props) {
  return (
    <div className="space-y-4">
      {images.length > 0 ? (
        images.length === 1 ? (
          <div className="w-full max-w-[500px] mx-auto aspect-[4/3] md:aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
            {storeStatus.shouldShowSchedulingRequired && (
              <Badge
                className="absolute top-4 right-4 bg-blue-500 text-white z-10 text-sm px-3 py-1"
              >
                📅 Apenas Agendamento
              </Badge>
            )}
            <img
              src={images[0]}
              alt={product.name}
              className={`w-full h-full object-cover ${
                !storeStatus.canAddToCart ? 'grayscale opacity-60' : ''
              }`}
            />
          </div>
        ) : (
          <div className="w-full max-w-[500px] mx-auto relative">
            {storeStatus.shouldShowSchedulingRequired && (
              <Badge
                className="absolute top-4 right-4 bg-blue-500 text-white z-10 text-sm px-3 py-1"
              >
                📅 Apenas Agendamento
              </Badge>
            )}
            <Carousel
              className="w-full"
              setApi={setCarouselApi}
              opts={{
                loop: true,
                align: "start"
              }}
            >
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className={`w-full h-full object-cover ${
                          !storeStatus.canAddToCart ? 'grayscale opacity-60' : ''
                        }`}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        )
      ) : (
        <div className="w-full max-w-[500px] mx-auto aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">Sem imagem</span>
        </div>
      )}

      {/* Image thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto justify-center max-w-[500px] mx-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                currentImageIndex === index
                  ? 'border-primary'
                  : 'border-gray-200'
              }`}
            >
              <img
                src={image}
                alt={`${product.name} ${index + 1}`}
                className={`w-full h-full object-cover ${
                  !storeStatus.canAddToCart ? 'grayscale opacity-60' : ''
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
