-- Create periodontal_records table for gingival measurements
CREATE TABLE public.periodontal_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL CHECK (tooth_number >= 11 AND tooth_number <= 48),
  position TEXT NOT NULL CHECK (position IN ('V', 'L', 'M', 'D', 'MV', 'DV', 'ML', 'DL')),
  pocket_depth INTEGER NOT NULL DEFAULT 0 CHECK (pocket_depth >= 0 AND pocket_depth <= 15),
  gingival_recession INTEGER NOT NULL DEFAULT 0 CHECK (gingival_recession >= 0 AND gingival_recession <= 15),
  bleeding BOOLEAN NOT NULL DEFAULT false,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, tooth_number, position)
);

-- Enable RLS
ALTER TABLE public.periodontal_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view periodontal records for their store"
ON public.periodontal_records
FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create periodontal records for their store"
ON public.periodontal_records
FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update periodontal records for their store"
ON public.periodontal_records
FOR UPDATE
USING (
  store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete periodontal records for their store"
ON public.periodontal_records
FOR DELETE
USING (
  store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_periodontal_records_patient ON public.periodontal_records(patient_id);
CREATE INDEX idx_periodontal_records_tooth ON public.periodontal_records(patient_id, tooth_number);

-- Create trigger for updated_at
CREATE TRIGGER update_periodontal_records_updated_at
BEFORE UPDATE ON public.periodontal_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();