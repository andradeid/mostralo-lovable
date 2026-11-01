// Fotos do produto: imagem principal + galeria, carrossel e miniaturas sincronizados.
import { useEffect, useState } from 'react';
import { type CarouselApi } from '@/components/ui/carousel';
import type { Product } from '@/lib/productPage/types';

export function useProductGallery(product: Product | null) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Sincronizar carousel com currentImageIndex
  useEffect(() => {
    if (carouselApi) {
      carouselApi.scrollTo(currentImageIndex);
    }
  }, [carouselApi, currentImageIndex]);

  // Atualizar currentImageIndex quando carousel mudar
  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', handleSelect);
    return () => {
      carouselApi.off('select', handleSelect);
    };
  }, [carouselApi]);

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };

  const images = (() => {
    const allImages = [];

    // Adiciona a imagem principal primeiro
    if (product?.image_url) {
      allImages.push(product.image_url);
    }

    // Adiciona as imagens da galeria
    if (product?.image_gallery?.length > 0) {
      allImages.push(...product.image_gallery);
    }

    return allImages;
  })();

  return { images, currentImageIndex, setCarouselApi, handleThumbnailClick };
}
