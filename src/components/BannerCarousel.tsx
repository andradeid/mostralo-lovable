import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Banner {
  id: string;
  title: string;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  video_url: string | null;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (banners.length === 0) return null;

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      window.open(banner.link_url, "_blank", "noopener,noreferrer");
    } else if (banner.video_url) {
      window.open(banner.video_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="relative w-full group">
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-lg bg-muted">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => {
            const imageUrl = isMobile && banner.mobile_image_url
              ? banner.mobile_image_url
              : banner.desktop_image_url;

            return (
              <div
                key={banner.id}
                className="min-w-full"
                onClick={() => handleBannerClick(banner)}
                style={{ cursor: banner.link_url || banner.video_url ? "pointer" : "default" }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={banner.title}
                    className="w-full h-auto object-cover"
                    style={{
                      maxHeight: isMobile ? "230px" : "300px",
                      minHeight: isMobile ? "150px" : "200px",
                    }}
                  />
                ) : (
                  <div className="w-full h-[300px] flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">Sem imagem</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Dots Navigation */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
