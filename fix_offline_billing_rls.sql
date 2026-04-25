-- Update RLS policies for offline_bills to allow admins
DROP POLICY IF EXISTS "Admins can view all offline bills" ON public.offline_bills;
CREATE POLICY "Admins can view all offline bills"
  ON public.offline_bills FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert offline bills" ON public.offline_bills;
CREATE POLICY "Admins can insert offline bills"
  ON public.offline_bills FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for offline_bill_items to allow admins
DROP POLICY IF EXISTS "Admins can view all offline bill items" ON public.offline_bill_items;
CREATE POLICY "Admins can view all offline bill items"
  ON public.offline_bill_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert offline bill items" ON public.offline_bill_items;
CREATE POLICY "Admins can insert offline bill items"
  ON public.offline_bill_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure RLS is enabled for products for updates by admins
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
