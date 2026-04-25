-- Add DELETE policies for admins to clear revenue data
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete offline bills" ON public.offline_bills;
CREATE POLICY "Admins can delete offline bills"
  ON public.offline_bills FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
