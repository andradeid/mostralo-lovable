-- Create sales_media table for media library
CREATE TABLE public.sales_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('video', 'audio', 'imagem', 'pdf', 'outro')),
  niche TEXT DEFAULT 'geral',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  thumbnail_url TEXT, -- For custom cover images (optional)
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sales_media ENABLE ROW LEVEL SECURITY;

-- Master admins can manage all media
CREATE POLICY "Master admins can manage sales media"
ON public.sales_media
FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

-- Salespeople can view active media
CREATE POLICY "Salespeople can view active sales media"
ON public.sales_media
FOR SELECT
USING (
  is_active = true 
  AND has_role(auth.uid(), 'salesperson')
);

-- Create storage bucket for sales media
INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-media', 'sales-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sales-media bucket
CREATE POLICY "Master admins can upload sales media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'sales-media' 
  AND has_role(auth.uid(), 'master_admin')
);

CREATE POLICY "Master admins can update sales media files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'sales-media' AND has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can delete sales media files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'sales-media' AND has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Anyone can view sales media files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'sales-media');

-- Create index for faster queries
CREATE INDEX idx_sales_media_category ON public.sales_media(category);
CREATE INDEX idx_sales_media_niche ON public.sales_media(niche);
CREATE INDEX idx_sales_media_is_active ON public.sales_media(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_sales_media_updated_at
BEFORE UPDATE ON public.sales_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();