-- Add upi_id to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Create offline_bills table
CREATE TABLE IF NOT EXISTS public.offline_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'upi', -- 'cash', 'upi', 'card'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create offline_bill_items table (denormalized for history)
CREATE TABLE IF NOT EXISTS public.offline_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.offline_bills(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offline_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_bill_items ENABLE ROW LEVEL SECURITY;

-- Policies for offline_bills
CREATE POLICY "Admins can view all offline bills"
  ON public.offline_bills FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Store admins can view their store's offline bills"
  ON public.offline_bills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM store_admins 
    WHERE store_admins.user_id = auth.uid() 
    AND store_admins.store_id = offline_bills.store_id
  ));

CREATE POLICY "Store admins can insert offline bills"
  ON public.offline_bills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM store_admins 
    WHERE store_admins.user_id = auth.uid() 
    AND store_admins.store_id = offline_bills.store_id
  ));

-- Policies for offline_bill_items
CREATE POLICY "Admins can view all offline bill items"
  ON public.offline_bill_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Store admins can view their store's offline bill items"
  ON public.offline_bill_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.offline_bills
    JOIN public.store_admins ON offline_bills.store_id = store_admins.store_id
    WHERE offline_bill_items.bill_id = offline_bills.id
    AND store_admins.user_id = auth.uid()
  ));

CREATE POLICY "Store admins can insert offline bill items"
  ON public.offline_bill_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.offline_bills
    JOIN public.store_admins ON offline_bills.store_id = store_admins.store_id
    WHERE offline_bill_items.bill_id = offline_bills.id
    AND store_admins.user_id = auth.uid()
  ));
