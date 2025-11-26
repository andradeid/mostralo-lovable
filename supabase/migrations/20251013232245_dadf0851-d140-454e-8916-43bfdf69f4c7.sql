-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  desktop_image_url TEXT,
  mobile_image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_banners_store_id ON public.banners(store_id);
CREATE INDEX idx_banners_display_order ON public.banners(display_order);
CREATE INDEX idx_banners_is_active ON public.banners(is_active);

-- Enable Row Level Security
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Policy: Store owners can manage their banners
CREATE POLICY "Store owners can manage their banners"
ON public.banners
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = banners.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Policy: Master admins can manage all banners
CREATE POLICY "Master admins can manage all banners"
ON public.banners
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Policy: Public can view banners of active stores
CREATE POLICY "Public can view banners of active stores"
ON public.banners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = banners.store_id
    AND stores.status = 'active'
  )
  AND is_active = true
);

-- Trigger for updated_at
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-banners', 'store-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for banners
CREATE POLICY "Store owners can upload their banners"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'store-banners'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their banners"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'store-banners'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can delete their banners"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'store-banners'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Public can view banner images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-banners');