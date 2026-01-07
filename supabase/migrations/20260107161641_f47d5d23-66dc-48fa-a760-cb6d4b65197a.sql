-- Create dental_payments table
CREATE TABLE public.dental_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.dental_quotes(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Payment data
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'convenio', 'outro')),
  
  -- Installments
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  
  -- Reference
  reference_number TEXT,
  notes TEXT,
  
  -- Audit
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dental_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view payments for their store"
ON public.dental_payments FOR SELECT
USING (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert payments for their store"
ON public.dental_payments FOR INSERT
WITH CHECK (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update payments for their store"
ON public.dental_payments FOR UPDATE
USING (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete payments for their store"
ON public.dental_payments FOR DELETE
USING (store_id IN (SELECT store_id FROM public.profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX idx_dental_payments_quote ON public.dental_payments(quote_id);
CREATE INDEX idx_dental_payments_patient ON public.dental_payments(patient_id);
CREATE INDEX idx_dental_payments_date ON public.dental_payments(payment_date);
CREATE INDEX idx_dental_payments_store ON public.dental_payments(store_id);

-- Trigger for updated_at
CREATE TRIGGER update_dental_payments_updated_at
BEFORE UPDATE ON public.dental_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();